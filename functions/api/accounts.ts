import { Env } from '../env';

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        // Return accounts along with service details
        const { results } = await context.env.DB.prepare(`
      SELECT a.*, s.name as service_name, s.base_price, s.currency, s.cycle
      FROM accounts a
      LEFT JOIN services s ON a.service_id = s.id
    `).all();
        return Response.json(results);
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
            'INSERT INTO accounts (id, apple_id, google_account, balance, service_id, start_date, last_sync_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
        ).bind(
            id,
            body.apple_id,
            body.google_account,
            body.balance || 0,
            body.service_id,
            body.start_date || new Date().toISOString(),
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
            'UPDATE accounts SET apple_id = ?1, google_account = ?2, balance = ?3, service_id = ?4, start_date = ?5 WHERE id = ?6'
        ).bind(
            body.apple_id,
            body.google_account,
            body.balance,
            body.service_id,
            body.start_date,
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
