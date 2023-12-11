import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where a feature is called but the bot doesn't fully support it yet
 */
export class NotSupportedException extends Exception {
    /* ======================= Constructor ======================= */
    constructor() {
        super(EXCEPTION_CODES.NOT_SUPPORTED, "Le bot ne supporte pas encore cette fonctionnalité!");
    }
}
