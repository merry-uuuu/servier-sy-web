import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // 루트 경로 접근 시 관리자 로그인 페이지로 리다이렉트
        router.push('/admin/login');
    }, [router]);

    return null;
}

