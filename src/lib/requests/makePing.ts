/**
 * Constructor for build ping function with timeout and delay
 */
export const makePing = (
	callback: () => Promise<'pong'>,
	timeout?: number,
	delay?: number,
): Promise<void> => {
	const startTime = new Date().getTime();
	const sleep = (delay: number) =>
		new Promise<void>((res) => window.setTimeout(res, delay));

	return new Promise(async (resolve, reject) => {
		let breakFlag = false;
		while (!breakFlag) {
			await callback()
				.then((response) => {
					if (response === 'pong') {
						resolve();

						// Stop loop
						breakFlag = true;
					} else {
						throw new Error('Incorrect ping response');
					}
				})
				.catch(async () => {
					if (
						timeout !== undefined &&
						new Date().getTime() - startTime >= timeout
					) {
						reject(new Error('Timeout'));

						// Stop loop
						breakFlag = true;
					} else {
						// Delay before next request
						if (delay !== undefined) {
							await sleep(delay);
						}
					}
				});
		}
	});
};
