import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where a user try to do an action but his current state doesn't allow it (e.g. validate weapons selection
 * when he didn't select any weapon).
 */
export class InvalidPlayerStateException extends Exception {
    /* ======================= Constructor ======================= */
    constructor(reason: string) {
        super(
            EXCEPTION_CODES.CHAMPIONSHIP_INVALID_PLAYER_STATE,
            `Vous ne pouvez pas effectuer cette action car vous êtes dans un état invalide : ${reason}`,
            COLOR_ERROR
        );
    }
}
