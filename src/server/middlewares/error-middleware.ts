import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '../helpers/api-error';
import { ErrorMiddleware } from '../core/NextApiRouter';

// export function errorMiddleware(): ErrorMiddleware {
// 	return (err: any, req: NextApiRequest, res: NextApiResponse, next: (error: any) => void) => {
// 		if (err instanceof ApiError) {
// 		  return res.status(err.statusCode).json({
// 			error: {
// 			  message: err.message,
// 			  errors: err.description,
// 			},
// 		  });
// 		} else {
// 		  return res.status(500).json({ error: 'Internal server error' });
// 		}
// 		next(err);
// 	};
// }
export const errorMiddleware: ErrorMiddleware = (
	error: any,
	req: NextApiRequest,
	res: NextApiResponse,
	next: () => void,
) => {
	console.log(error?.message)

	const statusCode = error?.statusCode ?? 500;
	const message = error?.statusCode ? error.message : 'Erro interno no servidor 😢';
	const description = error?.description ? error.description : undefined;

	return res.status(statusCode).send({ message, description });
};