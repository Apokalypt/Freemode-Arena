import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where a user try to register for a championship but the registration is refused.
 */
export class RegistrationRefusedException extends Exception {
    /* ======================= Constructor ======================= */
    constructor(reason: string) {
        super(
            EXCEPTION_CODES.CHAMPIONSHIP_REGISTRATION_REFUSED,
            `Vous n'êtes pas autorisé à vous inscrire au championnat.\n\n**Raison :** ${reason}`,
            COLOR_ERROR
        );
    }
}
