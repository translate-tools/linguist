// Proxify global `jest` object,
// to make works packages with mocks, that actively use `jest` internally
globalThis.jest = vi;
