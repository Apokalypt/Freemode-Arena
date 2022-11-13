const FreemodeArenaError = require('./FreemodeArenaError');

class WeaponsSelectionAlreadyValidated extends FreemodeArenaError {
    constructor() {
        super('Vous avez déjà validé votre sélection d\'armes pour ce match.');
    }
}

module.exports = WeaponsSelectionAlreadyValidated;
