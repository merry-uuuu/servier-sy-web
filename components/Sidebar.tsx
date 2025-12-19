import Link from 'next/link';
import { useRouter } from 'next/router';
import { cls } from '@/libs/client/utils';

type NavItem = {
    href: string;
    label: string;
};

const navItems: NavItem[] = [
    { href: '/admin', label: '대시보드' }
];

export default function Sidebar() {
    const router = useRouter();

    return (
        <aside className={cls('w-64 border-r border-gray-200 bg-white')}>
            <nav className={cls('overflow-y-auto')} style={{ height: 'calc(100vh - 73px)' }}>
                <div className={cls('py-2')}>
                    {navItems.map((item) => {
                        const isActive = router.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cls(
                                    'flex items-center gap-2 px-4 py-2 text-sm relative',
                                    isActive
                                        ? 'bg-gray-20 text-gray-900'
                                        : 'text-gray-700 hover:bg-gray-10'
                                )}
                            >
                                {isActive && (
                                    <div
                                        className={cls(
                                            'absolute left-0 top-0 bottom-0 w-1 bg-black'
                                        )}
                                    />
                                )}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </aside>
    );
}

