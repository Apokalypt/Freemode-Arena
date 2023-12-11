import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

export class ActionPropertyNotSerializableException extends Exception {
    constructor(property: string) {
        super(
            EXCEPTION_CODES.ACTION_PROPERTY_NOT_SERIALIZABLE,
            `Impossible de sérialiser la propriété \`${property}\` de l'action...`
        );
    }
}
