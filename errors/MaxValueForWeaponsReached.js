const FreemodeArenaError = require('./FreemodeArenaError');

class MaxValueForWeaponsReached extends FreemodeArenaError {
    constructor() {
        super('La valeur de vos armes dépasse la limite autorisée. Veuillez supprimer des armes de votre sélection et réessayer.');
    }
}

module.exports = MaxValueForWeaponsReached;
