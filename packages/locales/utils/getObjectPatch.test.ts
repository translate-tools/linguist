import { getObjectPatch } from './json';

describe('comparators', () => {
	const sourceObject = {
		option1: {
			foo: 'foo',
			bar: 'bar',
		},
		option2: 'value',
		option3: 'value',
	};

	const targetObject = {
		option1: {
			foo: 'foo',
			bar: 'changed bar',
		},
		option2: 'changed value',
		option3: 'value',
	};

	test('structured comparator used by default, ignores values', () => {
		expect(getObjectPatch(sourceObject, targetObject)).toStrictEqual({
			subset: targetObject,
			superset: {},
		});
	});

	test('strict values comparator yield diff', () => {
		expect(getObjectPatch(sourceObject, targetObject, Object.is)).toStrictEqual({
			subset: {
				option3: 'value',
			},
			superset: {
				option1: {
					foo: 'foo',
					bar: 'bar',
				},
				option2: 'value',
			},
		});
	});
});

test('for 2 equal objects super set is empty', () => {
	const sourceObject = {
		option1: {
			foo: 'foo',
			bar: 'bar',
		},
		option2: 'value',
		option3: 'value',
	};

	const targetObject = structuredClone(sourceObject);

	expect(getObjectPatch(sourceObject, targetObject)).toStrictEqual({
		subset: sourceObject,
		superset: {},
	});
});

test('source object add properties to target', () => {
	expect(
		getObjectPatch(
			{
				option1: {
					foo: 'foo',
					bar: 'bar',
				},
				option2: 'value',
				option3: 'value',
			},
			{
				option1: {
					foo: 'foo',
				},
				option3: 'value',
			},
		),
	).toStrictEqual({
		subset: {
			option3: 'value',
		},
		superset: {
			option1: {
				foo: 'foo',
				bar: 'bar',
			},
			option2: 'value',
		},
	});
});

test('source object removes properties of target ', () => {
	expect(
		getObjectPatch(
			{
				option1: {
					foo: 'foo',
				},
				option3: 'value',
			},
			{
				option1: {
					foo: 'foo',
					bar: 'bar',
				},
				option2: 'value',
				option3: 'value',
			},
		),
	).toStrictEqual({
		subset: {
			option3: 'value',
		},
		superset: {
			option1: {
				foo: 'foo',
			},
		},
	});
});
