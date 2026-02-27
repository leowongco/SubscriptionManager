import { Env } from '../env';

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        // Return accounts along with their associated subscriptions
        const { results: accounts } = await context.env.DB.prepare(`
            SELECT * FROM accounts
        `).all();

        const { results: subscriptions } = await context.env.DB.prepare(`
            SELECT sub.*, s.name as service_name, s.base_price, s.currency, s.cycle
            FROM subscriptions sub
            JOIN services s ON sub.service_id = s.id
        `).all();

        // Group subscriptions by account_id
        const subsByAccount = subscriptions.reduce((acc: any, sub: any) => {
            if (!acc[sub.account_id]) acc[sub.account_id] = [];
            acc[sub.account_id].push(sub);
            return acc;
        }, {});

        // Attach subscriptions array to each account
        const enrichedAccounts = accounts.map((acc: any) => ({
            ...acc,
            subscriptions: subsByAccount[acc.id] || []
        }));

        return Response.json(enrichedAccounts);
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();
        const id = body.id || crypto.randomUUID();

        await context.env.DB.prepare(
            'INSERT INTO accounts (id, apple_id, group_name, balance, last_sync_date) VALUES (?1, ?2, ?3, ?4, ?5)'
        ).bind(
            id,
            body.apple_id,
            body.group_name,
            body.balance || 0,
            new Date().toISOString()
        ).run();

        return Response.json({ id, message: 'Account created successfully' }, { status: 201 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();
        const id = body.id;

        if (!id) return new Response('Missing Account ID', { status: 400 });

        await context.env.DB.prepare(
            'UPDATE accounts SET apple_id = ?1, group_name = ?2, balance = ?3 WHERE id = ?4'
        ).bind(
            body.apple_id,
            body.group_name,
            body.balance,
            id
        ).run();

        return Response.json({ message: 'Account updated successfully' });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) return new Response('Missing Account ID', { status: 400 });

        await context.env.DB.prepare('DELETE FROM accounts WHERE id = ?1').bind(id).run();
        return Response.json({ message: 'Account deleted successfully' });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};
