import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where a user try to do an action related to a match, but he is not in this match.
 */
export class UnknownPlayerException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.CHAMPIONSHIP_UNKNOWN_PLAYER, "Vous n'êtes pas un joueur de ce match.", COLOR_ERROR);
    }
}
