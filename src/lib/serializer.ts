export const serialize = (value: any): any => {
	if (typeof value !== 'object' || value === null) {
		return value;
	}

	if (value instanceof ArrayBuffer) {
		return {
			___type: 'ArrayBuffer',
			data: Array.from(new Uint8Array(value)),
		};
	}

	if (Array.isArray(value)) {
		return value.map((item) => serialize(item));
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, value]) => [key, serialize(value)]),
	);
};

export const unserialize = (value: any): any => {
	if (typeof value !== 'object' || value === null) {
		return value;
	}

	if (value['___type'] && value.data) {
		switch (value['___type']) {
			case 'ArrayBuffer':
				return new Uint8Array(value.data).buffer;
		}
	}

	if (Array.isArray(value)) {
		return value.map((item) => unserialize(item));
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, value]) => [key, unserialize(value)]),
	);
};
