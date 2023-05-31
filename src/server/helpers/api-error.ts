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

		// Error.captureStackTrace(this);
	}
}

export class ErrorHandler {
	private static instance: ErrorHandler;

	private _contextMsg!: string;
	private _errorMsg!: string;
	private _statusCode!: HttpStatusCode;
	private _description!: any;

	constructor() {
		ErrorHandler.instance = this;
	}

	public static new(): ErrorHandler {
		if (!ErrorHandler.instance) {
			new ErrorHandler();
		}
		return ErrorHandler.instance;
	}

	public context(aContextMessage: string): this {
		this._contextMsg = aContextMessage;
		return this;
	}

	public message(aErrorMessage: string): this {
		this._errorMsg = aErrorMessage;
		return this;
	}

	public code(aErrCode: HttpStatusCode): this {
		this._statusCode = aErrCode;
		return this;
	}

	public description(aDescription: any): this {
		this._description = aDescription;
		return this;
	}

	public throw(): void {
		throw new ApiError(
			`${this._contextMsg}. ${this._errorMsg}.`,
			this._statusCode,
			this._description
		);
	}
}

// export class BadRequestError extends ApiError {
// 	constructor(message: string, description?: any) {
// 		super(message, HttpStatusCode.BAD_REQUEST, description);
// 	}
// }

// export class NotFoundError extends ApiError {
// 	constructor(message: string, description?: any) {
// 		super(message, HttpStatusCode.NOT_FOUND, description);
// 	}
// }

// export class UnauthorizedError extends ApiError {
// 	constructor(message: string, description?: any) {
// 		super(message, HttpStatusCode.UNATHOURIZED, description);
// 	}
// }
