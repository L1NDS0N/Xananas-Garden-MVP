export enum HttpStatusCode {
	OK = 200,
	BAD_REQUEST = 400,
	NOT_FOUND = 404,
	INTERNAL_SERVER = 500,
	UNATHOURIZED = 401,
}

export class ApiError extends Error {
	public readonly statusCode: HttpStatusCode;
	public readonly description: any;

	constructor(message: string, statusCode: HttpStatusCode, description?: any) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.description = description;
		this.statusCode = statusCode;

		Error.captureStackTrace(this);
	}
}
export class ErrorHandler {
	private static instance: ErrorHandler;

	private contextMsg!: string;
	private errorMsg!: string;
	private statusCode!: HttpStatusCode;

	constructor() {
		ErrorHandler.instance = this;
	}
	public static new(): ErrorHandler {
		if (!ErrorHandler.instance) {
			new ErrorHandler();
		}
		return ErrorHandler.instance;
	}
	public context(contextMessage: string) {
		this.contextMsg = contextMessage;
		return this;
	}
	public message(errorMessage: string) {
		this.errorMsg = errorMessage;
		return this;
	}
	public code(errCode: HttpStatusCode) {
		this.statusCode = errCode;
		return this;
	}

	public throw() {
		console.log(`${this.statusCode} ${this.contextMsg} ${this.errorMsg}`);
	}
}

export class BadRequestError extends ApiError {
	constructor(message: string, description?: any) {
		super(message, HttpStatusCode.BAD_REQUEST, description);
	}
}

export class NotFoundError extends ApiError {
	constructor(message: string, description?: any) {
		super(message, HttpStatusCode.NOT_FOUND, description);
	}
}

export class UnauthorizedError extends ApiError {
	constructor(message: string, description?: any) {
		super(message, HttpStatusCode.UNATHOURIZED, description);
	}
}
