import { createEvent, createStore } from 'effector';

import { equalMap } from '.';

test('mapped store do not updates for data that equal current state', () => {
	const $store1 = createStore({
		foo: { x: 1 },
		bar: { x: 2 },
		baz: { x: 3 },
	});

	const updated = createEvent<
		Record<
			string,
			{
				x: number;
			}
		>
	>();
	$store1.on(updated, (state, payload) => ({ ...state, ...payload }));

	const $subStore = equalMap($store1, ({ foo, bar }) => ({ foo, bar }));

	const watcher = jest.fn();

	$subStore.watch(watcher);
	expect(watcher).toBeCalledTimes(1);

	// Ignore, because mapper does not use this property
	updated({ baz: { x: 42 } });
	updated({ qux: { x: 42 } });
	expect(watcher).toBeCalledTimes(1);

	// Update new value
	updated({ foo: { x: 42 } });
	expect(watcher).toBeCalledTimes(2);

	updated({ bar: { x: 42 } });
	expect(watcher).toBeCalledTimes(3);

	updated({ foo: { x: 777 }, bar: { x: 333 } });
	expect(watcher).toBeCalledTimes(4);

	// Ignore, because values are equal
	updated({ foo: { x: 777 }, bar: { x: 333 } });
	updated({ bar: { x: 333 } });
	expect(watcher).toBeCalledTimes(4);
});
