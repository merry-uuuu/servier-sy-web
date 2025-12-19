import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getToken } from 'next-auth/jwt';

const ADMIN_COOKIE_NAME = '__ss_auth';
const ADMIN_PATH_PREFIX = '/admin';
const ADMIN_LOGIN_PATH = '/admin/login';
const USER_LOGIN_PATH = '/login';

function isAdminPath(pathname: string): boolean {
    return pathname === ADMIN_PATH_PREFIX || pathname.startsWith(`${ADMIN_PATH_PREFIX}/`);
}

function isAdminLoginPath(pathname: string): boolean {
    return pathname === ADMIN_LOGIN_PATH;
}

function isUserLoginPath(pathname: string): boolean {
    return pathname === USER_LOGIN_PATH;
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

    // 일반 사용자 로그인 페이지 처리
    if (isUserLoginPath(pathname)) {
        // 이미 로그인된 상태면 /로 리다이렉트
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (token && (token.id || token.phone)) {
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

    // 어드민 경로 처리
    if (isAdminPath(pathname)) {
        // 어드민 로그인 페이지는 보호하지 않음
        if (isAdminLoginPath(pathname)) {
            // 이미 로그인된 상태면 /admin으로 리다이렉트
            const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
            const valid = await verifyAdminJwt(token);
            if (valid) {
                return NextResponse.redirect(new URL('/admin', req.url));
            }
            const response = NextResponse.next();
            response.headers.set('X-Content-Type-Options', 'nosniff');
            response.headers.set('X-Frame-Options', 'DENY');
            response.headers.set('X-XSS-Protection', '1; mode=block');
            response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
            return response;
        }

        // 어드민 경로 보호 (로그인 페이지 제외)
        const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
        const valid = await verifyAdminJwt(token);

        if (!valid) {
            const loginUrl = new URL(ADMIN_LOGIN_PATH, req.url);
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

