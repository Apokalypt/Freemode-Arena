const FreemodeArenaError = require('./FreemodeArenaError');

const UnknownMatch = require('./UnknownMatch');
const UnknownInteraction = require('./UnknownInteraction');
const UnknownWeaponsClass = require('./UnknownWeaponsClass');
const UnknownWeaponsCategory = require('./UnknownWeaponsCategory');
const UnknownUserPlatform = require('./UnknownUserPlatform');

const InvalidMatchParticipant = require('./InvalidMatchParticipant');

const MaxValueForWeaponsReached = require('./MaxValueForWeaponsReached');
const UserAlreadyWaitingForOpponent = require('./UserAlreadyWaitingForOpponent');
const WeaponsSelectionAlreadyValidated = require('./WeaponsSelectionAlreadyValidated');
const NoPreviousSelectionValidated = require('./NoPreviousSelectionValidated');
const NoWeaponsSelected = require('./NoWeaponsSelected');
const UserAlreadyRegistered = require('./UserAlreadyRegistered');


module.exports = {
    FreemodeArenaError,
    UnknownMatch,
    UnknownInteraction,
    UnknownWeaponsClass,
    UnknownWeaponsCategory,
    UnknownUserPlatform,
    InvalidMatchParticipant,
    MaxValueForWeaponsReached,
    UserAlreadyWaitingForOpponent,
    WeaponsSelectionAlreadyValidated,
    NoPreviousSelectionValidated,
    NoWeaponsSelected,
    UserAlreadyRegistered
}
