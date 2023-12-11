import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

export class InvalidActionException extends Exception {
    /* ======================= Constructor ======================= */
    constructor(message: string) {
        super(EXCEPTION_CODES.INVALID_ACTION, message);
    }
}
