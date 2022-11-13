const FreemodeArenaError = require('./FreemodeArenaError');

class NoPreviousSelectionValidated extends FreemodeArenaError {
    constructor() {
        super('Vous n\'avez pas validé de sélection pour le moment, vous ne pouvez donc pas faire ceci.');
    }
}

module.exports = NoPreviousSelectionValidated;
