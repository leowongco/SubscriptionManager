/// <reference types="@cloudflare/workers-types" />
import { Env } from '../env';

/**
 * Telegram Groups API
 * 
 * GET /api/telegram-groups - 獲取所有 Telegram 群組列表
 * GET /api/telegram-groups/:id - 獲取單個群組詳情
 * POST /api/telegram-groups - 創建新的 Telegram 群組
 * PUT /api/telegram-groups/:id - 更新群組信息
 * DELETE /api/telegram-groups/:id - 刪除群組
 */

// 審計日誌記錄函數
async function logAudit(
    db: D1Database,
    action: string,
    entityType: string,
    entityId: string,
    details: string | null
): Promise<void> {
    await db.prepare(
        'INSERT INTO audit_logs (id, action, entity_type, entity_id, details, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
    ).bind(
        crypto.randomUUID(),
        action,
        entityType,
        entityId,
        details,
        new Date().toISOString()
    ).run();
}

/**
 * GET /api/telegram-groups
 * 獲取所有 Telegram 群組列表
 * 支援篩選：billing_day, billing_cycle_type
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const billingDay = url.searchParams.get('billing_day');
        const billingCycleType = url.searchParams.get('billing_cycle_type');
        const groupId = url.searchParams.get('id');

        // 如果有 id 參數，返回單個群組詳情
        if (groupId) {
            // 獲取群組基本信息
            const group = await context.env.DB.prepare(
                'SELECT * FROM telegram_groups WHERE id = ?1'
            ).bind(groupId).first();

            if (!group) {
                return new Response(JSON.stringify({ error: '群組不存在' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 獲取關聯的訂閱列表
            const { results: subscriptions } = await context.env.DB.prepare(`
                SELECT sub.*, s.name as service_name, s.base_price, s.currency, s.cycle,
                       a.apple_id, a.balance as account_balance
                FROM subscriptions sub
                JOIN services s ON sub.service_id = s.id
                JOIN accounts a ON sub.account_id = a.id
                WHERE sub.telegram_group_id = ?1
            `).bind(groupId).all();

            // 獲取每個訂閱的成員列表
            const enrichedSubscriptions = await Promise.all(
                subscriptions.map(async (sub: any) => {
                    const { results: members } = await context.env.DB.prepare(
                        'SELECT * FROM members WHERE subscription_id = ?1'
                    ).bind(sub.id).all();
                    return { ...sub, members };
                })
            );

            // 獲取關聯的帳號數量
            const accountCount = subscriptions.length;

            // 獲取關聯的收費週期列表
            const { results: billingCycles } = await context.env.DB.prepare(
                'SELECT * FROM billing_cycles WHERE telegram_group_id = ?1 ORDER BY created_at DESC'
            ).bind(groupId).all();

            return Response.json({
                ...group,
                account_count: accountCount,
                subscriptions: enrichedSubscriptions,
                billing_cycles: billingCycles
            });
        }

        // 構建查詢條件
        let query = 'SELECT tg.*, COUNT(DISTINCT sub.account_id) as account_count FROM telegram_groups tg LEFT JOIN subscriptions sub ON tg.id = sub.telegram_group_id';
        const conditions: string[] = [];
        const params: any[] = [];

        if (billingDay) {
            conditions.push('tg.billing_day = ?');
            params.push(parseInt(billingDay));
        }

        if (billingCycleType) {
            conditions.push('tg.billing_cycle = ?');
            params.push(billingCycleType);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY tg.id ORDER BY tg.created_at DESC';

        const stmt = context.env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const { results } = await boundStmt.all();

        return Response.json(results);
    } catch (error: any) {
        console.error('獲取 Telegram 群組失敗:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

/**
 * POST /api/telegram-groups
 * 創建新的 Telegram 群組
 * 必填字段：name, telegram_link, billing_day, billing_cycle_type
 * 可選字段：notes
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();

        // 验证必填字段
        if (!body.name) {
            return new Response(JSON.stringify({ error: '缺少必填字段: name' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!body.billing_day || body.billing_day < 1 || body.billing_day > 31) {
            return new Response(JSON.stringify({ error: '扣費日必須在 1-31 之間' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!body.billing_cycle_type || !['monthly', 'biannually', 'yearly'].includes(body.billing_cycle_type)) {
            return new Response(JSON.stringify({ error: '收費週期必須是 monthly, biannually 或 yearly' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const id = body.id || crypto.randomUUID();

        // 插入群組記錄
        await context.env.DB.prepare(
            'INSERT INTO telegram_groups (id, name, telegram_link, billing_day, billing_cycle_type, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
        ).bind(
            id,
            body.name,
            body.telegram_link || null,
            body.billing_day,
            body.billing_cycle_type,
            body.notes || null,
            new Date().toISOString()
        ).run();

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'CREATE',
            'telegram_group',
            id,
            JSON.stringify({ name: body.name, billing_day: body.billing_day, billing_cycle_type: body.billing_cycle_type })
        );

        // 返回創建的群組
        const group = await context.env.DB.prepare(
            'SELECT * FROM telegram_groups WHERE id = ?1'
        ).bind(id).first();

        return Response.json(group, { status: 201 });
    } catch (error: any) {
        console.error('創建 Telegram 群組失敗:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

/**
 * PUT /api/telegram-groups/:id
 * 更新群組信息
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: '缺少群組 ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const request = context.request;
        const body = await request.json<any>();

        // 檢查群組是否存在
        const existingGroup = await context.env.DB.prepare(
            'SELECT * FROM telegram_groups WHERE id = ?1'
        ).bind(id).first();

        if (!existingGroup) {
            return new Response(JSON.stringify({ error: '群組不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 验证扣費日
        if (body.billing_day && (body.billing_day < 1 || body.billing_day > 31)) {
            return new Response(JSON.stringify({ error: '扣費日必須在 1-31 之間' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 验证收費週期
        if (body.billing_cycle_type && !['monthly', 'biannually', 'yearly'].includes(body.billing_cycle_type)) {
            return new Response(JSON.stringify({ error: '收費週期必須是 monthly, biannually 或 yearly' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 更新群組記錄
        await context.env.DB.prepare(`
            UPDATE telegram_groups 
            SET name = ?1, telegram_link = ?2, billing_day = ?3, billing_cycle_type = ?4, notes = ?5
            WHERE id = ?6
        `).bind(
            body.name || existingGroup.name,
            body.telegram_link || existingGroup.telegram_link,
            body.billing_day || existingGroup.billing_day,
            body.billing_cycle_type || existingGroup.billing_cycle_type,
            body.notes || existingGroup.notes,
            id
        ).run();

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'UPDATE',
            'telegram_group',
            id,
            JSON.stringify(body)
        );

        // 返回更新後的群組
        const group = await context.env.DB.prepare(
            'SELECT * FROM telegram_groups WHERE id = ?1'
        ).bind(id).first();

        return Response.json(group);
    } catch (error: any) {
        console.error('更新 Telegram 群組失敗:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

/**
 * DELETE /api/telegram-groups/:id
 * 刪除群組（需要先解除帳號關聯）
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: '缺少群組 ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查群組是否存在
        const existingGroup = await context.env.DB.prepare(
            'SELECT * FROM telegram_groups WHERE id = ?1'
        ).bind(id).first();

        if (!existingGroup) {
            return new Response(JSON.stringify({ error: '群組不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查是否有關聯的訂閱
        const { results: subscriptions } = await context.env.DB.prepare(
            'SELECT * FROM subscriptions WHERE telegram_group_id = ?1'
        ).bind(id).all();

        if (subscriptions.length > 0) {
            return new Response(
                JSON.stringify({ error: `無法刪除群組，仍有 ${subscriptions.length} 個訂閱關聯到此群組。請先解除關聯。` }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // 檢查是否有關聯的收費週期
        const { results: billingCycles } = await context.env.DB.prepare(
            'SELECT * FROM billing_cycles WHERE telegram_group_id = ?1'
        ).bind(id).all();

        if (billingCycles.length > 0) {
            return new Response(
                JSON.stringify({ error: `無法刪除群組，仍有 ${billingCycles.length} 個收費週期關聯到此群組。請先刪除收費週期。` }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // 刪除群組
        await context.env.DB.prepare(
            'DELETE FROM telegram_groups WHERE id = ?1'
        ).bind(id).run();

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'DELETE',
            'telegram_group',
            id,
            JSON.stringify({ name: existingGroup.name })
        );

        return Response.json({ success: true, message: '群組已刪除' });
    } catch (error: any) {
        console.error('刪除 Telegram 群組失敗:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};