const FreemodeArenaError = require('./FreemodeArenaError');

class RegistrationClosed extends FreemodeArenaError {
    constructor() {
        super('Les inscriptions sont dorénavant closes après 1 mois de combats acharnés.');
    }
}

module.exports = RegistrationClosed;
