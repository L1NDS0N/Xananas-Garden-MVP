import { errorMiddleware } from '@/server/middlewares/error-middleware';
import createNextApiRouter from '@/server/core/NextApiRouter';
import { ErrorHandler, HttpStatusCode } from '@/server/helpers/api-error';

const apiRouter = createNextApiRouter();

apiRouter.get((req, res) => {
	throw new Error("TESTE");
	
	// ErrorHandler.new()
	// 	.code(HttpStatusCode.BAD_REQUEST)
	// 	.context('Erro ao obter teste.')
	// 	.message('Você não pode fazer teste.')
	// 	.throw();
	// return res.send('hello world');
});
apiRouter.use(errorMiddleware);


export default apiRouter.handle();
