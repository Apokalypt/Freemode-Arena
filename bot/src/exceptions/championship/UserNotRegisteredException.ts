import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where a user try to do an action that require him to be registered in the championship, but he is not.
 */
export class UserNotRegisteredException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.CHAMPIONSHIP_REGISTRATION_REQUIRED, "Vous devez vous inscrire au tournoi avant de ouvoir faire ceci!", COLOR_ERROR);
    }
}
