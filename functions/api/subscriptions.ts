/// <reference types="@cloudflare/workers-types" />
import { Env } from '../env';

export const onRequestGet: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const accountId = url.searchParams.get('account_id');

        let query = `
            SELECT sub.*, s.name as service_name, s.base_price, s.currency, s.cycle
            FROM subscriptions sub
            JOIN services s ON sub.service_id = s.id
        `;
        let params: any[] = [];

        if (accountId) {
            query += ` WHERE sub.account_id = ?1`;
            params = [accountId];
        }

        query += ` ORDER BY sub.start_date DESC`;

        const { results } = await context.env.DB.prepare(query).bind(...params).all();
        return Response.json(results);
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const body = await context.request.json<any>();
        const id = body.id || crypto.randomUUID();

        await context.env.DB.prepare(
            'INSERT INTO subscriptions (id, account_id, service_id, start_date, group_name) VALUES (?1, ?2, ?3, ?4, ?5)'
        ).bind(
            id,
            body.account_id,
            body.service_id,
            body.start_date || new Date().toISOString(),
            body.group_name || '無標題群組'
        ).run();

        return Response.json({ id, message: 'Subscription added successfully' }, { status: 201 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
    try {
        const url = new URL(context.request.url);
        const id = url.searchParams.get('id');

        if (!id) return new Response('Missing ID', { status: 400 });

        await context.env.DB.prepare('DELETE FROM subscriptions WHERE id = ?1').bind(id).run();
        return Response.json({ message: 'Subscription removed successfully' });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
};
