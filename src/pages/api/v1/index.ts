import { ErrorHandler, HttpStatusCode } from '@/server/helpers/api-error';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
	ErrorHandler.new()
		.code(HttpStatusCode.OK)
		.context('Bem vindo')
		.message('Mensagem de erro teste')
		.throw();
	return res.send('hello world');
}
