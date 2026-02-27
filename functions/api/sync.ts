import { Env } from '../env';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { results: rawSubs } = await context.env.DB.prepare(`
            SELECT sub.*, s.name as service_name, s.base_price, s.currency, s.cycle, s.next_price, s.effective_date, a.apple_id, a.balance
            FROM subscriptions sub
            JOIN services s ON sub.service_id = s.id
            JOIN accounts a ON sub.account_id = a.id
        `).all<any>();

        const botToken = (context.env as any).TELEGRAM_BOT_TOKEN;
        const chatId = (context.env as any).TELEGRAM_CHAT_ID;
        const lowBalanceAlerts: string[] = [];
        const dbOperations: any[] = [];

        // Group raw subscriptions by account for batched balance updates
        const accountsMap = new Map<string, { apple_id: string, balance: number, deductionsTotal: number, servicesDeduted: string[], subs: any[] }>();

        // 1. Calculate deductions per subscription
        for (const sub of rawSubs) {
            if (!sub.base_price) continue;

            const today = new Date();
            const startDate = sub.start_date ? new Date(sub.start_date) : today;

            // Only deduct on the billing anniversary day
            if (today.getDate() !== startDate.getDate()) {
                continue;
            }

            // Price adjustment logic
            let currentPrice = sub.base_price;
            if (sub.next_price && sub.effective_date) {
                if (new Date(sub.effective_date) <= today) {
                    currentPrice = sub.next_price;
                }
            }

            // Deduct full amount for yearly cycle ONCE a year, or full amount for monthly ONCE a month.
            // (Assuming the sync runs daily. To truly support yearly we would check month matching too, 
            // but for simplicity & simulating burn rate we will amortize yearly into monthly deductions)
            let deduction = currentPrice;
            if (sub.cycle === 'yearly') {
                deduction = currentPrice / 12; // amortized monthly deduction
            }

            if (!accountsMap.has(sub.account_id)) {
                accountsMap.set(sub.account_id, {
                    apple_id: sub.apple_id,
                    balance: sub.balance,
                    deductionsTotal: 0,
                    servicesDeduted: [],
                    subs: []
                });
            }

            const accData = accountsMap.get(sub.account_id)!;
            accData.deductionsTotal += deduction;
            accData.servicesDeduted.push(sub.service_name);
            accData.subs.push(sub);

            // Record history per subscription deduction
            dbOperations.push(
                context.env.DB.prepare('INSERT INTO history (id, account_id, type, amount, memo) VALUES (?1, ?2, ?3, ?4, ?5)')
                    .bind(crypto.randomUUID(), sub.account_id, 'deduction', -deduction, `Auto-deduction: ${sub.service_name}`)
            );
        }

        // 2. Apply combined deductions to accounts and check alerts
        for (const [accountId, data] of accountsMap.entries()) {
            if (data.deductionsTotal <= 0) continue;

            const newBalance = data.balance - data.deductionsTotal;

            // Update account total balance
            dbOperations.push(
                context.env.DB.prepare('UPDATE accounts SET balance = ?1, last_sync_date = ?2 WHERE id = ?3')
                    .bind(newBalance, new Date().toISOString(), accountId)
            );

            // Calculate rough months left based on this month's total burn. 
            // Only alerts if total combined burn drops balance below 2 months.
            const roughMonthsLeft = newBalance / data.deductionsTotal;
            if (roughMonthsLeft < 2) {
                lowBalanceAlerts.push(`⚠️ Low Balance Alert\nApple ID: ${data.apple_id}\nDeducted Services: ${data.servicesDeduted.join(', ')}\nNew Balance: ${newBalance.toFixed(2)}\nEstimated Runaway: < 2 months`);
            }
        }

        // 3. Batch execute all DB operations
        if (dbOperations.length > 0) {
            await context.env.DB.batch(dbOperations);
        }

        // Send Telegram notifications if configured and there are alerts
        if (botToken && chatId && lowBalanceAlerts.length > 0) {
            const message = lowBalanceAlerts.join('\n\n');
            const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
            await fetch(tgUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                }),
            });
        }

        return Response.json({
            message: 'Monthly deduction executed successfully',
            processed: accounts.length,
            alerts_sent: lowBalanceAlerts.length
        });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};
