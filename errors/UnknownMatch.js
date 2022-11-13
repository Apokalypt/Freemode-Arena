const FreemodeArenaError = require('./FreemodeArenaError');

class UnknownMatch extends FreemodeArenaError {
    constructor() {
        super('Match introuvable, veuillez contacter un administrateur du serveur...');
    }
}

module.exports = UnknownMatch;
