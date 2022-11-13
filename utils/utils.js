/**
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {string | import('discord.js').MessagePayload | import('discord.js').InteractionReplyOptions | import('discord.js').WebhookEditMessageOptions} options
 */
async function sendInteractionResponse(interaction, options) {
    if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ ...options, content: options.content || '', components: options.components || [] })
            .then( res => {
                interaction.replied = true;
                return res
            })
            .catch(console.error);
    } else {
        return interaction.reply(options)
            .then( res => {
                interaction.replied = true;
                return res
            })
            .catch(console.error);
    }
}

/**
 * @typedef CommandData
 *
 * @property {string} name
 * @property {string[]} aliases
 * @property {boolean} isSlashCommand
 * @property {(client: FreemodeClient, message: import('discord.js').Message, args: string[]) => any | Promise<any>} execute
 */

/**
 * @typedef FreemodeClient
 * @augments import('discord.js').Client
 *
 * @property {string} prefix
 * @property {CommandData[]} commands
 */

/**
 * @param {{ category: string; name: string }} weapon
 * @returns {string}
 */
function getWeaponId(weapon) {
    return `${weapon.category} - ${weapon.name}`;
}

function getWeapons() {
    const categories = require('./weapons');
    /**
     * @type {{ name: string; category: string; value: number; toString: () => string}[]}
     */
    const weapons = [];
    categories.forEach( category => {
        category.weapons.forEach( weapon => {
            const detailedWeapon = {
                name: weapon.name,
                value: weapon.value,
                category: category.name,
                toString: () => `[**${weapon.value} point(s)**] ${category.name} - ${weapon.name}`
            };

            weapons.push(detailedWeapon);
        });
    });

    return weapons;
}

function stringifyUserSelection(weaponsSelected, final = false) {
    const weapons = getWeapons();

    const userSelection = weaponsSelected.map( weapon => weapons.find( w => getWeaponId(w) === weapon ) )
        .filter( weapon => !!weapon );
    const userSelectionValue = userSelection.reduce( (acc, weapon) => acc + weapon.value, 0 );

    let userSelectionString;
    if (userSelection.length === 0) {
        userSelectionString = ' *Aucune arme sélectionnée*';
    } else {
        userSelectionString = '\n' + userSelection.map( weapon => `${"\u200b ".repeat(5)} :dot: ${weapon.toString()}` ).join('\n')
    }

    const baseWeaponsString = final ? "Armes que vous devrez utiliser" : "Armes actuellement sélectionnées";

    return `:game_die: - Il vous reste **${exportData.MAX_USER_SELECTION-userSelectionValue} points**\n` +
        `:gun: - ${baseWeaponsString} :${userSelectionString}`
}

const exportData = {
    sendInteractionResponse,
    getWeaponId,
    stringifyUserSelection,
    getWeapons,
    get MAX_USER_SELECTION() {
        return parseInt(process.env.FREEMODE_ARENA_WEAPONS_SELECTION_MAX)
    }
}

module.exports = exportData
