import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where the bot can't find the action
 */
export class UnknownActionException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.UNKNOWN_ACTION, "Je n'ai pas trouvé l'action à executer!");
    }
}
