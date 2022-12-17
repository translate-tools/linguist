/**
 * Map where key is migration name and value is migration version
 */
export type MigrationsMap = Record<string, number>;

/**
 * Storage with migrations versions
 */
export interface MigrationsStorage {
	getMigrationsVersions: () => Promise<MigrationsMap>;
	setMigrationsVersions: (migrations: MigrationsMap) => Promise<void>;
}
