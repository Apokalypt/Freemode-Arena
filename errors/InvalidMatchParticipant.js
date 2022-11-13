const FreemodeArenaError = require('./FreemodeArenaError');

class InvalidMatchParticipant extends FreemodeArenaError {
    constructor() {
        super('Vous ne semblez pas participer à ce duel et ne pouvez donc pas réaliser cette action.');
    }
}

module.exports = InvalidMatchParticipant;
