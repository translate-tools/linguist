/**
 * Calculate token for translate request with specified string
 *
 * @param query string for translate
 */
export function getToken (query: string): Promise<{value: string}>;