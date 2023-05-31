import bcrypt from 'bcrypt';
import { Middleware } from "../core/NextApiRouter";

export const hashPasswordMiddleware: Middleware = async (req, res, next) => {
	const { password } = req.body;
	if (password) {
		const hashedPassword = await bcrypt.hash(password, 10);
		req.body.hashedPassword = hashedPassword;
	}
	next();
};