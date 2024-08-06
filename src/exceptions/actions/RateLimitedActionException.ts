import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

export class RateLimitedActionException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.RATE_LIMITED_ACTION, "Vous avez atteint la limite pour cette action. Veuillez réessayer plus tard...");
    }
}
