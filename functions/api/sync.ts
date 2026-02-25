import { Env } from '../env';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { results: accounts } = await context.env.DB.prepare(`
      SELECT a.*, s.name as service_name, s.base_price, s.currency, s.cycle, s.next_price, s.effective_date
      FROM accounts a
      JOIN services s ON a.service_id = s.id
    `).all<any>();

        const botToken = (context.env as any).TELEGRAM_BOT_TOKEN;
        const chatId = (context.env as any).TELEGRAM_CHAT_ID;
        const lowBalanceAlerts: string[] = [];
        const deductions: any[] = [];

        // Simulate deduction for each account
        for (const acc of accounts) {
            if (!acc.base_price) continue;

            // Check if price should be updated
            let currentPrice = acc.base_price;
            if (acc.next_price && acc.effective_date) {
                if (new Date(acc.effective_date) <= new Date()) {
                    currentPrice = acc.next_price;
                    // In a real app, we might also update the 'services' table here to make the next_price the base_price
                }
            }

            // Calculate deduction amount
            let deduction = currentPrice;
            if (acc.cycle === 'yearly') {
                deduction = currentPrice / 12; // amortized monthly cost
            }

            const newBalance = acc.balance - deduction;
            const monthsLeft = newBalance / currentPrice;

            // Queue DB updates
            deductions.push(
                context.env.DB.prepare('UPDATE accounts SET balance = ?1, last_sync_date = ?2 WHERE id = ?3')
                    .bind(newBalance, new Date().toISOString(), acc.id)
            );

            deductions.push(
                context.env.DB.prepare('INSERT INTO history (id, account_id, type, amount) VALUES (?1, ?2, ?3, ?4)')
                    .bind(crypto.randomUUID(), acc.id, 'deduction', deduction)
            );

            // Check for low balance alert
            if (monthsLeft < 2) {
                lowBalanceAlerts.push(`⚠️ Low Balance Alert\nApple ID: ${acc.apple_id}\nService: ${acc.service_name}\nBalance: ${acc.currency} ${newBalance.toFixed(2)} (approx. ${monthsLeft.toFixed(1)} months left)`);
            }
        }

        // Process all deductions in a batch
        if (deductions.length > 0) {
            await context.env.DB.batch(deductions);
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
