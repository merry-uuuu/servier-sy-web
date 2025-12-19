import { useMutation, UseMutationResult } from 'react-query';
import { useRef } from 'react';
import ApiHelper from '@/libs/server/api.helper';
import { clg, errorHandler } from '@/libs/client/utils';
import { isSuccess } from '@/libs/server/utility';
import { Message } from '@/libs/client/helpers/accessControl/Constant';

// API 응답 전체를 포함한 타입 정의
export interface ApiResponse<T> {
	statusCode: number;
	body?: T;
	message?: string;
	isSuccess: boolean;
}

interface UseApiMutationOptions<TData> {
	errorNum?: number;
	path: string;
	method: 'Get' | 'Post' | 'Patch' | 'Delete' | 'Put';
	onSuccess?: (data: TData | ApiResponse<TData> | undefined) => void;
	onError?: (error: Error) => void;
	showErrorToast?: boolean;
	returnFullResponse?: boolean; // 전체 응답 반환 여부
}

export interface MutationParams<TVariables, TQuery = Record<string, any>> {
	body?: TVariables;
	query?: TQuery;
}

// 타입스크립트 제네릭 함수를 위한 조건부 타입
type ApiReturnType<TData, TFullResponse extends boolean> = TFullResponse extends true
	? ApiResponse<TData>
	: TData;

export function useApiMutation<TData, TVariables, TQuery = Record<string, any>>(
	options: UseApiMutationOptions<TData> & { returnFullResponse: true }
): UseMutationResult<ApiResponse<TData>, Error, MutationParams<TVariables, TQuery>>;

export function useApiMutation<TData, TVariables, TQuery = Record<string, any>>(
	options: UseApiMutationOptions<TData> & { returnFullResponse?: false }
): UseMutationResult<TData, Error, MutationParams<TVariables, TQuery>>;

export function useApiMutation<TData, TVariables, TQuery = Record<string, any>>({
	errorNum = 0,
	path,
	method,
	onSuccess,
	onError,
	showErrorToast = true,
	returnFullResponse = false // 기본값은 body만 반환
}: UseApiMutationOptions<TData>): UseMutationResult<
	any,
	Error,
	MutationParams<TVariables, TQuery>
> {
	// 중복 요청 방지를 위한 Map (요청별로 고유 키 관리)
	const currentRequestsRef = useRef<Map<string, Promise<any>>>(new Map());

	const mutationFn = async (params: MutationParams<TVariables, TQuery>) => {
		const { body, query } = params;

		// 요청별 고유 키 생성 (path, method, body, query 조합)
		const requestKey = JSON.stringify({
			path,
			method,
			query
		});

		// 이미 동일한 요청이 진행 중이면 해당 Promise 반환
		if (currentRequestsRef.current.has(requestKey)) {
			return currentRequestsRef.current.get(requestKey)!;
		}

		clg('mutationFn params:', params);

		// 현재 요청 Promise 생성 및 저장
		const requestPromise = (async () => {
			try {
				const apiResponse = await new ApiHelper({
					path,
					body,
					query
				})[method]();

				clg(`[${path}] apiResponse:`, apiResponse);

				// 응답 구성
				const response: ApiResponse<TData> = {
					statusCode: apiResponse.statusCode,
					body: apiResponse.body?.data || apiResponse.body, // data 속성이 있는 경우와 없는 경우 모두 처리
					message: apiResponse.message,
					isSuccess: isSuccess(apiResponse)
				};

				// 오류 메시지 표시 옵션
				if (!response.isSuccess && showErrorToast && !returnFullResponse) {
					console.error(Message.ApiCallError);
					throw new Error(); // onSuccess 실행 안되게 하기 위함
				}

				// 옵션에 따라 전체 응답 또는 body만 반환
				return returnFullResponse ? response : response.body;
			} catch (error) {
				// axios 오류를 더 자세하게 처리
				if (error instanceof Error) {
					// 파일 크기 제한 관련 오류 메시지 처리
					if (
						error.message.includes('timeout') ||
						error.message.includes('Network Error')
					) {
						throw new Error('timeout error');
					}
					// 기타 오류
					throw error;
				}
				throw new Error(Message.ApiCallErrorUnknown);
			} finally {
				// 요청 완료 후 해당 키의 Promise 제거
				currentRequestsRef.current.delete(requestKey);
			}
		})();

		currentRequestsRef.current.set(requestKey, requestPromise);

		return requestPromise;
	};

	return useMutation(mutationFn, {
		onSuccess: (data) => {
			if (onSuccess) {
				onSuccess(data);
			}
		},
		onError: (error) => {
			if (onError) {
				onError(error);
			} else {
				errorHandler(error, errorNum);
			}
		}
	});
}

