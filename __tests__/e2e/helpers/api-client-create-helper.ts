import { createServer, RequestListener } from 'http';
import { NextApiHandler } from 'next';
import { apiResolver } from 'next/dist/server/api-utils/node';
import path from 'path';
import request from 'supertest';

export function createClientServer(handler: NextApiHandler) {
	const listener: RequestListener = async (req, res) => {
		return await apiResolver(
			req,
			res,
			undefined,
			handler,
			{
				previewModeEncryptionKey: '',
				previewModeId: '',
				previewModeSigningKey: '',
			},
			false
		);
	};
	const _server = createServer(listener);
	const _client = request(_server);
	return { _client, _server };
}
export function getApiRoutesDirHandler(relativeDir: string): NextApiHandler {
	const apiRoutesDir = path.join(
		process.cwd(),
		`src/pages/api/v1${relativeDir}`
	);
	return require(apiRoutesDir).default as NextApiHandler;
}
