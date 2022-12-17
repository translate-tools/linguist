import { createMigrationTask, Migration } from './createMigrationTask';

function generateDataSample() {
	return [
		{ title: 'Title 1', tags: ['foo', 'bar'] },
		{ title: 'Title 2', tags: ['bar'] },
		{ title: 'Title 3', tags: ['qux', 'foo'] },
	];
}

let data: Record<string, any>[] = [];

const migrations: Migration[] = [
	{
		version: 1,
		async migrate() {
			data = data.map((entry) => {
				entry.name = entry.title;
				delete entry.title;
				return entry;
			});
		},
	},
	{
		version: 2,
		async migrate() {
			// Imitate delay
			await new Promise((res) => setTimeout(res, 300));

			data = data.map((entry) => {
				entry.keywords = entry.tags;
				delete entry.tags;
				return entry;
			});
		},
	},
	{
		version: 3,
		async migrate(previousVersion) {
			if (previousVersion !== 1) return;

			data = data.map((entry) => {
				entry.additionalData = '[additional data]';
				return entry;
			});
		},
	},
	{
		version: 4,
		async migrate() {
			data = data.map((entry) => {
				entry.hashtags = entry.keywords.map((keyword: string) => '#' + keyword);
				return entry;
			});
		},
	},
];

describe('data migration util', () => {
	test('migrate from v0 to v3', async () => {
		data = generateDataSample();

		const migration = createMigrationTask(migrations);
		await migration.migrate(0, 3);

		expect(data.length).toBe(3);
		data.forEach((data) => {
			expect(Object.keys(data).sort()).toEqual(['name', 'keywords'].sort());
		});
	});

	test('migrate from v0 to v4', async () => {
		data = generateDataSample();

		const migration = createMigrationTask(migrations);
		await migration.migrate(0, 4);

		expect(data.length).toBe(3);
		data.forEach((data) => {
			expect(Object.keys(data).sort()).toEqual(
				['name', 'keywords', 'hashtags'].sort(),
			);
		});
	});

	test('migrate from v1 to v4', async () => {
		data = generateDataSample();

		const migration = createMigrationTask(migrations);
		await migration.migrate(1, 4);

		expect(data.length).toBe(3);
		data.forEach((data) => {
			expect(Object.keys(data).sort()).toEqual(
				['title', 'keywords', 'hashtags'].sort(),
			);
		});
	});

	test('migrations with previous version condition from v0 to v3', async () => {
		data = generateDataSample();

		const migrationsExcludeV2 = migrations.filter(({ version }) => version !== 2);
		const migration = createMigrationTask(migrationsExcludeV2);
		await migration.migrate(0, 3);

		expect(data.length).toBe(3);
		data.forEach((data) => {
			expect(Object.keys(data).sort()).toEqual(
				['name', 'tags', 'additionalData'].sort(),
			);
		});
	});
});
