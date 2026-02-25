import { Env } from '../env';

export const onRequest: PagesFunction<Env> = async (context) => {
    const request = context.request;
    const url = new URL(request.url);

    // Bypass access check in local development (wrangler typically runs on localhost or 127.0.0.1)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.includes('ngrok')) {
        return context.next();
    }

    // If Cloudflare Access is not explicitly required via env var, bypass check
    if ((context.env as any).REQUIRE_CF_ACCESS !== 'true') {
        return context.next();
    }

    // Check Cloudflare Access JWT header
    const cfAccessHeader = request.headers.get('Cf-Access-Jwt-Assertion');

    if (!cfAccessHeader) {
        return new Response('Unauthorized: Missing Cloudflare Access Token', { status: 401 });
    }

    // In a full production implementation, we would also verify the JWT signature 
    // using the Cloudflare public keys from https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/certs

    // Proceed to the requested API endpoint
    return context.next();
};
