const { ActionRowBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Components = require('./components');
const fs = require('fs');

class Message {
    /**
     * @param {import('discord.js').GuildBasedChannel & import('discord.js').TextBasedChannel} channel
     * @returns {Promise<void>}
     */
    static async sendAnnouncementMessage(channel) {
        const row = new ActionRowBuilder()
            .addComponents(
                Components.participateToConquest(),
                Components.documentFullDetailsButton()
            );

        const attachment = new AttachmentBuilder(fs.readFileSync('./assets/freemode_3.png'), { name: 'freemode_3.png'});

        return channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Freemode Arena - Saison 3')
                    .setDescription(
                        'Après une longue absence, **Freemode Arena** fait son grand retour sur **Glitch GTA France** !\n' +
                        '\n' +
                        '**Les récompenses**\n' +
                        "\u200b ".repeat(5) + '• Cartes cadeau Amazon pour le top 3\n' +
                        "\u200b ".repeat(5) + '• Rôle unique et obtenable qu\'avec une participation dans ce tournoi\n' +
                        "\u200b ".repeat(5) + '• Expérience (RP) sur le serveur\n' +
                        "\u200b ".repeat(5) + '• Une surprise pour un participant tiré au sort\n' +
                        "\u200b ".repeat(5) + '• ...\n' +
                        '\n' +
                        '**Conditions d\'accès**\n' +
                        "\u200b ".repeat(5) + '• Pouvoir enregistrer son gameplay (boitier d\'acquisitation, capture de jeu de votre console, ...)\n' +
                        "\u200b ".repeat(5) + '• Accepter que son gameplay soit diffusé sur la [chaîne de RedCrow](https://www.youtube.com/c/RedCrow)\n' +
                        "\u200b ".repeat(5) + '• Avoir une armurerie sur GTA Online - *Optionnel mais grandement conseillé*\n' +
                        "\u200b ".repeat(5) + '• Pseudonyme qui sera affiché sur les rediffusions\n' +
                        '\n' +
                        '[Plus d\'informations sur cet événement et son fonctionnement en cliquant ici](https://docs.google.com/document/d/1019sLQ8r9mBFjRWlYc3D9cECTFPzPJ39q27kqoRWGNs/edit?usp=sharing)'
                    )
                    .setImage(`attachment://${attachment.name}`)
                    .setColor('#ac683f')
            ],
            components: [row],
            files: [attachment]
        });
    }

    /**
     * @param {import('discord.js').GuildBasedChannel & import('discord.js').TextBasedChannel} channel
     * @returns {Promise<void>}
     */
    static async sendOrganizationMessage(channel) {
        const row = new ActionRowBuilder()
            .addComponents( Components.searchForOpponent() );

        const attachment = new AttachmentBuilder(fs.readFileSync('./assets/freemode_vs.jpg'), { name: 'freemode_vs.jpg'});

        return channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Trouver votre adversaire pour gagner des points')
                    .setDescription(
                        'Vous souhaitez gagner ? Faîtes un maximum de matchs contre les autres participants !\n' +
                        '\n' +
                        '\n' +
                        ':one: Clique sur le bouton "Je Cherche Un Adversaire"\n' +
                        '\n' +
                        ':two: Le bot cherche un adversaire sur la même plateforme que toi\n' +
                        '\n' +
                        ':three: Une fois qu\'un adversaire est trouvé, vous êtes ajoutés dans le même fil de discussion pour :\n' +
                        "\u200b ".repeat(5) + '• Sélectionner vos armes\n' +
                        "\u200b ".repeat(5) + '• Planifier votre match\n' +
                        "\u200b ".repeat(5) + '• Faire valider le résultat par le staff'
                    )
                    .setImage(`attachment://${attachment.name}`)
                    .setColor('#4fd3df')
            ],
            components: [row],
            files: [attachment]
        });
    }


}

module.exports = Message;
