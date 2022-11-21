const { EmbedBuilder } = require('discord.js');

class Embeds {
    static weaponsCategorySelection() {
        return new EmbedBuilder()
            .setTitle('Sélectionnez la catégorie de l\'arme que vous souhaitez ajouter/retirer')
            .setDescription('En choisissant une catégorie, nous vous présenterons l\'ensemble des armes de cette catégorie. Vous pourrez donc sélectionner/déselctionner les armes pour modifier votre sélection.')
            .setColor('#0099ff')
    }
}

module.exports = Embeds;
