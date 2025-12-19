import Link from 'next/link';
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { cls } from '@/libs/client/utils';
import { useApiMutation } from '@/libs/client/hooks/common/useApiMutation';
import { ApiPath } from '@/libs/constants';

type AdminLayoutProps = {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    hideSidebar?: boolean;
};

interface LogoutResponse {
    ok: boolean;
}

export default function AdminLayout({ title, subtitle, children, hideSidebar }: AdminLayoutProps) {
    const logoutMutation = useApiMutation<LogoutResponse, never>({
        path: ApiPath.Auth.Logout,
        method: 'Post',
        showErrorToast: false,
        onSuccess: () => {
            window.location.href = '/login';
        },
        onError: () => {
            // 에러가 발생해도 로그아웃 페이지로 이동
            window.location.href = '/login';
        }
    });

    const handleLogout = () => {
        logoutMutation.mutate({});
    };

    return (
        <div className={cls('min-h-screen bg-gray-50 flex flex-col')}>
            <header className={cls('sticky top-0 z-40 w-full border-b border-gray-200 bg-white')}>
                <div className={cls('h-16 flex items-center justify-between px-4')}>
                    <div className={cls('flex items-center gap-2')}>
                        <Link
                            href="/"
                            className={cls(
                                'text-gray-900 font-semibold no-underline visited:text-gray-900'
                            )}
                        >
                            Servier SY Admin
                        </Link>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isLoading}
                        className={cls('text-sm text-gray-600 hover:text-gray-900')}
                    >
                        {logoutMutation.isLoading ? '로그아웃 중...' : '로그아웃'}
                    </button>
                </div>
            </header>

            <div className={cls('flex-1 flex')}>
                {!hideSidebar && <Sidebar />}
                <main className={cls('flex-1 bg-white')}>
                    <div className={cls('p-6')}>
                        {title && (
                            <h1 className={cls('text-xl font-semibold text-gray-900 mb-1')}>
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className={cls('text-sm text-gray-600 mb-6')}>{subtitle}</p>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

