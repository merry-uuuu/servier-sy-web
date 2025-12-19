import axios, { AxiosRequestConfig } from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { API_HOST, BASE_URL } from '../constants';
import { Message } from '../client/helpers/accessControl/Constant';

const headers = { 'Content-Type': 'application/json' };

const UnauthorizedResponse = {
	statusCode: 401,
	body: { message: Message.UnauthorizedError }
};
export { headers, API_HOST, UnauthorizedResponse, BASE_URL };

export type DTO<T = never> = {
	statusCode: number;
	message?: string;
	body?: T;
};
export interface UrlQuery {
	query: ParsedUrlQuery;
}
export enum HttpMethod {
	GET = 'GET',
	POST = 'POST',
	PATCH = 'PATCH',
	DELETE = 'DELETE',
	PUT = 'PUT'
}
export type ApiRequest = {
	host?: string;
	path: string;
	query?: any;
	body?: any;
	headers?: any;
};
export type ApiResponse<T = any> = ApiData<T> & ApiError;
export type ApiData<T = any> = {
	statusCode: number;
	body?: T;
};
export type ApiError = {
	statusCode: number;
	message?: string;
};

type ApiServer = {
	req: NextApiRequest;
	res: NextApiResponse;
};
type ApiOptions = {
	server?: ApiServer;
};
export default class ApiHelper {
	private server?: ApiServer;

	constructor(private request: ApiRequest, options?: ApiOptions) {
		this.server = options?.server;
	}

	async Get<T = any>() {
		return this.Execute<T>(HttpMethod.GET);
	}
	async Post<T = any>() {
		return this.Execute<T>(HttpMethod.POST);
	}
	async Patch<T = any>() {
		return this.Execute<T>(HttpMethod.PATCH);
	}
	async Delete<T = any>() {
		return this.Execute<T>(HttpMethod.DELETE);
	}
	async Put<T = any>() {
		return this.Execute<T>(HttpMethod.PUT);
	}

	private async Execute<T = any>(method: HttpMethod): Promise<ApiResponse<T>> {
		try {
			const config: AxiosRequestConfig = {
				method,
				headers: { ...headers, ...this.request.headers },
				url: (this.request.host ?? '') + this.request.path,
				params: this.request.query,
				data: this.request.body ?? {},
				timeout: 60000
			};

			const response = await axios.request(config);
			return {
				statusCode: response.status,
				body: response.data
			};
		} catch (error) {
			if (axios.isAxiosError(error)) {
				return {
					statusCode: error.response?.status ?? 0,
					message: error.response?.data?.message ?? ''
				};
			}
			return {
				statusCode: 500,
				message: 'unknown error'
			};
		}
	}
}
export type HandlerArgs<Q = any, B = any> = {
	req: NextApiRequest;
	res: NextApiResponse;
	query: Q;
	body: B;
};
type QueryHandler = {
	(args: HandlerArgs): Promise<ApiData>;
};
type BodyHandler = {
	(args: HandlerArgs): Promise<ApiData>;
};
export interface ApiHandler {
	Get?: QueryHandler;
	Post?: BodyHandler;
	Patch?: BodyHandler;
	Put?: BodyHandler;
	Delete?: QueryHandler;
}

export async function RunApiHandler(
	req: NextApiRequest,
	res: NextApiResponse,
	apiHandler: ApiHandler
) {
	let response: ApiResponse | undefined;
	if (req.method === 'GET' && apiHandler.Get) {
		response = await apiHandler.Get({
			req,
			res,
			query: req.query,
			body: undefined
		});
	}
	if (req.method === 'POST' && apiHandler.Post) {
		response = await apiHandler.Post({
			req,
			res,
			query: req.query,
			body: req.body
		});
	}
	if (req.method === 'PATCH' && apiHandler.Patch) {
		response = await apiHandler.Patch({
			req,
			res,
			query: req.query,
			body: req.body
		});
	}
	if (req.method === 'PUT' && apiHandler.Put) {
		response = await apiHandler.Put({
			req,
			res,
			query: req.query,
			body: req.body
		});
	}
	if (req.method === 'DELETE' && apiHandler.Delete) {
		response = await apiHandler.Delete({
			req,
			res,
			query: req.query,
			body: req.body
		});
	}
	if (response) {
		if (response.statusCode >= 200 && response.statusCode < 300) {
			res.status(response.statusCode).json(response.body);
		} else {
			res.status(response.statusCode).json({
				message: response.message ?? 'unknown error'
			});
		}
	} else {
		res.status(405).end();
	}
}

