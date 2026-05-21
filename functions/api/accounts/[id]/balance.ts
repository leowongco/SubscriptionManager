/// <reference types="@cloudflare/workers-types" />
import { Env } from '../../../env';

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

// PATCH /api/accounts/[id]/balance - Adjust account balance
export const onRequestPatch: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();
        
        // Get account ID from URL path
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const accountId = pathParts[3]; // /api/accounts/[id]/balance
        
        if (!accountId) {
            return new Response(JSON.stringify({ error: 'Missing account ID' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Validate required fields
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
        ).bind(accountId).first() as any;

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
            ).bind(newBalance, accountId),
            
            // Insert balance adjustment record
            context.env.DB.prepare(
                `INSERT INTO balance_adjustments 
                (id, account_id, old_balance, new_balance, adjustment_amount, reason, operator, ip_address, user_agent, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                adjustmentId,
                accountId,
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
                accountId,
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
            account_id: accountId,
            old_balance: oldBalance,
            new_balance: newBalance,
            adjustment_amount: adjustmentAmount,
            reason: body.reason,
            operator: body.operator,
            created_at: new Date().toISOString()
        }, { status: 200 });
    } catch (error: any) {
        console.error('Error adjusting account balance:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
