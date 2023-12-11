import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

export class ActionNotSerializableException extends Exception {
    constructor() {
        super(EXCEPTION_CODES.ACTION_NOT_SERIALIZABLE, `Impossible de sérialiser l'action...`);
    }
}
