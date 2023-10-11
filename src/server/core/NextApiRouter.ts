import { NextApiRequest, NextApiResponse } from 'next';

export type Middleware = (
	req: NextApiRequest,
	res: NextApiResponse,
	next: () => void
) => void;
type RouteHandler = (req: NextApiRequest, res: NextApiResponse) => void;

export type NextApiRouter = {
	get: (handler: RouteHandler, middlewares?: Middleware[]) => void;
	post: (handler: RouteHandler, middlewares?: Middleware[]) => void;
	put: (handler: RouteHandler, middlewares?: Middleware[]) => void;
	delete: (handler: RouteHandler, middlewares?: Middleware[]) => void;
	patch: (handler: RouteHandler, middlewares?: Middleware[]) => void;
	use: (middleware: Middleware) => void;
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
	middlewares?: Middleware[];
};

function createNextApiRouter(): NextApiRouter {
	const routes: Route[] = [];

	function get(handler: RouteHandler, middlewares?: Middleware[]) {
		addRoute(HttpMethod.GET, handler, middlewares);
	}

	function post(handler: RouteHandler, middlewares?: Middleware[]) {
		addRoute(HttpMethod.POST, handler, middlewares);
	}

	function put(handler: RouteHandler, middlewares?: Middleware[]) {
		addRoute(HttpMethod.PUT, handler, middlewares);
	}

	function deleteRoute(handler: RouteHandler, middlewares?: Middleware[]) {
		addRoute(HttpMethod.DELETE, handler, middlewares);
	}

	function patch(handler: RouteHandler, middlewares?: Middleware[]) {
		addRoute(HttpMethod.PATCH, handler, middlewares);
	}

	function use(middleware: Middleware) {
		routes.forEach(route => {
			if (!route.middlewares) {
				route.middlewares = [];
				route.middlewares.push(middleware);
			} else {
				route.middlewares.push(middleware);
			}
		});
	}

	function addRoute(
		method: HttpMethod,
		handler: RouteHandler,
		middlewares?: Middleware[]
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
				const middlewares: Middleware[] = [];
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
		middlewares: Middleware[]
	) {
		function next() {
			const middleware = middlewares.shift();
			if (middleware) {
				middleware(req, res, next);
			}
		}
		next();
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
