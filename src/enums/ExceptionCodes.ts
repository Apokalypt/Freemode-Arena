import type { ObjectValues } from "@bot-types";

export const EXCEPTION_CODES = {
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    NOT_SUPPORTED: "NOT_SUPPORTED",

    UNKNOWN_ACTION: "UNKNOWN_ACTION",
    UNAUTHORIZED_ACTION: "UNAUTHORIZED_ACTION",
    INVALID_ACTION: "INVALID_ACTION",
    RATE_LIMITED_ACTION: "RATE_LIMITED_ACTION",
    ABANDONED_ACTION: "ABANDONED_ACTION",
    NO_ANSWER: "NO_ANSWER",
    CANT_ASK_INFORMATION_FOR_ACTION: "CANT_ASK_INFORMATION_FOR_ACTION",
    ACTION_NOT_SERIALIZABLE: "ACTION_NOT_SERIALIZABLE",
    ACTION_PROPERTY_NOT_SERIALIZABLE: "ACTION_PROPERTY_NOT_SERIALIZABLE",

    CHAMPIONSHIP_REGISTRATION_REFUSED: "CHAMPIONSHIP_REGISTRATION_REFUSED",
    CHAMPIONSHIP_REGISTRATION_REQUIRED: "CHAMPIONSHIP_REGISTRATION_REQUIRED",
    CHAMPIONSHIP_INVALID_USER_SELECTION: "CHAMPIONSHIP_INVALID_USER_SELECTION",
    CHAMPIONSHIP_INVALID_PLAYER_STATE: "CHAMPIONSHIP_INVALID_PLAYER_STATE",
    CHAMPIONSHIP_NOT_PLAYER_IN_MATCH: "CHAMPIONSHIP_NOT_PLAYER_IN_MATCH",
    CHAMPIONSHIP_UNKNOWN_MATCH: "CHAMPIONSHIP_UNKNOWN_MATCH",
    CHAMPIONSHIP_UNKNOWN_PLAYER: "CHAMPIONSHIP_UNKNOWN_PLAYER",
    CHAMPIONSHIP_MATCHMAKING_IN_PROGRESS: "CHAMPIONSHIP_MATCHMAKING_IN_PROGRESS",

    OPTION_NOT_AUTOCOMPLETE: "OPTION_NOT_AUTOCOMPLETE",
    UNKNOWN_COMMAND: "UNKNOWN_COMMAND",

    UNKNOWN_GUILD: "UNKNOWN_GUILD"
} as const;

export type ExceptionCodes = ObjectValues<typeof EXCEPTION_CODES>;
