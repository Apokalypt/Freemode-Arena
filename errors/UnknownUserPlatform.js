const FreemodeArenaError = require('./FreemodeArenaError');

class UnknownUserPlatform extends FreemodeArenaError {
    constructor() {
        super('Impossible de déterminer votre plateforme. Veuillez contacter un administrateur du serveur...');
    }
}

module.exports = UnknownUserPlatform;
