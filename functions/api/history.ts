/// <reference types="@cloudflare/workers-types" />
import { Env } from '../env';

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const { results } = await context.env.DB.prepare(`
      SELECT h.*, a.apple_id, a.group_name 
      FROM history h
      JOIN accounts a ON h.account_id = a.id
      ORDER BY h.created_at DESC
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
            'INSERT INTO history (id, account_id, type, amount) VALUES (?1, ?2, ?3, ?4)'
        ).bind(
            id,
            body.account_id,
            body.type,
            body.amount
        ).run();

        return Response.json({ id, message: 'History created successfully' }, { status: 201 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};
