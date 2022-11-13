const FreemodeArenaError = require('./FreemodeArenaError');

class UnknownInteraction extends FreemodeArenaError {
    constructor() {
        super('Oups, vous ne devriez pas pouvoir accéder à cela... Veuillez contacter un administrateur du serveur.');
    }
}

module.exports = UnknownInteraction;
