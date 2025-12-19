import { clg } from './client/utils';

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// 환경별 기본 API 호스트
// 외부 API 호출 시 사용하는 호스트 (현재 프로젝트에서는 내부 API만 사용하므로 빈 문자열)
const API_HOST_DEV = '';
export const API_HOST_RELEASE = '';

// NODE_ENV 기반 기본값 선택
const getDefaultApiHost = (): string => {
    if (process.env.NODE_ENV === 'development') {
        return API_HOST_DEV;
    }
    return API_HOST_RELEASE;
};

export const API_HOST = process.env.API_HOST || getDefaultApiHost();

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    clg('[API Config]', {
        API_HOST,
        fromEnv: !!process.env.API_HOST,
        NODE_ENV: process.env.NODE_ENV || 'release'
    });
}

// 내부 API 경로 (클라이언트 → 내부 API handler 호출 시 사용)
export const ApiPath = {
    Auth: {
        Login: '/api/auth/login',
        Logout: '/api/auth/logout'
    }
} as const;

// React Query 키 (배열 형식: ['domain', 'resource', params...])
export const queryKeys = {
    // 필요시 추가
} as const;

