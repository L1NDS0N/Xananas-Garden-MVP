export function sanitizeObject(obj: Record<string, any>): any {
	const sanitizedObj: any = {};
	Object.keys(obj).forEach(key => {
		const value = obj[key];
		if (value) {
			sanitizedObj[key] = value;
		}
	});
	return sanitizedObj;
}
