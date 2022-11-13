const FreemodeArenaError = require('./FreemodeArenaError');

class UserAlreadyRegistered extends FreemodeArenaError {
    constructor() {
        super('Vous semblez être déjà inscrit à Freemode Arena. Si ce n\'est pas le cas, contactez un administrateur.');
    }
}

module.exports = UserAlreadyRegistered;
