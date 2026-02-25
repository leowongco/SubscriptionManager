import { Env } from '../env';

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const { results } = await context.env.DB.prepare('SELECT * FROM services').all();
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
            'INSERT INTO services (id, name, base_price, currency, cycle, next_price, effective_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
        ).bind(
            id,
            body.name,
            body.base_price,
            body.currency,
            body.cycle,
            body.next_price || null,
            body.effective_date || null
        ).run();

        return Response.json({ id, message: 'Service created successfully' }, { status: 201 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
    try {
        const request = context.request;
        const body = await request.json<any>();
        const id = body.id;

        if (!id) return new Response('Missing Service ID', { status: 400 });

        await context.env.DB.prepare(
            'UPDATE services SET name = ?1, base_price = ?2, currency = ?3, cycle = ?4, next_price = ?5, effective_date = ?6 WHERE id = ?7'
        ).bind(
            body.name,
            body.base_price,
            body.currency,
            body.cycle,
            body.next_price || null,
            body.effective_date || null,
            id
        ).run();

        return Response.json({ message: 'Service updated successfully' });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) return new Response('Missing Service ID', { status: 400 });

        await context.env.DB.prepare('DELETE FROM services WHERE id = ?1').bind(id).run();
        return Response.json({ message: 'Service deleted successfully' });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};
