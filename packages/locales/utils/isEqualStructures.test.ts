import { isEqualStructures } from './json';

test('equal for arrays with the same length', () => {
	expect(isEqualStructures([1, 2, 3], [4, 5, 6])).toBe(true);
	expect(isEqualStructures([], [])).toBe(true);
});

test('not equal for arrays with the different length', () => {
	expect(isEqualStructures([1, 2, 3], [4, 5])).toBe(false);
	expect(isEqualStructures([1, 2], [4, 5, 6])).toBe(false);
});

test('equal for complex objects with the same structure', () => {
	expect(
		isEqualStructures(
			{
				foo: 1,
				bar: 'some text',
				baz: {
					nestedArray: [1, 2, 3],
					nestedObject: {
						x: 'x',
						y: 'y',
					},
				},
			},
			{
				foo: 2,
				bar: 'another text',
				baz: {
					nestedArray: [9, 8, 7],
					nestedObject: {
						x: 'y',
						y: 'x',
					},
				},
			},
		),
	).toBe(true);
});
