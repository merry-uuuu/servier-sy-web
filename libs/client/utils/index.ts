// 공통 유틸 함수 모음

import { Message } from '../helpers/accessControl/Constant';

// className 조합 유틸
export function cls(...classNames: Array<string | false | null | undefined>): string {
    return classNames.filter(Boolean).join(' ');
}

// 개발 환경 전용 콘솔 로그
export const clg = (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('🎀', ...args);
    }
};

// API에서 200외 에러난 경우 토스트 메시지 표시
export const errorHandler = (error: Error, num: number) => {
    clg('errorHandler:', error.message);
    // toast 대신 console.error 사용 (react-hot-toast 설치 시 toast로 변경 가능)
    console.error(`(${num}) ${Message.ApiCallError}`);
};

// 배열 유효성 검사
export function isValidList<T>(arr: T | undefined | null, minLength?: number): arr is T {
    const length = minLength ?? 0;
    return arr !== undefined && arr !== null && Array.isArray(arr) && arr.length > length;
}

// 값 정의 여부 검사
export function isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
}

// 값 미정의 여부 검사
export function isUndefined<T>(value: T | undefined | null): value is T {
    return value === undefined || value === null;
}

// 클립보드 복사
export function CopyToClipBoard(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
        const successful = document.execCommand('copy');
        const message = successful
            ? 'Text copied to clipboard'
            : 'Failed to copy text to clipboard';
        clg(message);
    } catch (error) {
        console.error('Failed to copy text to clipboard:', error);
    }

    document.body.removeChild(textarea);
}

// 숫자 3자리마다 , 찍어주는 기능 (100,000,000)
export function FormatNumber(value?: number | undefined) {
    return value ? value.toLocaleString('ko-KR') : 0;
}

/**
 * 날짜 포맷팅
 */
type DateFormatType = 'date' | 'datetime' | 'utc' | 'local' | 'short' | 'datetime_dot';

export const FormatDate = (
    dateString: string | undefined | null,
    type: DateFormatType = 'date'
) => {
    if (!dateString) return '-';
    const date = new Date(dateString);

    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    switch (type) {
        case 'local':
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false // 24시간 형식
            };

            return date.toLocaleString('ko-KR', options).replace(/\//g, '-').replace(',', '');

        case 'datetime':
            return `${yyyy}-${MM}-${dd} ${HH}:${mm}`;

        case 'datetime_dot':
            return `${yyyy}.${MM}.${dd} ${HH}:${mm}`;

        case 'utc':
            date.setHours(date.getHours() + 9); // KST 적용
            return date.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm 형식

        case 'short':
            return `${date.getFullYear().toString().slice(2)}.${String(
                date.getMonth() + 1
            ).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`; // yy.MM.DD 형식

        default:
            return date.toISOString().split('T')[0]; // yyyy-MM-dd 형식
    }
};

