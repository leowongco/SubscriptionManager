import { Env } from '../env';

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const { results } = await context.env.DB.prepare('SELECT * FROM members').all();
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
            'INSERT INTO members (id, account_id, email, payment_status, memo) VALUES (?1, ?2, ?3, ?4, ?5)'
        ).bind(
            id,
            body.account_id,
            body.email,
            body.payment_status ? 1 : 0,
            body.memo || null
        ).run();

        return Response.json({ id, message: 'Member created successfully' }, { status: 201 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();
        const id = body.id;

        if (!id) return new Response('Missing Member ID', { status: 400 });

        await context.env.DB.prepare(
            'UPDATE members SET account_id = ?1, email = ?2, payment_status = ?3, memo = ?4 WHERE id = ?5'
        ).bind(
            body.account_id,
            body.email,
            body.payment_status ? 1 : 0,
            body.memo || null,
            id
        ).run();

        return Response.json({ message: 'Member updated successfully' });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) return new Response('Missing Member ID', { status: 400 });

        await context.env.DB.prepare('DELETE FROM members WHERE id = ?1').bind(id).run();
        return Response.json({ message: 'Member deleted successfully' });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};
