import { TGenericMessage, TGenericMessageArgs } from '@/server/references/generic-error';

export type TGenericErrorParams = {
	statusCode: HttpStatusCode;
	message: TGenericMessage;
	description?: string;
	field?: string;
} & TGenericMessageArgs;

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
		this.description = description;
		this.statusCode = statusCode;

		Object.setPrototypeOf(this, new.target.prototype);
		Error.captureStackTrace(this);
	}
}

export class ErrorHandler {
	private static instance: ErrorHandler;

	private contextMsg!: string;
	private errorMsg!: string;
	private statusCode = HttpStatusCode.BAD_REQUEST;

	public static new(): ErrorHandler {
		if (!ErrorHandler.instance) {
			ErrorHandler.instance = new ErrorHandler();
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
		throw new ApiError(this.errorMsg, this.statusCode, this.contextMsg);
	}
}

export class GenericError {
	constructor({ statusCode, message, contexts, cases, description, field }: TGenericErrorParams) {
		const $case = message['error'][contexts]['case'];
		const $msg = field ? ($case[cases] as any)(field) : ([$case[cases]]);
		const $error = ErrorHandler.new().code(statusCode).message($msg);
		if (description) $error.context(description);
		$error.throw()
	}
}

export class BadRequestError {
	constructor(message: TGenericMessage, { cases, contexts, field }: TGenericMessageArgs, description?: string) {
		new GenericError({ statusCode: HttpStatusCode.BAD_REQUEST, message, cases, contexts, description, field });
	}
}

export class NotFoundError {
	constructor(message: TGenericMessage, { cases, contexts, field }: TGenericMessageArgs, description?: string) {
		new GenericError({ statusCode: HttpStatusCode.NOT_FOUND, message, cases, contexts, description, field });
	}
}

export class UnauthorizedError {
	constructor(message: TGenericMessage, { cases, contexts, field }: TGenericMessageArgs, description?: string) {
		new GenericError({ statusCode: HttpStatusCode.UNATHOURIZED, message, cases, contexts, description, field });
	}
}

export class InternalError {
	constructor(message: TGenericMessage, { cases, contexts, field }: TGenericMessageArgs, description?: string) {
		new GenericError({ statusCode: HttpStatusCode.INTERNAL_SERVER, message, cases, contexts, description, field });
	}
}

