export const isSuccess = (res: any) => {
	return res?.statusCode >= 200 && res?.statusCode < 300;
};

