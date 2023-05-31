import bcrypt from 'bcrypt';

export async function hashPassword(plainTextPassword: string): Promise<string> {
	if (!plainTextPassword) return '';
	return await bcrypt.hash(plainTextPassword, 10);
}
