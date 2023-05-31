import { NextApiRequest, NextApiResponse } from 'next';


export type ErrorMiddleware = (
	error: any,
	req: NextApiRequest,
	res: NextApiResponse,
	next: (error?: any) => void
) => void;

export type CommonMiddleware = (
	req: NextApiRequest,
	res: NextApiResponse,
	next: () => void
) => void;

export type Middlewares = CommonMiddleware | ErrorMiddleware;

type RouteHandler = (req: NextApiRequest, res: NextApiResponse) => void;

export type NextApiRouter = {
	get: (handler: RouteHandler, middlewares?: Middlewares[]) => void;
	post: (handler: RouteHandler, middlewares?: Middlewares[]) => void;
	put: (handler: RouteHandler, middlewares?: Middlewares[]) => void;
	delete: (handler: RouteHandler, middlewares?: Middlewares[]) => void;
	patch: (handler: RouteHandler, middlewares?: Middlewares[]) => void;
	use: (middleware: Middlewares) => void;
	handle: () => (req: NextApiRequest, res: NextApiResponse) => void;
};

enum HttpMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE',
	PATCH = 'PATCH',
}

type Route = {
	method: HttpMethod;
	handler: RouteHandler;
	middlewares?: Middlewares[];
};

function createNextApiRouter(): NextApiRouter {
	const routes: Route[] = [];

	function get(handler: RouteHandler, middlewares?: Middlewares[]) {
		addRoute(HttpMethod.GET, handler, middlewares);
	}

	function post(handler: RouteHandler, middlewares?: Middlewares[]) {
		addRoute(HttpMethod.POST, handler, middlewares);
	}

	function put(handler: RouteHandler, middlewares?: Middlewares[]) {
		addRoute(HttpMethod.PUT, handler, middlewares);
	}

	function deleteRoute(handler: RouteHandler, middlewares?: Middlewares[]) {
		addRoute(HttpMethod.DELETE, handler, middlewares);
	}

	function patch(handler: RouteHandler, middlewares?: Middlewares[]) {
		addRoute(HttpMethod.PATCH, handler, middlewares);
	}

	function use(middleware: Middlewares) {
		routes.forEach(route => {
			if (!route.middlewares) {
				route.middlewares = [];
			} else {
				route.middlewares.push(middleware);
			}
		});
	}

	function addRoute(
		method: HttpMethod,
		handler: RouteHandler,
		middlewares?: Middlewares[]
	) {
		const routeAlreadyExists = routes.find(route => route.method === method);
		if (routeAlreadyExists) {
			throw new Error(`It already has a route for ${method}`);
		}
		routes.push({ method, handler, middlewares });
	}

	function handle() {
		return (req: NextApiRequest, res: NextApiResponse) => {
			const method = req.method as HttpMethod;
			const route = routes.find(route => route.method === method);
			if (route) {
				const middlewares: Middlewares[] = [];
				if (route.middlewares) {
					route.middlewares.forEach(middleware => {
						middlewares.push(middleware);
					});
				}
				middlewares.push(route.handler);
				runMiddlewares(req, res, middlewares);
			} else {
				res.status(404).json({ error: 'Cannot find the route' });
			}
		};
	}

	function runMiddlewares(
		req: NextApiRequest,
		res: NextApiResponse,
		middlewares: Middlewares[],		
	) {
		function next(error?: any) {
			const middleware = middlewares.shift();

			if (middleware) {
				if (isErrorMiddleware(middleware)) {
					middleware(error, req, res, next);
				} else {
				middleware(req, res, next);
				}
			}
		}
		next();
	}

	function isErrorMiddleware(
		middleware: Middlewares
	): middleware is ErrorMiddleware {		
		(middleware as ErrorMiddleware);
		return true;
	}

	return {
		get,
		post,
		put,
		delete: deleteRoute,
		patch,
		use,
		handle,
	};
}

export default createNextApiRouter;
