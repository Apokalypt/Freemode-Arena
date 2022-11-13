const FreemodeArenaError = require('./FreemodeArenaError');

class UserAlreadyWaitingForOpponent extends FreemodeArenaError {
    /**
     * @param {string} platform
     */
    constructor(platform) {
        super(
            `Il semblerait que vous attendiez déjà un adversaire pour ${platform}.\n` +
            'Pas de panique, vous serez notifié dès qu\'un adversaire sera disponible.'
        );
    }
}

module.exports = UserAlreadyWaitingForOpponent;
