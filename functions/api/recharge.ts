import { Env } from '../env';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const items = await request.json<any[]>(); // Array of recharge items

        if (!Array.isArray(items) || items.length === 0) {
            return new Response('Invalid payload: expected an array of recharge data', { status: 400 });
        }

        const statements: any[] = [];
        let processedCount = 0;

        for (const item of items) {
            const { account_id, amount, gift_card, date } = item;

            if (!account_id || !amount) continue;

            const rechargeDate = date || new Date().toISOString();
            const historyId = crypto.randomUUID();

            // 1. Update account balance
            statements.push(
                context.env.DB.prepare('UPDATE accounts SET balance = balance + ?1, last_sync_date = ?2 WHERE id = ?3')
                    .bind(amount, new Date().toISOString(), account_id)
            );

            // 2. Insert into history
            statements.push(
                context.env.DB.prepare('INSERT INTO history (id, account_id, type, amount, created_at, memo) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
                    .bind(historyId, account_id, 'recharge', amount, rechargeDate, gift_card || null)
            );

            processedCount++;
        }

        if (statements.length > 0) {
            await context.env.DB.batch(statements);
        }

        return Response.json({ message: 'Batch recharge successful', processed: processedCount }, { status: 201 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};
