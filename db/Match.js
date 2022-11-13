const mongoose = require('mongoose');
const { getWeapons, getWeaponId, MAX_USER_SELECTION } = require('../utils/utils');

function validateWeaponsSelection(weaponsSelected) {
    const weapons = getWeapons();

    const userSelection = weaponsSelected.map( weapon => weapons.find( w => getWeaponId(w) === weapon ) )
        .filter( weapon => !!weapon );
    const userSelectionValue = userSelection.reduce( (acc, weapon) => acc + weapon.value, 0 );

    return userSelectionValue >= 0 && userSelectionValue <= MAX_USER_SELECTION;
}

const MatchSchema = new mongoose.Schema(
    {
        thread: {
            required: true,
            type: String,
            default: null
        },
        platform: {
            required: true,
            type: String,
            default: null
        },
        players: {
            '1' : {
                id: String,
                gameplay: {
                    kills: Number,
                    deaths: Number,
                    penalties: Number,
                    video: String
                },
                weapons: {
                    required: true,
                    type: [String],
                    default: [],
                    validate : validateWeaponsSelection
                },
                selectionDate: {
                    required: false,
                    type: Date,
                    default: null
                }
            },
            '2' : {
                id: String,
                gameplay: {
                    kills: Number,
                    deaths: Number,
                    penalties: Number,
                    video: String
                },
                weapons: {
                    required: true,
                    type: [String],
                    default: [],
                    validate : validateWeaponsSelection
                },
                selectionDate: {
                    required: false,
                    type: Date,
                    default: null
                }
            }
        },
        map: {
            name: String,
            img: String
        }
    },
    {
        methods: {},
        query: {},
        statics: {
            /**
             * @param {string} player
             *
             * @returns {Promise<string[]>}
             */
            async findAllPlayerOpponents(player) {
                return this.find({ $or: [{ 'players.1.id': player }, { 'players.2.id': player }] })
                    .exec()
                    .then( matches => {
                        return matches.map(match => {
                            return match.players['1'].id === player ? match.players['2'].id : match.players['1'].id;
                        })
                    });
            },

            async findLastMatchPlayer(playerId, mapName) {
                const filterPlayer1 = { 'players.1.id': playerId, 'players.1.selectionDate': { $ne: null } }
                const filterPlayer2 = { 'players.2.id': playerId, 'players.2.selectionDate': { $ne: null } }
                if (mapName) {
                    filterPlayer1['map.name'] = mapName;
                    filterPlayer2['map.name'] = mapName;
                }

                const matches = (await Promise.all([
                    Match.findOne(filterPlayer1).sort({ 'players.1.selectionDate': -1 }).exec(),
                    Match.findOne(filterPlayer2).sort({ 'players.2.selectionDate': -1 }).exec()
                ])).filter( m => m ).sort( (m1, m2) => {
                    const d1 = m1.players[m1.players['1'].id === playerId ? '1' : '2'].selectionDate;
                    const d2 = m2.players[m2.players['1'].id === playerId ? '1' : '2'].selectionDate;

                    return d1.getTime() - d2.getTime();
                });

                return matches.length > 0 ? matches[0] : null;
            }
        }
    }
);

const Match = mongoose.model('Match', MatchSchema);

module.exports = Match;
