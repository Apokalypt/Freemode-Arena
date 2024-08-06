import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where a user try to do an action in a channel that is not set as a championship channel for a match
 */
export class UnknownMatchException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.CHAMPIONSHIP_UNKNOWN_MATCH, "Impossible de trouver le match associé", COLOR_ERROR);
    }
}
