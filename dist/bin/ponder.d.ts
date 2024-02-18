#!/usr/bin/env node
/**
 * CLI options for `ponder` commands. Note that we don't always use CAC's built-in
 * default value behavior, because we want to know downstream if the user explicitly
 * set a value or not.
 */
type CliOptions = {
    help?: boolean;
    root?: string;
    config: string;
    port?: number;
    hostname?: string;
    v?: boolean | boolean[];
    debug?: boolean | boolean[];
    trace?: boolean;
};

export type { CliOptions };
