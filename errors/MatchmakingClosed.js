const FreemodeArenaError = require('./FreemodeArenaError');

class MatchmakingClosed extends FreemodeArenaError {
    constructor() {
        super('Le tournoi est terminé, vous ne pouvez plus chercher d\'adversaire. Si vous avez des matchs en cours vous avez jusqu\'au 19 Décembre pour les faire...');
    }
}

module.exports = MatchmakingClosed;
