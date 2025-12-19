import type { NextApiRequest, NextApiResponse } from 'next';

const COOKIE_NAME = '__ss_auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const attributes = [
        `${COOKIE_NAME}=`,
        `Path=/`, // 루트 경로로 설정
        `HttpOnly`,
        `SameSite=Strict`,
        `Max-Age=0`
    ];
    const domain = process.env.AUTH_COOKIE_DOMAIN;
    if (domain) attributes.push(`Domain=${domain}`);
    if (isProd) attributes.push(`Secure`);

    res.setHeader('Set-Cookie', attributes.join('; '));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).json({ ok: true });
}

