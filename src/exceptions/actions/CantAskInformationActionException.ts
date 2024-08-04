import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

export class CantAskInformationActionException extends Exception {
    constructor() {
        super(EXCEPTION_CODES.CANT_ASK_INFORMATION_FOR_ACTION, "Il n'y a pas d'interaction liée à cette action pour demander des informations.");
    }
}
