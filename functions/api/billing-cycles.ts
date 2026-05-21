/// <reference types="@cloudflare/workers-types" />
import { Env } from '../env';

/**
 * Billing Cycles API
 * 
 * GET /api/billing-cycles - 獲取帳單週期列表
 * GET /api/billing-cycles/:id - 獲取單個帳單週期詳情
 * POST /api/billing-cycles - 創建新的帳單週期
 * PUT /api/billing-cycles/:id - 更新帳單週期信息
 * DELETE /api/billing-cycles/:id - 刪除帳單週期
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
 * GET /api/billing-cycles
 * 獲取帳單週期列表
 * 支援篩選：telegram_group_id, status
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const telegramGroupId = url.searchParams.get('telegram_group_id');
        const status = url.searchParams.get('status');
        const cycleId = url.searchParams.get('id');

        // 如果有 id 參數，返回單個帳單週期詳情
        if (cycleId) {
            // 獲取帳單週期基本信息
            const cycle = await context.env.DB.prepare(
                'SELECT bc.*, tg.name as group_name, tg.billing_cycle_type FROM billing_cycles bc JOIN telegram_groups tg ON bc.telegram_group_id = tg.id WHERE bc.id = ?1'
            ).bind(cycleId).first();

            if (!cycle) {
                return new Response('帳單週期不存在', { status: 404 });
            }

            // 獲取成員付款狀態
            const { results: memberPayments } = await context.env.DB.prepare(`
                SELECT mp.*, m.email as member_email, m.memo as member_memo,
                       sub.id as subscription_id, s.name as service_name
                FROM member_payments mp
                JOIN members m ON mp.member_id = m.id
                JOIN subscriptions sub ON m.subscription_id = sub.id
                JOIN services s ON sub.service_id = s.id
                WHERE mp.billing_cycle_id = ?1
                ORDER BY mp.created_at
            `).bind(cycleId).all();

            // 計算統計信息
            const totalMembers = memberPayments.length;
            const paidMembers = memberPayments.filter((mp: any) => mp.paid).length;
            const unpaidMembers = totalMembers - paidMembers;
            const amountPerMember = (cycle as any).amount_per_member || 0;
            const totalAmount = paidMembers * amountPerMember;

            return Response.json({
                ...cycle,
                member_payments: memberPayments,
                stats: {
                    total_members: totalMembers,
                    paid_members: paidMembers,
                    unpaid_members: unpaidMembers,
                    total_amount: totalAmount,
                    collection_rate: totalMembers > 0 ? (paidMembers / totalMembers * 100).toFixed(2) : 0
                }
            });
        }

        // 構建查詢條件
        let query = `
            SELECT bc.*, tg.name as group_name, tg.billing_cycle_type,
                   COUNT(mp.id) as total_members,
                   SUM(CASE WHEN mp.paid = 1 THEN 1 ELSE 0 END) as paid_members
            FROM billing_cycles bc
            JOIN telegram_groups tg ON bc.telegram_group_id = tg.id
            LEFT JOIN member_payments mp ON bc.id = mp.billing_cycle_id
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (telegramGroupId) {
            conditions.push('bc.telegram_group_id = ?');
            params.push(telegramGroupId);
        }

        if (status) {
            conditions.push('bc.status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY bc.id ORDER BY bc.created_at DESC';

        const stmt = context.env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const { results } = await boundStmt.all();

        // 計算每個週期的收款率
        const enrichedResults = results.map((cycle: any) => ({
            ...cycle,
            collection_rate: cycle.total_members > 0 
                ? ((cycle.paid_members / cycle.total_members) * 100).toFixed(2) 
                : 0
        }));

        return Response.json(enrichedResults);
    } catch (error: any) {
        console.error('獲取帳單週期失敗:', error);
        return new Response(error.message, { status: 500 });
    }
};

/**
 * POST /api/billing-cycles
 * 創建新的帳單週期
 * 自動計算 total_amount（基於關聯帳號的訂閱）
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();

        // 验证必填字段
        if (!body.telegram_group_id) {
            return new Response('缺少必填字段: telegram_group_id', { status: 400 });
        }

        if (!body.start_date) {
            return new Response('缺少必填字段: start_date', { status: 400 });
        }

        if (!body.end_date) {
            return new Response('缺少必填字段: end_date', { status: 400 });
        }

        if (!body.amount_per_member || body.amount_per_member <= 0) {
            return new Response('每人金額必須大於 0', { status: 400 });
        }

        // 檢查群組是否存在
        const group = await context.env.DB.prepare(
            'SELECT * FROM telegram_groups WHERE id = ?1'
        ).bind(body.telegram_group_id).first();

        if (!group) {
            return new Response('Telegram 群組不存在', { status: 404 });
        }

        const id = body.id || crypto.randomUUID();

        // 插入帳單週期記錄
        await context.env.DB.prepare(
            'INSERT INTO billing_cycles (id, telegram_group_id, start_date, end_date, amount_per_member, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
        ).bind(
            id,
            body.telegram_group_id,
            body.start_date,
            body.end_date,
            body.amount_per_member,
            body.status || 'active',
            new Date().toISOString()
        ).run();

        // 自動創建成員付款記錄
        // 獲取該群組關聯的所有訂閱的成員
        const { results: subscriptions } = await context.env.DB.prepare(
            'SELECT id FROM subscriptions WHERE telegram_group_id = ?1'
        ).bind(body.telegram_group_id).all();

        let memberCount = 0;
        for (const sub of subscriptions) {
            const { results: members } = await context.env.DB.prepare(
                'SELECT id FROM members WHERE subscription_id = ?1'
            ).bind(sub.id).all();

            for (const member of members) {
                // 創建付款記錄
                await context.env.DB.prepare(
                    'INSERT INTO member_payments (id, billing_cycle_id, member_id, paid, created_at) VALUES (?1, ?2, ?3, ?4, ?5)'
                ).bind(
                    crypto.randomUUID(),
                    id,
                    member.id,
                    false,
                    new Date().toISOString()
                ).run();
                memberCount++;
            }
        }

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'CREATE',
            'billing_cycle',
            id,
            JSON.stringify({
                telegram_group_id: body.telegram_group_id,
                start_date: body.start_date,
                end_date: body.end_date,
                amount_per_member: body.amount_per_member,
                member_count: memberCount
            })
        );

        // 返回創建的帳單週期
        const cycle = await context.env.DB.prepare(
            'SELECT bc.*, tg.name as group_name FROM billing_cycles bc JOIN telegram_groups tg ON bc.telegram_group_id = tg.id WHERE bc.id = ?1'
        ).bind(id).first();

        return Response.json({
            ...cycle,
            member_count: memberCount
        }, { status: 201 });
    } catch (error: any) {
        console.error('創建帳單週期失敗:', error);
        return new Response(error.message, { status: 500 });
    }
};

/**
 * PUT /api/billing-cycles/:id
 * 更新帳單週期信息
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response('缺少帳單週期 ID', { status: 400 });
        }

        const request = context.request;
        const body = await request.json<any>();

        // 檢查帳單週期是否存在
        const existingCycle = await context.env.DB.prepare(
            'SELECT * FROM billing_cycles WHERE id = ?1'
        ).bind(id).first();

        if (!existingCycle) {
            return new Response('帳單週期不存在', { status: 404 });
        }

        // 验证狀態
        if (body.status && !['active', 'completed', 'refunded'].includes(body.status)) {
            return new Response('狀態必須是 active, completed 或 refunded', { status: 400 });
        }

        // 验证金額
        if (body.amount_per_member && body.amount_per_member <= 0) {
            return new Response('每人金額必須大於 0', { status: 400 });
        }

        // 更新帳單週期記錄
        await context.env.DB.prepare(`
            UPDATE billing_cycles 
            SET start_date = ?1, end_date = ?2, amount_per_member = ?3, status = ?4
            WHERE id = ?5
        `).bind(
            body.start_date || existingCycle.start_date,
            body.end_date || existingCycle.end_date,
            body.amount_per_member || existingCycle.amount_per_member,
            body.status || existingCycle.status,
            id
        ).run();

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'UPDATE',
            'billing_cycle',
            id,
            JSON.stringify(body)
        );

        // 返回更新後的帳單週期
        const cycle = await context.env.DB.prepare(
            'SELECT bc.*, tg.name as group_name FROM billing_cycles bc JOIN telegram_groups tg ON bc.telegram_group_id = tg.id WHERE bc.id = ?1'
        ).bind(id).first();

        return Response.json(cycle);
    } catch (error: any) {
        console.error('更新帳單週期失敗:', error);
        return new Response(error.message, { status: 500 });
    }
};

/**
 * DELETE /api/billing-cycles/:id
 * 刪除帳單週期
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response('缺少帳單週期 ID', { status: 400 });
        }

        // 檢查帳單週期是否存在
        const existingCycle = await context.env.DB.prepare(
            'SELECT * FROM billing_cycles WHERE id = ?1'
        ).bind(id).first();

        if (!existingCycle) {
            return new Response('帳單週期不存在', { status: 404 });
        }

        // 檢查是否有已付款的記錄
        const { results: paidPayments } = await context.env.DB.prepare(
            'SELECT * FROM member_payments WHERE billing_cycle_id = ?1 AND paid = 1'
        ).bind(id).all();

        if (paidPayments.length > 0) {
            return new Response(
                `無法刪除帳單週期，已有 ${paidPayments.length} 位成員付款。請先處理退款。`,
                { status: 400 }
            );
        }

        // 刪除所有成員付款記錄
        await context.env.DB.prepare(
            'DELETE FROM member_payments WHERE billing_cycle_id = ?1'
        ).bind(id).run();

        // 刪除帳單週期
        await context.env.DB.prepare(
            'DELETE FROM billing_cycles WHERE id = ?1'
        ).bind(id).run();

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'DELETE',
            'billing_cycle',
            id,
            JSON.stringify({
                telegram_group_id: existingCycle.telegram_group_id,
                start_date: existingCycle.start_date,
                end_date: existingCycle.end_date
            })
        );

        return Response.json({ success: true, message: '帳單週期已刪除' });
    } catch (error: any) {
        console.error('刪除帳單週期失敗:', error);
        return new Response(error.message, { status: 500 });
    }
};