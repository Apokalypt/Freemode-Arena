const FreemodeArenaError = require('./FreemodeArenaError');

class NoWeaponsSelected extends FreemodeArenaError {
    constructor() {
        super('Vous n\'avez pas encore sélectionné d\'armes. Veuillez sélectionner au moins une arme (hors bonus).');
    }
}

module.exports = NoWeaponsSelected;
