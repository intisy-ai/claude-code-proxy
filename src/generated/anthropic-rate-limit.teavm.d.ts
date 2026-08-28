// Generated from Java sources. Do not edit.

/**
 * The claude-code routing profile's data fields, as JSON.
 *
 * @remarks
 * The regex fields arrive as their pattern strings, which a JS caller wraps back into
 * a RegExp; the profile's function-valued members stay JS-native and are not carried here.
 *
 * @returns that data as a JSON object
 */
export declare function profileJson(): string;
/**
 * Synthesizes the rate-limit response for an upstream outcome, as JSON.
 *
 * @param argsJson - the upstream status, its headers, the reset instant and now
 * @returns the status, headers and body to answer with, as a JSON object
 */
export declare function synthJson(argsJson: string): string;

