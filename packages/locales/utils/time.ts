export function getWaitTimeWithJitter({
	base,
	max,
	retry,
}: {
	base: number;
	max: number;
	retry: number;
}): number {
	const exp = Math.min(base * 2 ** retry, max);
	const jitter = Math.random() * exp * 0.5; // 0–50% jitter
	return exp + jitter;
}

export const waitTimeWithJitter = (
	...options: Parameters<typeof getWaitTimeWithJitter>
) => new Promise((res) => setTimeout(res, getWaitTimeWithJitter(...options)));
