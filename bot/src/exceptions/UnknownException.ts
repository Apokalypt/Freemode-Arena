import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where an unknown error occurred
 */
export class UnknownException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(
            EXCEPTION_CODES.UNKNOWN_ERROR,
            "Une erreur inconnue est survenue, veuillez le signaler au staff du serveur!",
            COLOR_ERROR
        );
    }
}
