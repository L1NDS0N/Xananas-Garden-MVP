import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '../helpers/api-error';

export const errorMiddleware = (
	error: ApiError,
    req: NextApiRequest,
	res: NextApiResponse,
) => {
	const statusCode = error.statusCode ?? 500;
	const message = error.statusCode ? error.message : 'Erro interno no servidor 😢';
	const description = error.description ? error.description : undefined;

	return res.status(statusCode).send({ message, description });
};