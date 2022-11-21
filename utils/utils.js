const { ActionRowBuilder } = require('discord.js');
const { Components } = require('../builder');
const { getWeaponId } = require('./weapons-utils');
const Embeds = require('../builder/Embeds');

/**
 *
 * @param {import('discord.js').Interaction} interaction
 * @param {string | import('discord.js').MessagePayload | import('discord.js').InteractionReplyOptions | import('discord.js').WebhookEditMessageOptions} options
 * @param {boolean} [forceFollowUp=false]   Force the response in a new message. In case that the interaction has been deferred
 *      or replied a follow-up will be sent instead of editing the original message
 */
async function sendInteractionResponse(interaction, options, forceFollowUp = false) {
    if (interaction.deferred || interaction.replied) {
        if (forceFollowUp) {
            // We edit the reply with the same content to reset all components states
            await interaction.editReply({
                content: interaction.message.content ?? '',
                embeds: interaction.message.embeds ?? [],
                components: interaction.message.components ?? []
            }).catch( console.error );

            return interaction.followUp(options);
        } else {
            return interaction.editReply({
                ...options,
                content: options.content || '',
                embeds: options.embeds || [],
                components: options.components || []
            })
                .then( res => {
                    interaction.replied = true;
                    return res
                })
                .catch( console.error );
        }
    } else {
        return interaction.reply(options)
            .then( res => {
                interaction.replied = true;
                return res
            })
            .catch( console.error );
    }
}

async function sendMainMenuSelectionResponse(interaction, weaponsSelected, matchId) {
    return sendInteractionResponse(
        interaction,
        {
            ephemeral: true,
            content: "**Sélectionnez stratégiquement vos armes car vous êtes limité !**\n" +
                "\n" +
                "<:info:1041766236759015454> Chaque arme coûte un certain nombre de points. La somme des points des armes sélectionnées ne doit pas dépasser 10 points\n" +
                "\n" +
                stringifyUserSelection(weaponsSelected),
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        Components.weaponsSelectionUpdateMenu(matchId)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        Components.weaponsSelectionValidateButton(matchId)
                    )
            ]
        }
    )
}

async function sendWeaponsCategoryMenuSelectionResponse(interaction, matchId) {
    return sendInteractionResponse(
        interaction,
        {
            ephemeral: true,
            embeds: [ Embeds.weaponsCategorySelection() ],
            components: [
                new ActionRowBuilder()
                    .addComponents( Components.weaponsCategorySelectionMenu(matchId) ),
                new ActionRowBuilder()
                    .addComponents( Components.backMainMenuSelectionButton(matchId) )
            ]
        }
    );
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

function validateWeaponsSelection(weaponsSelected) {
    const weapons = getWeapons();

    const userSelectionValue = weaponsSelected.map( weapon => weapons.find( w => getWeaponId(w) === weapon ) )
        .filter( weapon => !!weapon )
        .reduce((acc, weapon) => acc + weapon.value, 0);

    return userSelectionValue >= 0 && userSelectionValue <= exportData.MAX_USER_SELECTION;
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
        userSelectionString = '\n' + userSelection.map( weapon => `${"\u200b ".repeat(5)} <:dot:1041765493180211271> ${weapon.toString()}` ).join('\n')
    }

    const baseWeaponsString = final ? "Armes que vous devrez utiliser" : "Armes actuellement sélectionnées";

    return `:game_die: - Il vous reste **${exportData.MAX_USER_SELECTION-userSelectionValue} points**\n` +
        `:gun: - ${baseWeaponsString} :${userSelectionString}`
}

const exportData = {
    sendInteractionResponse,
    sendWeaponsCategoryMenuSelectionResponse,
    sendMainMenuSelectionResponse,
    stringifyUserSelection,
    validateWeaponsSelection,
    get MAX_USER_SELECTION() {
        return parseInt(process.env.FREEMODE_ARENA_WEAPONS_SELECTION_MAX)
    }
}

module.exports = exportData
