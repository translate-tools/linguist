const addRandomDelaysForMethods = (object, methods) => {
	function getRandomInt(max = 1) {
		return Math.floor(Math.random() * max);
	}

	return new Proxy(object, {
		get(target, prop) {
			const object = target[prop];
			if (typeof object !== 'function') return object;

			const isNeedDelay = methods.includes(prop);

			return (...args) => {
				if (!isNeedDelay) {
					return object(...args);
				}

				return Promise.resolve().then(async () => {
					const delay = getRandomInt(20);

					console.log('Wait a delay', delay);
					await new Promise((res) => setTimeout(res, delay));

					return object(...args);
				});
			};
		},
	});
};

module.exports = { addRandomDelaysForMethods };
