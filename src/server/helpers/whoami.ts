import jwt from 'jsonwebtoken';

export function whoAmI<T>(jwtBearerToken: string, key: string): T {
	const token = jwtBearerToken.replace('Bearer ', '');
	return jwt.verify(token, key) as T;
}
