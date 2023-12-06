import { Exception } from "@models/Exception";
import { COLOR_ERROR } from "@constants";
import { EXCEPTION_CODES, Platforms } from "@enums";

/**
 * Exception where a user try to create a new matchmaking ticket but he already has one in progress for this
 * platform.
 */
export class MatchmakingInProgressException extends Exception {
    /* ======================= Constructor ======================= */
    constructor(platform: Platforms) {
        super(
            EXCEPTION_CODES.CHAMPIONSHIP_MATCHMAKING_IN_PROGRESS,
            `Vous avez déjà une recherche de match en cours sur ${platform}. Merci de patienter le temps que nous trouvions un adversaire.`,
            COLOR_ERROR
        );
    }
}
