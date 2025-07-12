import { getObjectsDiff } from './json';

test('intersection mode returns all nested nodes that does match', () => {
	expect(
		getObjectsDiff(
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
				newObject: {},
			},
			'intersection',
		),
	).toStrictEqual({
		option1: {
			foo: 'foo',
		},
		option3: 'value',
	});
});

test.only('diff mode returns all nested nodes that does not match', () => {
	expect(
		getObjectsDiff(
			{
				option1: {
					foo: 'foo',
				},
				option3: 'value',
				oldObject: {},
			},
			{
				option1: {
					foo: 'foo',
					bar: 'bar',
				},
				option2: 'value',
				option3: 'value',
				newObject: {},
			},
			'diff',
		),
	).toStrictEqual({
		option1: {
			bar: 'bar',
		},
		option2: 'value',
		newObject: {},
	});

	expect(
		getObjectsDiff(
			{
				option1: {
					foo: 'foo',
				},
				option3: 'value',
				oldObject: {},
			},
			{
				option1: {
					foo: 'foo',
				},
				option3: 'value',
				oldObject: {},
			},
			'diff',
		),
	).toStrictEqual({});
});
