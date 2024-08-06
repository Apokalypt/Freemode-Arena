import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where a user select too many weapons based on his budget.
 */
export class InvalidUserSelectionException extends Exception {
    /* ======================= Constructor ======================= */
    constructor(reason: string) {
        super(
            EXCEPTION_CODES.CHAMPIONSHIP_INVALID_USER_SELECTION,
            `Vous ne pouvez pas sélectionner ces armes.\n\n**Raison :** ${reason}`,
            COLOR_ERROR
        );
    }
}
