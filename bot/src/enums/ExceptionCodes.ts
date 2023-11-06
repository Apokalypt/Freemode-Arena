import type { ObjectValues } from "@bot-types";

export const EXCEPTION_CODES = {
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    NOT_SUPPORTED: "NOT_SUPPORTED",

    OPTION_NOT_AUTOCOMPLETE: "OPTION_NOT_AUTOCOMPLETE",
    UNKNOWN_COMMAND: "UNKNOWN_COMMAND"
} as const;

export type ExceptionCodes = ObjectValues<typeof EXCEPTION_CODES>;
