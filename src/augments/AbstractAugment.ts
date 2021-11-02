/**
 * Augmentation class define component which may appear on page optionally
 *
 * It may be configure, enable and disable any time
 */
export abstract class AbstractAugment<T = any> {
	/**
	 * Standard method to set any data for augmentation
	 */
	public setConfig(_config: T) {}

	/**
	 * Lifecycle method to enable augmentation
	 *
	 * This method may initialize component
	 */
	public abstract enable(): void;

	/**
	 * Lifecycle method to disable augmentation
	 *
	 * This method must cleanup component
	 */
	public disable() {}
}
