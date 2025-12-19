import type { NextApiRequest, NextApiResponse } from 'next';
import { SignJWT } from 'jose';
import { timingSafeEqual } from 'crypto';
import { allowAttempt, resetAttempts } from '../../../lib/rateLimit';

const COOKIE_NAME = '__ss_auth';
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret) {
        throw new Error('Missing AUTH_JWT_SECRET');
    }
    return new TextEncoder().encode(secret);
}

function getExpectedPassword(): string {
    const pwd = process.env.AUTH_PASSWORD;
    if (!pwd) {
        throw new Error('Missing AUTH_PASSWORD');
    }
    return pwd;
}

function constantTimeCompare(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    const len = Math.max(aBuf.length, bBuf.length);
    const aPad = Buffer.alloc(len);
    const bPad = Buffer.alloc(len);
    aBuf.copy(aPad);
    bBuf.copy(bPad);
    const equal = timingSafeEqual(aPad, bPad);
    return equal && aBuf.length === bBuf.length;
}

async function createJwt(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    return await new SignJWT({ typ: 'auth' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(now)
        .setExpirationTime(now + TOKEN_TTL_SECONDS)
        .sign(getSecret());
}

function buildCookie(token: string, isSecure: boolean): string {
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = TOKEN_TTL_SECONDS;
    const attributes = [
        `${COOKIE_NAME}=${token}`,
        `Path=/`, // 루트 경로로 설정하여 /admin 하위에서 모두 접근 가능
        `HttpOnly`,
        `SameSite=Strict`,
        `Max-Age=${maxAge}`
    ];
    if (isSecure) attributes.push(`Secure`);
    if (isProd) {
        const domain = process.env.AUTH_COOKIE_DOMAIN;
        if (domain) attributes.push(`Domain=${domain}`);
    }
    return attributes.join('; ');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Content-Type 검증 (CSRF 방지)
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({ error: 'Invalid Content-Type' });
    }

    try {
        // 환경 변수 확인
        const hasSecret = !!process.env.AUTH_JWT_SECRET;
        const hasPassword = !!process.env.AUTH_PASSWORD;

        if (!hasSecret || !hasPassword) {
            // 프로덕션에서는 상세 정보 숨김
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            return res.status(500).json({
                error: `환경 변수 누락: AUTH_JWT_SECRET=${hasSecret}, AUTH_PASSWORD=${hasPassword}`
            });
        }

        // IP 추출 및 Rate Limiting
        const ip =
            (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
            (req.headers['x-real-ip'] as string | undefined) ||
            (req.socket as any)?.remoteAddress ||
            'unknown';

        if (!allowAttempt(`login:${ip}`)) {
            return res.status(429).json({ error: 'Too Many Attempts' });
        }

        // 요청 본문 검증
        const { password } = req.body ?? {};
        if (typeof password !== 'string' || password.length === 0) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // 비밀번호 길이 제한 (DoS 방지)
        if (password.length > 256) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const expected = getExpectedPassword();
        const ok = constantTimeCompare(password, expected);
        if (!ok) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[LOGIN DEBUG] Password mismatch');
                console.log('[LOGIN DEBUG] Expected length:', expected.length);
                console.log('[LOGIN DEBUG] Received length:', password.length);
            }
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = await createJwt();
        const isSecure = process.env.NODE_ENV === 'production';

        // 보안 헤더 설정
        res.setHeader('Set-Cookie', buildCookie(token, isSecure));
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        resetAttempts(`login:${ip}`);
        return res.status(200).json({ ok: true });
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            // 개발 환경에서는 에러 메시지를 그대로 보여주어 디버깅을 돕습니다.
            // 서버 콘솔에도 출력합니다.
            // eslint-disable-next-line no-console
            console.error(e);
            const message = e instanceof Error ? e.message : 'Unknown error';
            return res.status(500).json({ error: message });
        }
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

