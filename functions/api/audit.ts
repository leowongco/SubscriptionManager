/// <reference types="@cloudflare/workers-types" />
import { Env } from '../env';

// GET /api/audit - Get audit logs with filtering
export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const params = url.searchParams;
        
        // Extract query parameters
        const actionType = params.get('action_type');
        const entityType = params.get('entity_type');
        const entityId = params.get('entity_id');
        const operator = params.get('operator');
        const startDate = params.get('start_date');
        const endDate = params.get('end_date');
        const limit = parseInt(params.get('limit') || '100');
        const offset = parseInt(params.get('offset') || '0');

        // Build query with filters
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const bindParams: any[] = [];
        let paramIndex = 1;

        if (actionType) {
            query += ` AND action_type = ?${paramIndex}`;
            bindParams.push(actionType);
            paramIndex++;
        }

        if (entityType) {
            query += ` AND entity_type = ?${paramIndex}`;
            bindParams.push(entityType);
            paramIndex++;
        }

        if (entityId) {
            query += ` AND entity_id = ?${paramIndex}`;
            bindParams.push(entityId);
            paramIndex++;
        }

        if (operator) {
            query += ` AND operator = ?${paramIndex}`;
            bindParams.push(operator);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND created_at >= ?${paramIndex}`;
            bindParams.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND created_at <= ?${paramIndex}`;
            bindParams.push(endDate);
            paramIndex++;
        }

        // Add ordering and pagination
        query += ` ORDER BY created_at DESC LIMIT ?${paramIndex} OFFSET ?${paramIndex + 1}`;
        bindParams.push(limit, offset);

        const stmt = context.env.DB.prepare(query);
        const boundStmt = bindParams.length > 0 ? stmt.bind(...bindParams) : stmt;
        const { results } = await boundStmt.all();

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
        const countBindParams: any[] = [];
        paramIndex = 1;

        if (actionType) {
            countQuery += ` AND action_type = ?${paramIndex}`;
            countBindParams.push(actionType);
            paramIndex++;
        }

        if (entityType) {
            countQuery += ` AND entity_type = ?${paramIndex}`;
            countBindParams.push(entityType);
            paramIndex++;
        }

        if (entityId) {
            countQuery += ` AND entity_id = ?${paramIndex}`;
            countBindParams.push(entityId);
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

        // Parse JSON fields
        const parsedResults = results.map((log: any) => ({
            ...log,
            old_value: log.old_value ? JSON.parse(log.old_value) : null,
            new_value: log.new_value ? JSON.parse(log.new_value) : null
        }));

        const totalCount = countResult?.total || 0;

        return Response.json({
            data: parsedResults,
            pagination: {
                total: totalCount,
                limit,
                offset,
                has_more: totalCount > offset + limit
            }
        });
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
