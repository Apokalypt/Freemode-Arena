import { ExceptionCodes } from "@enums";
import { COLOR_ERROR_WARNING } from "@constants";

/**
 * General class for exception
 */
export class Exception extends Error {
    /**
     * Exception code
     */
    public readonly code: ExceptionCodes;
    /**
     * JSON stringify of data to store explanation or stack error of the exception (useful for unknown error)
     */
    public readonly moreData?: string;

    /**
     * Color to use for Discord embed
     */
    public readonly color: number = COLOR_ERROR_WARNING;



    constructor(code: ExceptionCodes, message: string, color = COLOR_ERROR_WARNING, moreData?: string) {
        super(message);

        this.code = code;
        this.color = color;
        this.moreData = moreData;
    }

    public toEmbed() {
        return { description: this.message, color: this.color };
    }
}
