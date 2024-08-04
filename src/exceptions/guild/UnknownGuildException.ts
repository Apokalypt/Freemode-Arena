import type { Snowflake } from "discord.js";
import { Exception } from "@models/Exception";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where the guild can't be found with his id
 */
export class UnknownGuildException extends Exception {
    /* ======================= Constructor ======================= */
    constructor(guildId: Snowflake) {
        super(EXCEPTION_CODES.UNKNOWN_GUILD, `Impossible de trouver le serveur avec l'id '${guildId}'`);
    }
}
