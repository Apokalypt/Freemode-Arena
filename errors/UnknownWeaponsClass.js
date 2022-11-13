const FreemodeArenaError = require('./FreemodeArenaError');

class UnknownWeaponsClass extends FreemodeArenaError {
    constructor() {
        super('Impossible de déterminer la classe d\'armes. Veuillez contacter un administrateur du serveur...');
    }
}

module.exports = UnknownWeaponsClass;
