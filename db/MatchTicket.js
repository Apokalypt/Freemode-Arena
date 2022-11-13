const mongoose = require('mongoose');
const Match = require('./Match');

const MatchTicketSchema = new mongoose.Schema(
    {
        platform: {
            required: true,
            type: String,
            default: null
        },
        player: {
            required: true,
            type: String,
            default: null
        }
    },
    {
        methods: {},
        query: {},
        statics: {
            /**
             * @param {string} platform
             * @param {string} player
             *
             * @returns {Promise<{ platform: string, player: string } | null>}
             */
            async findAvailableOpponent(platform, player) {
                /**
                 * @type {string[]}
                 */
                const playersAlreadyPlayed = await Match.findAllPlayerOpponents(player);
                playersAlreadyPlayed.push(player);

                return this.findOne({ platform, player: { $nin: playersAlreadyPlayed } });
            }
        }
    }
);

MatchTicketSchema.index({ platform: 1, player: 1 }, { unique: true });

const MatchTicket = mongoose.model('MatchTicket', MatchTicketSchema);

module.exports = MatchTicket;
