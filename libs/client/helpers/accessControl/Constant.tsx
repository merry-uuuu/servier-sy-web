// 사용자에게 표시되는 메시지 상수
export const Message = {
	// API 호출 결과 response가 안온 경우 메시지
	ApiCallError:
		'잠시 후 다시 시도 부탁드립니다.\n문제가 오래 지속되는 경우 고객센터로 문의해 주세요🙏',
	ApiCallErrorUnknown:
		'알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도 부탁드립니다. 문제가 오래 지속되는 경우 고객센터로 문의해 주세요🙏',
	UnauthorizedError: '인증 정보가 없습니다. 다시 로그인 해주세요.',
	// 잘못된 경로로 들어온 경우 메시지
	WrongAccessError: '비정상적인 접근입니다.'
};

export const WrongApproachPage = '/error/wrongApproach';

