const { ButtonBuilder, ButtonStyle, SelectMenuBuilder, SelectMenuOptionBuilder } = require('discord.js');
const ID = require('./id');
const { getWeaponId } = require('../utils/weapons-utils');

class Components {
    static requestToParticipateToConquest() {
        return new ButtonBuilder()
            .setCustomId( ID.requestToParticipateToConquest() )
            .setLabel('Je Participe!')
            .setStyle(ButtonStyle.Primary)
    }
    static confirmParticipationButton() {
        return new ButtonBuilder()
            .setCustomId( ID.confirmParticipationToConquest() )
            .setLabel('Oui, Je Souhaite Vraiment m\'Inscrire!')
            .setStyle(ButtonStyle.Primary)
    }

    static documentFullDetailsButton() {
        return new ButtonBuilder()
            .setLabel("Voir le détail du fonctionnement")
            .setURL('https://docs.google.com/document/d/1019sLQ8r9mBFjRWlYc3D9cECTFPzPJ39q27kqoRWGNs/edit?usp=sharing')
            .setStyle(ButtonStyle.Link)
    }

    static searchForOpponent() {
        return new ButtonBuilder()
            .setCustomId( ID.searchForOpponent() )
            .setLabel('Je Cherche Un Adversaire!')
            .setStyle(ButtonStyle.Primary)
    }

    static weaponsClassSelectionMenu(matchId) {
        return new SelectMenuBuilder()
            .setCustomId( ID.weaponsClassSelectionMenu(matchId) )
            .setPlaceholder('Cliquez ici pour choisir une classe')
            .addOptions(
                require('../utils/weapons-class.json')
                    .map( classData => {
                        return new SelectMenuOptionBuilder()
                            .setLabel(classData.name)
                            .setValue(classData.id.toString())
                            .setDescription(classData.description)
                    })
            )
    }

    static weaponsCategorySelectionMenu(matchId) {
        return new SelectMenuBuilder()
            .setCustomId( ID.weaponsFromCategorySelectionMenu(matchId) )
            .setPlaceholder('Cliquez ici pour choisir une catégorie')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                require('../utils/weapons.json')
                    .map( categoryData => {
                        return new SelectMenuOptionBuilder()
                            .setLabel(categoryData.name)
                            .setValue(categoryData.id.toString())
                    })
            )
    }

    static platformButton(platform) {
        return new ButtonBuilder()
            .setCustomId( `collector-${platform}` )
            .setLabel(platform)
            .setStyle(ButtonStyle.Primary)
    }

    /**
     * @typedef WeaponCategory
     *
     * @property {string} id
     * @property {string} name
     * @property {Weapon[]} weapons
     */

    /**
     * @typedef Weapon
     *
     * @property {string} name
     * @property {number} value
     */

    /**
     *
     * @param {string} matchId
     * @param {string[]} weaponsSelected
     * @param {WeaponCategory} category
     */
    static weaponsSelectionMenu(matchId, category, weaponsSelected) {
        return new SelectMenuBuilder()
            .setCustomId( ID.weaponsSelectionMenu(matchId, category.id) )
            .setPlaceholder('Cliquez ici pour modifier la sélection d\'armes dans la catégorie '+category.name)
            .setMinValues(0)
            .setMaxValues(category.weapons.length)
            .addOptions(
                category.weapons.map( weapon => {
                    const id = getWeaponId({ category: category.name, name: weapon.name });

                    return new SelectMenuOptionBuilder()
                        .setLabel(`[${weapon.value} point(s)] ${weapon.name}`)
                        .setValue(id)
                        .setDefault(weaponsSelected.includes(id))
                })
            )
    }

    /**
     * @param {string} matchId
     *
     * @returns {ButtonBuilder}
     */
    static weaponsButtonSelection(matchId) {
        return new ButtonBuilder()
            .setCustomId( ID.weaponsButtonSelection(matchId) )
            .setLabel('Je sélectionne mes armes!')
            .setStyle(ButtonStyle.Primary)
    }

    /**
     * @param {string} matchId
     *
     * @returns {ButtonBuilder}
     */
    static backMainMenuSelectionButton(matchId) {
        return new ButtonBuilder()
            .setCustomId( ID.weaponsButtonSelection(matchId) )
            .setLabel('Retour Menu Principal')
            .setStyle(ButtonStyle.Danger)
    }
    /**
     * @param {string} matchId
     *
     * @returns {ButtonBuilder}
     */
    static backWeaponCategorySelectionButton(matchId) {
        return new ButtonBuilder()
            .setCustomId( ID.weaponsCategorySelectionMenu(matchId) )
            .setLabel('Retour Sélection Catégorie d\'Armes')
            .setStyle(ButtonStyle.Danger)
    }

    /**
     * @param {string} matchId
     *
     * @returns {SelectMenuBuilder}
     */
    static weaponsSelectionUpdateMenu(matchId) {
        return new SelectMenuBuilder()
            .setCustomId( ID.weaponsSelectionUpdateMenu(matchId) )
            .setPlaceholder('Cliquez ici pour modifier votre sélection d\'armes...')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                new SelectMenuOptionBuilder()
                    .setLabel("Prendre la même configuration que votre dernière sélection")
                    .setValue( ID.optionPreviousSelection() )
                    .setDescription("Supprime votre sélection actuelle et prend exactement les mêmes armes que votre dernière sélection."),
                new SelectMenuOptionBuilder()
                    .setLabel("Prendre la même configuration que votre dernière sélection sur la même map")
                    .setValue( ID.optionPreviousSelectionForMap() )
                    .setDescription("Mets à jour votre sélection avec celle de votre dernière sélection sur la même map."),
                new SelectMenuOptionBuilder()
                    .setLabel("Prendre une classe prédéfinie")
                    .setValue( ID.optionPredefinedClassSelection() )
                    .setDescription("On vous propose des classes prédéfénies pour faire votre sélection d'armes ou simplement votre base"),
                new SelectMenuOptionBuilder()
                    .setLabel("Modifier manuellement votre sélection")
                    .setValue( ID.optionManualSelection() )
                    .setDescription("Sélectionner/déselectionner manuellement vos armes pour une sélection plus précise!"),
            )
    }

    static weaponsSelectionValidateButton(matchId) {
        return new ButtonBuilder()
            .setCustomId( ID.weaponsSelectionValidate(matchId) )
            .setLabel("Valider ma sélection")
            .setStyle(ButtonStyle.Success)
    }

    static weaponsSelectionValidateVerifiedButton(matchId) {
        return new ButtonBuilder()
            .setCustomId( ID.weaponsSelectionValidateVerified(matchId) )
            .setLabel("Je Confirme Cette Sélection")
            .setStyle(ButtonStyle.Success)
    }
    /**
     * @param {string} matchId
     *
     * @returns {ButtonBuilder}
     */
    static weaponsSelectionCancelValidationButton(matchId) {
        return new ButtonBuilder()
            .setCustomId( ID.weaponsButtonSelection(matchId) )
            .setLabel('Je Souhaite La Modifier')
            .setStyle(ButtonStyle.Danger)
    }

    static matchRulesButton(matchId) {
        return new ButtonBuilder()
            .setCustomId( ID.matchRulesButton(matchId) )
            .setLabel("Règles du match")
            .setStyle(ButtonStyle.Success)
    }
}


module.exports = Components;
