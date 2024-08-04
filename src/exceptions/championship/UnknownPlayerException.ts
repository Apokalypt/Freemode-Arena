import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES } from "@enums";

/**
 * Exception where we try to get player information, but we can't find the player.
 */
export class UnknownPlayerException extends Exception {
    /* ======================= Constructor ======================= */
    constructor(id: string) {
        super(
            EXCEPTION_CODES.CHAMPIONSHIP_UNKNOWN_PLAYER,
            `Impossible de trouver les informations de <@${id}> (${id}).\n` +
                "Cela signifie souvent que le joueur n'est pas encore inscrit au championnat.",
            COLOR_ERROR
        );
    }
}
