import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where the user is not allowed to execute the action
 */
export class UnauthorizedActionException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.UNAUTHORIZED_ACTION, "Vous n'êtes pas autorisé à effectuer cette action.");
    }
}
