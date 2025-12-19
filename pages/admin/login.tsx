import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { cls } from '@/libs/client/utils';
import { useApiMutation } from '@/libs/client/hooks/common/useApiMutation';
import { ApiPath } from '@/libs/constants';

interface LoginBody {
    password: string;
}

interface LoginResponse {
    ok: boolean;
    error?: string;
}

export default function AdminLoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const loginMutation = useApiMutation<LoginResponse, LoginBody>({
        path: ApiPath.Auth.Login,
        method: 'Post',
        showErrorToast: false,
        onSuccess: () => {
            // 로그인 성공 후 /admin으로 리다이렉트
            const from = (router.query.from as string) || '/admin';
            // 쿠키가 설정되기 위해 약간의 지연 후 리다이렉트
            setTimeout(() => {
                window.location.href = from;
            }, 100);
        },
        onError: (err) => {
            setError(err.message || '로그인 중 오류가 발생했습니다.');
        }
    });

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        loginMutation.mutate({
            body: { password }
        });
    }

    return (
        <div className={cls('min-h-screen flex items-center justify-center bg-gray-50 p-4')}>
            <form
                onSubmit={onSubmit}
                className={cls('w-full max-w-sm bg-white rounded-lg shadow p-6 space-y-4')}
            >
                <h1 className={cls('text-xl font-semibold text-gray-900')}>관리자 로그인</h1>
                <p className={cls('text-sm text-gray-500')}>관리자 비밀번호를 입력해주세요.</p>
                <div>
                    <label className={cls('block text-sm text-gray-700 mb-1')}>비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cls(
                            'w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black'
                        )}
                        placeholder="비밀번호"
                        autoFocus
                    />
                </div>
                {error && (
                    <p className={cls('text-sm text-red-600')} role="alert">
                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={loginMutation.isLoading || password.length === 0}
                    className={cls(
                        'w-full bg-black text-white rounded-md py-2 hover:bg-gray-900',
                        loginMutation.isLoading || password.length === 0 ? 'disabled:opacity-50' : ''
                    )}
                >
                    {loginMutation.isLoading ? '확인 중...' : '로그인'}
                </button>
            </form>
        </div>
    );
}

