/// <reference types="@cloudflare/workers-types" />
import { Env } from '../env';

/**
 * Member Payments API
 * 
 * GET /api/member-payments - 獲取成員付款記錄
 * POST /api/member-payments - 創建付款記錄
 * PUT /api/member-payments/:id - 更新付款狀態（標記為已付款、已退款等）
 * POST /api/member-payments/refund - 處理退款
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
 * GET /api/member-payments
 * 獲取成員付款記錄
 * 支援篩選：billing_cycle_id, account_id, status
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const billingCycleId = url.searchParams.get('billing_cycle_id');
        const accountId = url.searchParams.get('account_id');
        const status = url.searchParams.get('status'); // paid, unpaid, refunded
        const paymentId = url.searchParams.get('id');

        // 如果有 id 參數，返回單個付款記錄詳情
        if (paymentId) {
            const payment = await context.env.DB.prepare(`
                SELECT mp.*, m.email as member_email, m.memo as member_memo,
                       bc.start_date, bc.end_date, bc.amount_per_member, bc.status as cycle_status,
                       tg.name as group_name,
                       sub.id as subscription_id, s.name as service_name
                FROM member_payments mp
                JOIN members m ON mp.member_id = m.id
                JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
                JOIN telegram_groups tg ON bc.telegram_group_id = tg.id
                JOIN subscriptions sub ON m.subscription_id = sub.id
                JOIN services s ON sub.service_id = s.id
                WHERE mp.id = ?1
            `).bind(paymentId).first();

            if (!payment) {
                return new Response(JSON.stringify({ error: '付款記錄不存在' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return Response.json(payment);
        }

        // 構建查詢條件
        let query = `
            SELECT mp.*, m.email as member_email, m.memo as member_memo,
                   bc.start_date, bc.end_date, bc.amount_per_member, bc.status as cycle_status,
                   tg.name as group_name,
                   sub.id as subscription_id, s.name as service_name, a.apple_id
            FROM member_payments mp
            JOIN members m ON mp.member_id = m.id
            JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
            JOIN telegram_groups tg ON bc.telegram_group_id = tg.id
            JOIN subscriptions sub ON m.subscription_id = sub.id
            JOIN services s ON sub.service_id = s.id
            JOIN accounts a ON sub.account_id = a.id
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (billingCycleId) {
            conditions.push('mp.billing_cycle_id = ?');
            params.push(billingCycleId);
        }

        if (accountId) {
            conditions.push('sub.account_id = ?');
            params.push(accountId);
        }

        if (status === 'paid') {
            conditions.push('mp.paid = 1');
        } else if (status === 'unpaid') {
            conditions.push('mp.paid = 0');
        } else if (status === 'refunded') {
            conditions.push('mp.refund_amount IS NOT NULL');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY mp.created_at DESC';

        const stmt = context.env.DB.prepare(query);
        const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
        const { results } = await boundStmt.all();

        return Response.json(results);
    } catch (error: any) {
        console.error('獲取成員付款記錄失敗:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

/**
 * POST /api/member-payments
 * 創建付款記錄
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();

        // 验证必填字段
        if (!body.billing_cycle_id) {
            return new Response(JSON.stringify({ error: '缺少必填字段: billing_cycle_id' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!body.member_id) {
            return new Response(JSON.stringify({ error: '缺少必填字段: member_id' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查帳單週期是否存在
        const cycle = await context.env.DB.prepare(
            'SELECT * FROM billing_cycles WHERE id = ?1'
        ).bind(body.billing_cycle_id).first();

        if (!cycle) {
            return new Response(JSON.stringify({ error: '帳單週期不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查成員是否存在
        const member = await context.env.DB.prepare(
            'SELECT * FROM members WHERE id = ?1'
        ).bind(body.member_id).first();

        if (!member) {
            return new Response(JSON.stringify({ error: '成員不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查是否已存在付款記錄
        const existingPayment = await context.env.DB.prepare(
            'SELECT * FROM member_payments WHERE billing_cycle_id = ?1 AND member_id = ?2'
        ).bind(body.billing_cycle_id, body.member_id).first();

        if (existingPayment) {
            return new Response(JSON.stringify({ error: '該成員在此帳單週期已有付款記錄' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const id = body.id || crypto.randomUUID();
        const paid = body.paid || false;
        const paidAt = paid ? new Date().toISOString() : null;

        // 插入付款記錄
        await context.env.DB.prepare(
            'INSERT INTO member_payments (id, billing_cycle_id, member_id, paid, paid_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
        ).bind(
            id,
            body.billing_cycle_id,
            body.member_id,
            paid,
            paidAt,
            new Date().toISOString()
        ).run();

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'CREATE',
            'member_payment',
            id,
            JSON.stringify({
                billing_cycle_id: body.billing_cycle_id,
                member_id: body.member_id,
                paid: paid
            })
        );

        // 返回創建的付款記錄
        const payment = await context.env.DB.prepare(`
            SELECT mp.*, m.email as member_email, m.memo as member_memo,
                   bc.start_date, bc.end_date, bc.amount_per_member
            FROM member_payments mp
            JOIN members m ON mp.member_id = m.id
            JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
            WHERE mp.id = ?1
        `).bind(id).first();

        return Response.json(payment, { status: 201 });
    } catch (error: any) {
        console.error('創建付款記錄失敗:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

/**
 * PUT /api/member-payments/:id
 * 更新付款狀態（標記為已付款、已退款等）
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: '缺少付款記錄 ID' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const request = context.request;
        const body = await request.json<any>();

        // 檢查付款記錄是否存在
        const existingPayment = await context.env.DB.prepare(
            'SELECT mp.*, bc.status as cycle_status FROM member_payments mp JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id WHERE mp.id = ?1'
        ).bind(id).first();

        if (!existingPayment) {
            return new Response(JSON.stringify({ error: '付款記錄不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查帳單週期狀態
        if ((existingPayment as any).cycle_status === 'completed') {
            return new Response(JSON.stringify({ error: '帳單週期已完成，無法修改付款狀態' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 更新付款記錄
        const paid = body.paid !== undefined ? body.paid : (existingPayment as any).paid;
        let paidAt = (existingPayment as any).paid_at;

        if (body.paid === true && !(existingPayment as any).paid) {
            // 標記為已付款
            paidAt = new Date().toISOString();
        } else if (body.paid === false) {
            // 取消付款標記
            paidAt = null;
        }

        await context.env.DB.prepare(`
            UPDATE member_payments 
            SET paid = ?1, paid_at = ?2
            WHERE id = ?3
        `).bind(
            paid,
            paidAt,
            id
        ).run();

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'UPDATE',
            'member_payment',
            id,
            JSON.stringify({
                paid: paid,
                paid_at: paidAt
            })
        );

        // 返回更新後的付款記錄
        const payment = await context.env.DB.prepare(`
            SELECT mp.*, m.email as member_email, m.memo as member_memo,
                   bc.start_date, bc.end_date, bc.amount_per_member
            FROM member_payments mp
            JOIN members m ON mp.member_id = m.id
            JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
            WHERE mp.id = ?1
        `).bind(id).first();

        return Response.json(payment);
    } catch (error: any) {
        console.error('更新付款記錄失敗:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

/**
 * POST /api/member-payments/refund
 * 處理退款
 */
export const onRequestPostRefund: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();

        // 验证必填字段
        if (!body.member_payment_id) {
            return new Response(JSON.stringify({ error: '缺少必填字段: member_payment_id' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!body.refund_amount || body.refund_amount <= 0) {
            return new Response(JSON.stringify({ error: '退款金額必須大於 0' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查付款記錄是否存在
        const existingPayment = await context.env.DB.prepare(`
            SELECT mp.*, bc.amount_per_member, bc.status as cycle_status
            FROM member_payments mp
            JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
            WHERE mp.id = ?1
        `).bind(body.member_payment_id).first();

        if (!existingPayment) {
            return new Response(JSON.stringify({ error: '付款記錄不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查是否已付款
        if (!(existingPayment as any).paid) {
            return new Response(JSON.stringify({ error: '該成員尚未付款，無需退款' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 檢查退款金額是否合理
        const amountPerMember = (existingPayment as any).amount_per_member;
        if (body.refund_amount > amountPerMember) {
            return new Response(JSON.stringify({ error: `退款金額不能超過每人金額 ${amountPerMember}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 更新退款信息
        await context.env.DB.prepare(`
            UPDATE member_payments 
            SET refund_amount = ?1, refund_at = ?2
            WHERE id = ?3
        `).bind(
            body.refund_amount,
            new Date().toISOString(),
            body.member_payment_id
        ).run();

        // 記錄審計日誌
        await logAudit(
            context.env.DB,
            'REFUND',
            'member_payment',
            body.member_payment_id,
            JSON.stringify({
                refund_amount: body.refund_amount,
                refund_at: new Date().toISOString()
            })
        );

        // 返回更新後的付款記錄
        const payment = await context.env.DB.prepare(`
            SELECT mp.*, m.email as member_email, m.memo as member_memo,
                   bc.start_date, bc.end_date, bc.amount_per_member
            FROM member_payments mp
            JOIN members m ON mp.member_id = m.id
            JOIN billing_cycles bc ON mp.billing_cycle_id = bc.id
            WHERE mp.id = ?1
        `).bind(body.member_payment_id).first();

        return Response.json(payment);
    } catch (error: any) {
        console.error('處理退款失敗:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};