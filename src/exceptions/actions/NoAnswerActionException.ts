import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

export class NoAnswerActionException extends Exception {
    constructor() {
        super(EXCEPTION_CODES.NO_ANSWER, "Vous n'avez pas répondu à temps.");
    }
}
