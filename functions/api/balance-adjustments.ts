/// <reference types="@cloudflare/workers-types" />
import { Env } from '../env';

// Helper function to get client IP
function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('cf-connecting-ip') || 'unknown';
}

// Helper function to get user agent
function getUserAgent(request: Request): string {
    return request.headers.get('user-agent') || 'unknown';
}

// POST /api/balance-adjustments - Create a balance adjustment
export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();
        
        // Validate required fields
        if (!body.account_id) {
            return new Response(JSON.stringify({ error: 'Missing account_id' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (body.adjustment_amount === undefined || body.adjustment_amount === null) {
            return new Response(JSON.stringify({ error: 'Missing adjustment_amount' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!body.reason) {
            return new Response(JSON.stringify({ error: 'Missing reason' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!body.operator) {
            return new Response(JSON.stringify({ error: 'Missing operator' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const adjustmentAmount = parseFloat(body.adjustment_amount);
        if (isNaN(adjustmentAmount)) {
            return new Response(JSON.stringify({ error: 'Invalid adjustment_amount' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get current account balance
        const account = await context.env.DB.prepare(
            'SELECT * FROM accounts WHERE id = ?'
        ).bind(body.account_id).first() as any;

        if (!account) {
            return new Response(JSON.stringify({ error: 'Account not found' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const oldBalance = account.balance || 0;
        const newBalance = oldBalance + adjustmentAmount;

        // Generate IDs
        const adjustmentId = 'adj_' + crypto.randomUUID();
        const auditLogId = 'audit_' + crypto.randomUUID();

        // Get client info
        const ipAddress = getClientIP(request);
        const userAgent = getUserAgent(request);

        // Start transaction (using batch)
        const statements = [
            // Update account balance
            context.env.DB.prepare(
                'UPDATE accounts SET balance = ? WHERE id = ?'
            ).bind(newBalance, body.account_id),
            
            // Insert balance adjustment record
            context.env.DB.prepare(
                `INSERT INTO balance_adjustments 
                (id, account_id, old_balance, new_balance, adjustment_amount, reason, operator, ip_address, user_agent, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                adjustmentId,
                body.account_id,
                oldBalance,
                newBalance,
                adjustmentAmount,
                body.reason,
                body.operator,
                ipAddress,
                userAgent,
                new Date().toISOString()
            ),
            
            // Insert audit log
            context.env.DB.prepare(
                `INSERT INTO audit_logs 
                (id, action_type, entity_type, entity_id, old_value, new_value, reason, operator, ip_address, user_agent, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                auditLogId,
                'balance_adjustment',
                'account',
                body.account_id,
                JSON.stringify({ balance: oldBalance }),
                JSON.stringify({ balance: newBalance }),
                body.reason,
                body.operator,
                ipAddress,
                userAgent,
                new Date().toISOString()
            )
        ];

        await context.env.DB.batch(statements);

        return Response.json({
            id: adjustmentId,
            account_id: body.account_id,
            old_balance: oldBalance,
            new_balance: newBalance,
            adjustment_amount: adjustmentAmount,
            reason: body.reason,
            operator: body.operator,
            created_at: new Date().toISOString()
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating balance adjustment:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

// GET /api/balance-adjustments - Get balance adjustments list
export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const params = url.searchParams;
        
        // Extract query parameters
        const accountId = params.get('account_id');
        const operator = params.get('operator');
        const startDate = params.get('start_date');
        const endDate = params.get('end_date');
        const limit = parseInt(params.get('limit') || '100');
        const offset = parseInt(params.get('offset') || '0');

        // Build query with filters
        let query = `
            SELECT ba.*, a.apple_id, a.group_name 
            FROM balance_adjustments ba 
            LEFT JOIN accounts a ON ba.account_id = a.id 
            WHERE 1=1
        `;
        const bindParams: any[] = [];
        let paramIndex = 1;

        if (accountId) {
            query += ` AND ba.account_id = ?${paramIndex}`;
            bindParams.push(accountId);
            paramIndex++;
        }

        if (operator) {
            query += ` AND ba.operator = ?${paramIndex}`;
            bindParams.push(operator);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND ba.created_at >= ?${paramIndex}`;
            bindParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND ba.created_at <= ?${paramIndex}`;
            bindParams.push(endDate);
            paramIndex++;
        }

        // Add ordering and pagination
        query += ` ORDER BY ba.created_at DESC LIMIT ?${paramIndex} OFFSET ?${paramIndex + 1}`;
        bindParams.push(limit, offset);

        const stmt = context.env.DB.prepare(query);
        const boundStmt = bindParams.length > 0 ? stmt.bind(...bindParams) : stmt;
        const { results } = await boundStmt.all();

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM balance_adjustments WHERE 1=1';
        const countBindParams: any[] = [];
        paramIndex = 1;

        if (accountId) {
            countQuery += ` AND account_id = ?${paramIndex}`;
            countBindParams.push(accountId);
            paramIndex++;
        }

        if (operator) {
            countQuery += ` AND operator = ?${paramIndex}`;
            countBindParams.push(operator);
            paramIndex++;
        }

        if (startDate) {
            countQuery += ` AND created_at >= ?${paramIndex}`;
            countBindParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            countQuery += ` AND created_at <= ?${paramIndex}`;
            countBindParams.push(endDate);
            paramIndex++;
        }

        const countStmt = context.env.DB.prepare(countQuery);
        const boundCountStmt = countBindParams.length > 0 ? countStmt.bind(...countBindParams) : countStmt;
        const countResult = await boundCountStmt.first() as { total: number } | null;

        const totalCount = countResult?.total || 0;

        return Response.json({
            data: results,
            pagination: {
                total: totalCount,
                limit,
                offset,
                has_more: totalCount > offset + limit
            }
        });
    } catch (error: any) {
        console.error('Error fetching balance adjustments:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
