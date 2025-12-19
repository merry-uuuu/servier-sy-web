import { useQuery, UseQueryResult } from 'react-query';
import ApiHelper, { ApiResponse as ApiHelperResponse } from '@/libs/server/api.helper';
import { isSuccess } from '@/libs/server/utility';
import { QueryKey } from 'react-query';
import { Message } from '@/libs/client/helpers/accessControl/Constant';
import { clg } from '@/libs/client/utils';

// 기존 Body<T> 인터페이스는 필요에 따라 사용
interface Body<T> {
	data: T;
}

// API 응답 전체를 포함한 타입 정의
export interface ApiResponse<T> {
	statusCode: number;
	body?: T;
	message?: string;
	isSuccess: boolean;
}

interface useApiQueryOptions<T> {
	errorNum?: number;
	path: string;
	queryKey: QueryKey;
	enabled?: boolean;
	staleTime?: number;
	cacheTime?: number;
	refetchInterval?: number;
	onSuccess?: (data: any) => void;
	onError?: (error: Error) => void;
	query?: Record<string, any>;
	showErrorToast?: boolean;
	returnFullResponse?: boolean; // 전체 응답 반환 여부
}

// 함수 오버로딩을 사용하여 반환 타입을 명확히 지정
export function useApiQuery<T>(
	options: useApiQueryOptions<T> & { returnFullResponse: true }
): UseQueryResult<ApiResponse<T>>;

export function useApiQuery<T>(
	options: useApiQueryOptions<T> & { returnFullResponse?: false }
): UseQueryResult<T>;

export function useApiQuery<T>({
	errorNum = 0,
	path,
	queryKey,
	enabled = true,
	onSuccess,
	onError,
	query,
	staleTime,
	cacheTime,
	refetchInterval,
	showErrorToast = true,
	returnFullResponse = false
}: useApiQueryOptions<T>): UseQueryResult<any> {
	return useQuery({
		queryFn: async () => {
			const apiResponse = await new ApiHelper({
				path,
				query
			}).Get<T>();

			clg(`[${path}] apiResponse:`, apiResponse);

			// 응답 구성
			const response: ApiResponse<T> = {
				statusCode: apiResponse.statusCode,
				body: apiResponse.body,
				message: apiResponse.message,
				isSuccess: isSuccess(apiResponse)
			};

			// 오류 메시지 표시 옵션
			if (!response.isSuccess && showErrorToast && !returnFullResponse) {
				console.error(Message.ApiCallError);
			}

			// 옵션에 따라 전체 응답 또는 body만 반환
			return returnFullResponse ? response : response.body;
		},
		staleTime,
		cacheTime,
		refetchInterval,
		queryKey,
		enabled,
		onSuccess: (data) => {
			if (onSuccess) {
				onSuccess(data);
			}
		}
		// onError: onError || (() => errorHandler(new Error(), errorNum))
	});
}

