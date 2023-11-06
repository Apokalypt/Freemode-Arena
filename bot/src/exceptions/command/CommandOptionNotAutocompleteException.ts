import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where the bot can't autocomplete the option of a command
 */
export class CommandOptionNotAutocompleteException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.OPTION_NOT_AUTOCOMPLETE, "Imposible de trouver l'action associée à votre commande!", COLOR_ERROR);
    }
}
