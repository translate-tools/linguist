import { sliceJsonString } from './json';

test('Large object is sliced to few small objects', () => {
	expect(sliceJsonString(`{"foo": "foo", "bar": "bar", "baz": "baz"}`, 14)).toEqual([
		`{"foo":"foo"}`,
		`{"bar":"bar"}`,
		`{"baz":"baz"}`,
	]);
});

test('When limit is lower than single object length, it will be violated to fit single object', () => {
	expect(sliceJsonString(`{"foo": "foo", "bar": "bar", "baz": "baz"}`, 1)).toEqual([
		`{"foo":"foo"}`,
		`{"bar":"bar"}`,
		`{"baz":"baz"}`,
	]);
});

test('Every string fits as many objects as possible', () => {
	expect(sliceJsonString(`{"foo": "foo", "bar": "bar", "baz": "baz"}`, 25)).toEqual([
		`{"foo":"foo","bar":"bar"}`,
		`{"baz":"baz"}`,
	]);
});

test('Large object is sliced to fit in size limit', () => {
	expect(sliceJsonString(`{"foo": "foo", "bar": "bar", "baz": "baz"}`, 30, 1)).toEqual([
		`{"foo":"foo"}`,
		`{"bar":"bar"}`,
		`{"baz":"baz"}`,
	]);
});
