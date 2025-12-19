import { GetServerSideProps } from 'next';
import { cls } from '@/libs/client/utils';

type AdminDashboardProps = {
    title?: string;
    subtitle?: string;
};

export default function AdminDashboard({ title, subtitle }: AdminDashboardProps) {
    return (
        <div className={cls('text-gray-900')}>
            <h2 className={cls('text-2xl font-bold mb-4')}>Hello World</h2>
            <p className={cls('text-gray-600')}>로그인 후 랜딩 화면입니다.</p>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<AdminDashboardProps> = async () => {
    return {
        props: {
            title: '관리자 대시보드',
            subtitle: 'Servier SY 관리 기능을 빠르게 수행하세요.'
        }
    };
};

