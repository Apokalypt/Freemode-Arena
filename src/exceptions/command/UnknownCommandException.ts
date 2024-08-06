import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where the bot can't find the command associated to the name in the code
 */
export class UnknownCommandException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.UNKNOWN_COMMAND, "Imposible de trouver la commande!", COLOR_ERROR);
    }
}
