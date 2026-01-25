import type { AppProps } from 'next/app';
import '../styles/globals.css';
import AdminLayout from '../components/AdminLayout';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function AppContent({ Component, pageProps }: Pick<AppProps, 'Component' | 'pageProps'>) {
    const router = useRouter();
    const isLoginPage = router.pathname === '/login';
    const isAdminPage = router.pathname === '/' || router.pathname === '/narrative';

    // 모바일 뷰포트 높이 설정: svh 미지원 구형 브라우저(2022년 이전)에서만 --vh 변수로 폴백
    // CSS에서 height: calc(var(--vh, 1vh) * 100); height: 100svh; 형태로 사용
    useEffect(() => {
        const supportsSvh = CSS.supports('height', '100svh');

        if (!supportsSvh) {
            const setViewportHeight = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            setViewportHeight();
            window.addEventListener('resize', setViewportHeight);
            return () => window.removeEventListener('resize', setViewportHeight);
        }
    }, []);

    // 로그인 페이지는 레이아웃 없이 렌더링
    if (isLoginPage) {
        return <Component {...pageProps} />;
    }

    // 어드민 페이지는 AdminLayout 적용
    if (isAdminPage) {
        const adminPageProps = pageProps as { title?: string; subtitle?: string };
        return (
            <AdminLayout title={adminPageProps.title} subtitle={adminPageProps.subtitle}>
                <Component {...pageProps} />
            </AdminLayout>
        );
    }

    // 그 외 페이지는 기본 레이아웃
    return <Component {...pageProps} />;
}

export default function App({ Component, pageProps }: AppProps) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <AppContent Component={Component} pageProps={pageProps} />
        </QueryClientProvider>
    );
}

