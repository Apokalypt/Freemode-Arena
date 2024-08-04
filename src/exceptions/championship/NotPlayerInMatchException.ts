import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where a user try to do an action related to a match, but he is not in this match.
 */
export class NotPlayerInMatchException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.CHAMPIONSHIP_NOT_PLAYER_IN_MATCH, "Vous n'êtes pas un joueur de ce match.", COLOR_ERROR);
    }
}
