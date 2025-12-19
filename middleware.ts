import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_COOKIE_NAME = '__ss_auth';
const LOGIN_PATH = '/login';
const ROOT_PATH = '/';

function isLoginPath(pathname: string): boolean {
    return pathname === LOGIN_PATH;
}

function isRootPath(pathname: string): boolean {
    return pathname === ROOT_PATH;
}

async function verifyAdminJwt(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret) return false;
    try {
        const encoder = new TextEncoder();
        await jwtVerify(token, encoder.encode(secret));
        return true;
    } catch {
        return false;
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 로그인 페이지 처리
    if (isLoginPath(pathname)) {
        // 이미 로그인된 상태면 /로 리다이렉트
        const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
        const valid = await verifyAdminJwt(token);
        if (valid) {
            return NextResponse.redirect(new URL('/', req.url));
        }
        // 보안 헤더를 포함하여 응답
        const response = NextResponse.next();
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        return response;
    }

    // 루트 경로 보호 (로그인 페이지 제외)
    if (isRootPath(pathname)) {
        const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
        const valid = await verifyAdminJwt(token);

        if (!valid) {
            const loginUrl = new URL(LOGIN_PATH, req.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // 보안 헤더 추가
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: ['/:path*']
};

