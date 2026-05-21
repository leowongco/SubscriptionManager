import { Env } from '../env';

interface RechargeItem {
  account_id: string;
  amount: number;
  memo?: string;
  operator?: string;
  reason?: string;
}

interface RechargeResult {
  account_id: string;
  apple_id: string | null;
  success: boolean;
  message?: string;
  new_balance?: number;
}

// 審計日誌記錄函數
async function logAudit(
    db: D1Database,
    action: string,
    entityType: string,
    entityId: string,
    details: string | null,
    operator: string | null
): Promise<void> {
    await db.prepare(
        'INSERT INTO audit_logs (id, action, entity_type, entity_id, details, operator, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
    ).bind(
        crypto.randomUUID(),
        action,
        entityType,
        entityId,
        details,
        operator || 'system',
        new Date().toISOString()
    ).run();
}

// 餘額調整記錄函數
async function logBalanceAdjustment(
    db: D1Database,
    accountId: string,
    adjustmentAmount: number,
    reason: string,
    operator: string
): Promise<void> {
    await db.prepare(
        'INSERT INTO balance_adjustments (id, account_id, adjustment_amount, reason, operator, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
    ).bind(
        crypto.randomUUID(),
        accountId,
        adjustmentAmount,
        reason,
        operator,
        new Date().toISOString()
    ).run();
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();
        
        // 支援兩種格式：
        // 1. 原有格式：Array of recharge items
        // 2. 新格式：{ account_ids: string[], amount: number, reason: string, operator: string }
        
        let rechargeItems: RechargeItem[] = [];
        let operator = 'system';
        
        if (Array.isArray(body)) {
            // 原有格式
            rechargeItems = body.map(item => ({
                account_id: item.account_id,
                amount: item.amount,
                memo: item.gift_card || item.memo,
                operator: item.operator || 'system',
                reason: item.reason || 'Batch recharge'
            }));
        } else if (body.account_ids && Array.isArray(body.account_ids)) {
            // 新格式 - 批量加值
            const { account_ids, amount, reason, operator: op, gift_card } = body;
            operator = op || 'system';
            
            rechargeItems = account_ids.map((accountId: string) => ({
                account_id: accountId,
                amount: amount,
                memo: gift_card,
                operator: operator,
                reason: reason || 'Batch recharge'
            }));
        } else {
            return new Response('Invalid payload: expected an array or batch recharge object', { status: 400 });
        }

        if (rechargeItems.length === 0) {
            return new Response('No recharge items provided', { status: 400 });
        }

        const results: RechargeResult[] = [];
        
        // 逐個處理加值
        for (const item of rechargeItems) {
            const { account_id, amount, memo, reason } = item;
            
            if (!account_id || !amount || amount <= 0) {
                // 获取账户信息以返回 apple_id
                const accountInfo = await context.env.DB.prepare(
                    'SELECT apple_id FROM accounts WHERE id = ?1'
                ).bind(account_id).first();
                
                results.push({
                    account_id,
                    apple_id: (accountInfo?.apple_id as string) || null,
                    success: false,
                    message: 'Invalid account_id or amount'
                });
                continue;
            }

            try {
                // 1. 获取账户当前信息
                const account = await context.env.DB.prepare(
                    'SELECT apple_id, balance FROM accounts WHERE id = ?1'
                ).bind(account_id).first();

                if (!account) {
                    results.push({
                        account_id,
                        apple_id: null,
                        success: false,
                        message: 'Account not found'
                    });
                    continue;
                }

                const oldBalance = account.balance as number;
                const newBalance = oldBalance + amount;

                // 2. Update account balance
                await context.env.DB.prepare(
                    'UPDATE accounts SET balance = ?1, last_sync_date = ?2 WHERE id = ?3'
                ).bind(newBalance, new Date().toISOString(), account_id).run();

                // 3. Insert into history
                const historyId = crypto.randomUUID();
                await context.env.DB.prepare(
                    'INSERT INTO history (id, account_id, type, amount, created_at, memo) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
                ).bind(historyId, account_id, 'recharge', amount, new Date().toISOString(), memo || reason).run();

                // 4. 记录审计日志
                await logAudit(
                    context.env.DB,
                    'RECHARGE',
                    'account',
                    account_id,
                    JSON.stringify({
                        old_balance: oldBalance,
                        new_balance: newBalance,
                        amount: amount,
                        reason: reason || memo,
                        history_id: historyId
                    }),
                    operator
                );

                // 5. 记录余额调整
                await logBalanceAdjustment(
                    context.env.DB,
                    account_id,
                    amount,
                    reason || memo || 'Batch recharge',
                    operator
                );

                results.push({
                    account_id,
                    apple_id: account.apple_id as string | null,
                    success: true,
                    new_balance: newBalance
                });
            } catch (error: any) {
                // 获取账户信息以返回 apple_id
                const accountInfo = await context.env.DB.prepare(
                    'SELECT apple_id FROM accounts WHERE id = ?1'
                ).bind(account_id).first();
                
                results.push({
                    account_id,
                    apple_id: (accountInfo?.apple_id as string) || null,
                    success: false,
                    message: error.message || 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;

        return Response.json({
            message: 'Batch recharge completed',
            processed: results.length,
            success: successCount,
            failed: failedCount,
            results: results
        }, { status: 201 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};
