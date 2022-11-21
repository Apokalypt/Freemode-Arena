const { Events, ChannelType, EmbedBuilder, ActionRowBuilder, ComponentType, MessageFlagsBitField } = require('discord.js');
const { sendInteractionResponse, stringifyUserSelection, validateWeaponsSelection, sendMainMenuSelectionResponse, sendWeaponsCategoryMenuSelectionResponse } = require('../utils/utils');
const MatchTicket = require('../db/MatchTicket');
const Match = require('../db/Match');
const ID = require('../builder/id');
const { Components } = require('../builder');
const { UnknownMatch, UnknownInteraction, FreemodeArenaError, UnknownWeaponsClass, InvalidMatchParticipant,
    UnknownWeaponsCategory, UnknownUserPlatform, UserAlreadyWaitingForOpponent, WeaponsSelectionAlreadyValidated,
    NoPreviousSelectionValidated, UserAlreadyRegistered, NoWeaponsSelected
} = require('../errors');
const MaxValueForWeaponsReached = require('../errors/MaxValueForWeaponsReached');
const { Error } = require('mongoose');
const Participant = require('../db/Participant');
const Embeds = require('../builder/Embeds');

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').SelectMenuInteraction<'cached'>} interaction
 *
 * @returns {Promise<void>}
 */
async function handleInteractionSelectMenu(client, interaction) {
    if (interaction.customId.startsWith("weapons-action-menu-")) {
        const matchId = interaction.customId.replace("weapons-action-menu-", "");
        const match = await Match.findById(matchId).exec();
        if (!match) {
            throw new UnknownMatch();
        }

        switch (interaction.values[0]) {
            case ID.optionPreviousSelection():
                const lastMatch = await Match.findLastMatchPlayer(interaction.user.id);
                if (!lastMatch) {
                    throw new NoPreviousSelectionValidated();
                }

                const lastSelection = lastMatch.players[lastMatch.players['1'].id === interaction.user.id ? '1' : '2'].weapons;

                // Update user match selection with the list of weapons of the selected class
                const resUpdate = await Promise.all([
                    Match.updateOne(
                        { _id: matchId, 'players.1.id': interaction.user.id, 'players.1.selectionDate': null },
                        { $set: { 'players.1.weapons': lastSelection } }
                    ).exec(),
                    Match.updateOne(
                        { _id: matchId, 'players.2.id': interaction.user.id, 'players.2.selectionDate': null },
                        { $set: { 'players.2.weapons': lastSelection } }
                    ).exec()
                ]);
                if (resUpdate.every( r => r.matchedCount === 0 )) {
                    throw new InvalidMatchParticipant();
                }

                await sendInteractionResponse(
                    interaction,
                    {
                        ephemeral: true,
                        content: "Votre sélection a été mise à jour et correspond dorénavant à votre dernière sélection validée.\n\n" +
                            stringifyUserSelection(lastSelection),
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    Components.backMainMenuSelectionButton(matchId)
                                )
                        ]
                    }
                )
                break;
            case ID.optionPreviousSelectionForMap():
                const lastMatchSameMap = await Match.findLastMatchPlayer(interaction.user.id, match.map.name);
                if (!lastMatchSameMap) {
                    throw new NoPreviousSelectionValidated();
                }
                const lastSelectionSameMap = lastMatchSameMap.players[lastMatchSameMap.players['1'].id === interaction.user.id ? '1' : '2'].weapons;

                // Update user match selection with the list of weapons of the selected class
                const res = await Promise.all([
                    Match.updateOne(
                        { _id: matchId, 'players.1.id': interaction.user.id, 'players.1.selectionDate': null },
                        { $set: { 'players.1.weapons': lastSelectionSameMap } }
                    ).exec(),
                    Match.updateOne(
                        { _id: matchId, 'players.2.id': interaction.user.id, 'players.2.selectionDate': null },
                        { $set: { 'players.2.weapons': lastSelectionSameMap } }
                    ).exec()
                ]);
                if (res.every( r => r.matchedCount === 0 )) {
                    throw new InvalidMatchParticipant();
                }

                await sendInteractionResponse(
                    interaction,
                    {
                        ephemeral: true,
                        content: "Votre sélection a été mise à jour et correspond dorénavant à votre dernière sélection validée sur la même map.\n\n" +
                            stringifyUserSelection(lastSelectionSameMap),
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    Components.backMainMenuSelectionButton(matchId)
                                )
                        ]
                    }
                )
                break;
            case ID.optionPredefinedClassSelection():
                // Send a select menu to select the pre-defined weapons class

                await sendInteractionResponse(
                    interaction,
                    {
                        ephemeral: true,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Choisissez votre classe')
                                .setDescription(
                                    '<a:warning:1022529561805721631> En choisissant une classe, vous écrasez votre sélection actuelle.\n' +
                                    '<:info:1041766236759015454> Si vous le souhaitez, vous pourrez customiser la sélection en ajoutant/supprimant des armes.')
                                .setColor('#0099ff')
                        ],
                        components: [
                            new ActionRowBuilder()
                                .addComponents( Components.weaponsClassSelectionMenu(matchId) ),
                            new ActionRowBuilder()
                                .addComponents( Components.backMainMenuSelectionButton(matchId) )
                        ]
                    }
                )
                break;
            case ID.optionManualSelection():
                // Show a menu to select the category of weapons

                await sendWeaponsCategoryMenuSelectionResponse(interaction, matchId);

                break;
        }
    } else if (interaction.customId.startsWith("weapons-class-menu-")) {
        const matchId = interaction.customId.replace("weapons-class-menu-", "");

        const classId = interaction.values[0];
        const classData = require('../utils/weapons-class.json').find( classData => classData.id === parseInt(classId) );
        if (!classData) {
            throw new UnknownWeaponsClass();
        }

        // Update user match selection with the list of weapons of the selected class
        const res = await Promise.all([
            Match.updateOne(
                { _id: matchId, 'players.1.id': interaction.user.id, 'players.1.selectionDate': null },
                { $set: { 'players.1.weapons': classData.weapons } }
            ).exec(),
            Match.updateOne(
                { _id: matchId, 'players.2.id': interaction.user.id, 'players.2.selectionDate': null },
                { $set: { 'players.2.weapons': classData.weapons } }
            ).exec()
        ]);
        if (res.every( r => r.matchedCount === 0 )) {
            throw new InvalidMatchParticipant();
        }

        await sendMainMenuSelectionResponse(interaction, classData.weapons, matchId);
    } else if (interaction.customId.startsWith("weapons-category-menu-")) {
        const matchId = interaction.customId.replace("weapons-category-menu-", "");
        const match = await Match.findById(matchId).exec();
        if (!match) {
            throw new UnknownMatch();
        }

        const player = match.players[match.players['1'].id === interaction.user.id ? '1' : '2'];
        const categoryId = interaction.values[0];

        const categoryData = require('../utils/weapons.json').find( categoryData => categoryData.id === parseInt(categoryId) );
        if (!categoryData) {
            throw new UnknownWeaponsCategory();
        }

        await sendInteractionResponse(
            interaction,
            {
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Sélectionnez les armes que vous souhaitez ajouter/retirer')
                        .setDescription(
                            'Une arme cochée est une arme sélectionnée. Votre sélection peut être modifiée jusqu\'à ce que vous la validiez.\n\n' +
                            "\u200b ".repeat(4) + 'Si une arme est cochée et que vous souhaitez la retirer, cliquez dessus.\n' +
                            "\u200b ".repeat(4) + 'Si une arme n\'est pas cochée et que vous souhaitez l\'ajouter, cliquez dessus.\n\n' +
                            '*Une fois que vous avez fini de modifier la sélection pour cette catégorie, cliquez n\'importe où à côté de la liste pour sauvegarder votre sélection*.'
                        )
                        .setColor('#0099ff')
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            Components.weaponsSelectionMenu(matchId, categoryData, player.weapons)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            Components.backWeaponCategorySelectionButton(matchId),
                            Components.backMainMenuSelectionButton(matchId)
                        )
                ]
            });
    } else if (interaction.customId.startsWith("weapons-selection-menu-")) {
        const [categoryId, matchId] = interaction.customId.replace("weapons-selection-menu-", "").split('-');

        const categoryName = require('../utils/weapons.json').find( categoryData => categoryData.id === parseInt(categoryId) )?.name;
        if (!categoryName) {
            throw new UnknownWeaponsCategory();
        }

        const match = await Match.findById(matchId).exec();
        if (!match) {
            throw new UnknownMatch();
        }

        const playerNum = match.players['1'].id === interaction.user.id ? '1' : '2';
        const player = match.players[playerNum];
        player.weapons = player.weapons.filter( w => w.split('-')[0].trim() !== categoryName );
        player.weapons.push(...interaction.values);

        await match.save()
            .then( () => {
                return sendInteractionResponse(
                    interaction,
                    {
                        ephemeral: true,
                        content: stringifyUserSelection(player.weapons),
                        embeds: [ Embeds.weaponsCategorySelection() ],
                        components: [
                            new ActionRowBuilder()
                                .addComponents( Components.weaponsCategorySelectionMenu(matchId) ),
                            new ActionRowBuilder()
                                .addComponents( Components.backMainMenuSelectionButton(matchId) )
                        ]
                    }
                )
            })
            .catch( err => {
                if (err instanceof Error.ValidationError && Object.keys(err.errors).includes(`players.${playerNum}.weapons`)) {
                    throw new MaxValueForWeaponsReached();
                }

                throw err;
            });
    }
}

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').ButtonInteraction<'cached'>} interaction
 */
async function handleInteractionButton(client, interaction) {
    switch (interaction.customId) {
        case ID.participateToConquest():
            // Give the role participant to the user
            await interaction.member.roles.add(process.env.FREEMODE_PARTICIPANT_ROLE_ID);

            // Create private thread
            const threadType = interaction.guild.features.includes("PRIVATE_THREADS") ? ChannelType.PrivateThread : ChannelType.PublicThread;
            const thread = await interaction.channel.threads.create({
                type: threadType,
                invitable: false,
                name: `${interaction.user.username} ${interaction.user.discriminator} - Profile`
            });

            await Participant.create({ id: interaction.user.id, thread: thread.id })
                .catch( async err => {
                    await thread.delete().catch( () => {} );

                    if (err.code === 11000) {
                        throw new UserAlreadyRegistered();
                    } else {
                        throw err;
                    }
                });

            const indent = "\u200b ".repeat(4);
            const descriptionImportantChannel = ":fleur_de_lis: **Les salons importants**\n" +
                `${indent}• **${thread}** : Discutez en privé avec les modérateurs et vérifiez que tout est prêt pour votre participation.\n` +
                `${indent}• **<#${process.env.FREEMODE_CHANNEL_ORGANIZATION}>** : Trouvez des adversaires pour gagner des points et hissez-vous en haut du classement !\n` +
                `${indent}• **<#${process.env.FREEMODE_CHANNEL_FAQ}>** : Une question ? Trouvez la réponse en utilisant notre F.A.Q. sur cet événement !`;

            const messageContent = `Bienvenue ${interaction.user} !\n\n` +
                'Ce fil de discussion **privé** vous permet de **communiquer avec les organisateurs** de l\'événement **en cas de problème ou en cas de question.**\n' +
                '\n' +
                '\n' +
                `**Pour le bon fonctionnement, pouvez-vous nous fournir les éléments suivants :**\n` +
                "\u200b ".repeat(4) + '• Un pseudonyme\n' +
                "\u200b ".repeat(4) + '• Une validation que vous pouvez enregistrer votre gameplay\n' +
                "\u200b ".repeat(4) + '• *Optionnel* Votre pseudo sur le Socialclub (<https://socialclub.rockstargames.com/>)\n' +
                '\n' +
                descriptionImportantChannel;

            // Send a welcome message to add the user to the thread and all the organizers
            const message = await thread.send(messageContent);
            await message.edit(messageContent.replace('organisateurs', `<@&${process.env.FREEMODE_ARENA_ORGANIZERS_ROLE_ID}>`));
            await message.pin();

            await sendInteractionResponse(
                interaction,
                {
                    ephemeral: true,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Vous êtes inscrit à Freemode Arena 3')
                            .setDescription(descriptionImportantChannel)
                    ]
                }
            );

            break;
        case ID.searchForOpponent():
            // Determine the user's platform
            const platforms = Object.entries(require('../utils/platforms'))
                .filter(([, roles]) => roles.some( roleId => interaction.member.roles.cache.has(roleId) ))
                .map(([platformName, _roles]) => platformName);

            let platform;
            if (platforms.length === 1) {
                platform = platforms[0];
            } else if (platforms.length > 1) {
                platform = await new Promise( async resolve => {
                    const message = await sendInteractionResponse(
                        interaction,
                        {
                            ephemeral: true,
                            content: 'Sur quelle plateforme souhaitez-vous jouer ? (*Vous avez 60 secondes pour répondre*)',
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        ...platforms.map( platform => Components.platformButton(platform) )
                                    )
                            ]
                        }
                    )

                    const filter = i => {
                        i.deferUpdate();
                        return i.user.id === interaction.user.id;
                    };

                    message.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 60000 })
                        .then( interaction => {
                            resolve(interaction.customId.replace('collector-', ''));
                        })
                        .catch( async _ => {
                            await sendInteractionResponse(
                                interaction,
                                {
                                    ephemeral: true,
                                    content: 'Vous n\'avez pas répondu dans les temps, veuillez réessayer.'
                                }
                            ).catch( _ => { /* Ignore */ } );

                            resolve(null);
                        });
                });
            }
            if (!platform) {
                throw new UnknownUserPlatform();
            }

            // Search an available opponents
            const ticket = await MatchTicket.findAvailableOpponent(platform, interaction.user.id);
            if (!ticket) {
                await MatchTicket.create({ platform, player: interaction.user.id })
                    .then( () => {
                        return sendInteractionResponse(
                            interaction,
                            {
                                content: `Vous avez été ajouté à la liste d\'attente sur la plateforme ${platform}.\n` +
                                    'Vous serez notifié dès qu\'un adversaire sera disponible :thumbsup:',
                                ephemeral: true
                            }
                        );
                    })
                    .catch( err => {
                        // Duplicate key error
                        if (err.code === 11000) {
                            throw new UserAlreadyWaitingForOpponent(platform);
                        }

                        throw err;
                    });
            } else {
                const opponent = await client.users.fetch(ticket.player);
                await ticket.delete();

                const count = await MatchTicket.countDocuments({ });

                // Start a match
                const threadType = interaction.guild.features.includes("PRIVATE_THREADS") ? ChannelType.PrivateThread : ChannelType.PublicThread;
                const thread = await interaction.channel.threads.create({
                    type: threadType,
                    invitable: false,
                    name: `${interaction.user.username} ${interaction.user.discriminator} vs ${opponent.username} ${opponent.discriminator} - ${String(count).padStart(4,'0')}`
                });

                // Randomly choose the map
                const maps = require('../utils/maps');
                const map = maps[Math.floor(Math.random() * maps.length)];

                const match = await Match.create({
                    thread: thread.id,
                    platform,
                    players: {
                        '1' : {
                            id: interaction.user.id
                        },
                        '2' : {
                            id: opponent.id
                        }
                    },
                    map
                });

                const indent = '\u200b '.repeat(4);
                const message = await thread.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(map.name)
                            .setDescription(
                                "Votre duel devra se réaliser sur cette carte/zone !\n\n" +
                                "Pour rappel, voici les étapes à réaliser :\n" +
                                indent + "1. Chaque joueur sélectionne ses armes\n" +
                                indent + "2. Une fois ceci fait, le bot envoie un message avec les armes des deux joueurs\n" +
                                indent + "3. Les joueurs doivent se mettre d'accord sur une date\n" +
                                indent + "4. Les joueurs font leur match en enregistrant leur gameplay\n" +
                                indent + "5. Les joueurs envoient leur gameplay dans ce fil de discussion ou en privé à l'un des organisateurs\n" +
                                indent + "6. Les organisateurs vérifient les matchs et saisissent les points des joueurs"
                            )
                            .setImage(map.img)
                    ],
                    components: [
                        new ActionRowBuilder()
                            .addComponents( Components.weaponsButtonSelection(match._id.toString()) )
                    ]
                });
                const messageContent = `Le duel entre ${interaction.user} et ${opponent} est presque prêt! **Merci de sélectionner vos armes en cliquant sur le bouton ci-dessus :arrow_heading_up:**\n\n` +
                    `*En cas de questions ou de problèmes, vous pouvez contacter les organisateurs en privé ou en les mentionnant ici.*`
                const reply = await message.reply(messageContent);
                await reply.edit(messageContent.replace('organisateurs', `<@&${process.env.FREEMODE_ARENA_ORGANIZERS_ROLE_ID}>`));

                await sendInteractionResponse(
                    interaction,
                    {
                        content: "Nous vous avons trouvé un adversaire!\n" +
                            `**Rendez-vous dans votre fil de discussion ( <#${thread.id}> ) pour découvrir le détail du match et pour convenir d'une date avec votre adversaire.**`,
                        ephemeral: true
                    }
                );
            }
            break;
        default:
            if (interaction.customId.startsWith('rules-')) {
                const matchId = interaction.customId.split('-')[1];
                const match = await Match.findById(matchId).exec();
                if (!match) {
                    throw new UnknownMatch();
                }

                await sendInteractionResponse(
                    interaction,
                    {
                        ephemeral: true,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(':one: Respectez vos adversaires')
                                .setDescription(
                                    'Que vous soyez gagnant ou perdant, gardez l\'âme d\'un guerrier et respectez votre adversaire.'
                                ),
                            new EmbedBuilder()
                                .setTitle(':two: Affrontez-vous dans la zone indiquée')
                                .setDescription(
                                    `Au début de ce fil de discussion, une zone a été tirée au hasard : **${match.map.name}**.` +
                                    'Votre affrontement devra se dérouler là-bas et ne jamais en sortir'
                                ),
                            new EmbedBuilder()
                                .setTitle(':three: 15 minutes de duel')
                                .setDescription(
                                    'L\'affrontement devra durer 15 minutes.\n' +
                                    'Lors de la vérification à l\'aide de votre gameplay, nous prendrons en compte ' +
                                    'seulement l\'affrontement sur une durée de 15 minutes après le début.'
                                ),
                            new EmbedBuilder()
                                .setTitle(':four: Armes autorisées : votre sélection uniquement')
                                .setDescription(
                                    'Vous avez dû faire une sélection d\'arme pour faire ce match. Respectez ' +
                                    'complètement cette sélection sous peine d\'invalidation de vos kills.\n' +
                                    'Si vous avez une armurerie dans GTA, mettez les armes ne faisant pas partie de ' +
                                    'votre sélection dans celle-ci pour éviter de se tromper au cours du match !'
                                ),
                            new EmbedBuilder()
                                .setTitle(':five: Enregistrez votre match')
                                .setDescription(
                                    'Pensez à enregistrer TOUT votre gameplay à l\'aide d\'un boîtier d\'acquisition ou ' +
                                    'de la fonctionnalité de votre console.\n' +
                                    'Une fois le match terminé, chacun des joueurs doit envoyer son gameplay. Sans enregistrement, le match sera considéré comme inexistant !'
                                ),
                            new EmbedBuilder()
                                .setTitle(':six: Visée assistée BANNIE')
                                .setDescription(
                                    'L\'ensemble des affrontements doit se faire sans visée assistée, c\'est à dire en **visée auto**.\n' +
                                    'Pour changer/vérifier votre mode de visée, rendez-vous en mode histoire ou éditeur, ouvrez start, paramètres, ' +
                                    'cliquez sur "Commandes" et assurez-vous que la visée est sur **visée auto**.'
                                )
                        ]
                    }
                )

                break;
            } else if (interaction.customId.startsWith('weapons-select-category-menu-')) {
                const matchId = interaction.customId.split('-')[4];
                const match = await Match.findById(matchId).exec();
                if (!match) {
                    throw new UnknownMatch();
                }
                if (match.players['1'].id !== interaction.user.id && match.players['2'].id !== interaction.user.id) {
                    throw new InvalidMatchParticipant();
                }

                await sendWeaponsCategoryMenuSelectionResponse(interaction, matchId);

                break;
            } else if (interaction.customId.startsWith('weapons-validate-selection-verified-')) {
                const matchId = interaction.customId.split('-')[4];
                const match = await Match.findById(matchId).exec();
                if (!match) {
                    throw new UnknownMatch();
                }
                if (match.players['1'].id !== interaction.user.id && match.players['2'].id !== interaction.user.id) {
                    throw new InvalidMatchParticipant();
                }

                const playerId = match.players['1'].id === interaction.user.id ? '1' : '2';
                const player = match.players[playerId];
                if (player.selectionDate != null) {
                    throw new WeaponsSelectionAlreadyValidated();
                }

                if (player.weapons.length === 0) {
                    throw new NoWeaponsSelected();
                }
                const categoriesName = new Set(player.weapons.map( fullName => fullName.split('-')[0].trim() ));
                if (categoriesName.size === 1 && categoriesName.has('Bonus')) {
                    throw new NoWeaponsSelected();
                }

                if (!validateWeaponsSelection(player.weapons)) {
                    throw new MaxValueForWeaponsReached();
                }

                player.selectionDate = new Date();

                const res = await Match.updateOne(
                    { _id: matchId, [`players.${playerId}.selectionDate`]: null },
                    { [`players.${playerId}.selectionDate`]: new Date() }
                ).exec();
                if (res.matchedCount === 0) {
                    throw new WeaponsSelectionAlreadyValidated();
                }

                await sendInteractionResponse(
                    interaction,
                    {
                        ephemeral: true,
                        content: "Vous venez de valider votre sélection, vous ne pouvez plus la changer !\n\n" +
                            stringifyUserSelection(player.weapons, true),
                    }
                );

                if (match.players['1'].selectionDate != null && match.players['2'].selectionDate != null) {
                    const user1 = await interaction.client.users.fetch(match.players['1'].id);
                    const user2 = await interaction.client.users.fetch(match.players['2'].id);

                    await interaction.channel.send({
                        content: `**Les joueurs ${user1} et ${user2} ont, tout deux, validé leurs armes !**\n\n` +
                            `**${user1}**\n` +
                            stringifyUserSelection(match.players['1'].weapons, true) + "\n" +
                            "\n" +
                            `**${user2}**\n` +
                            stringifyUserSelection(match.players['2'].weapons, true),
                        allowedMentions: { parse: [] }
                    });

                    const message = await interaction.channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Le match peut commencer !')
                                .setDescription(
                                    "1. Convenez d'une date pour réaliser votre match !\n" +
                                    "2. Jouez le match en respectant les règles. Pensez à enregistrer votre gameplay !\n" +
                                    "3. Envoyez votre gameplay dans ce fil de discussion ou en privé à l'un des organisateurs"
                                )
                                .addFields(
                                    {
                                        name: `Armes de ${user1.username}#${user1.discriminator}`,
                                        value: match.players['1'].weapons
                                            .map( weapon => `${"\u200b ".repeat(3)} <:dot:1041765493180211271> ${weapon.toString()}` ).join('\n')
                                    },
                                    {
                                        name: `Armes de ${user2.username}#${user2.discriminator}`,
                                        value: match.players['2'].weapons
                                            .map( weapon => `${"\u200b ".repeat(3)} <:dot:1041765493180211271> ${weapon.toString()}` ).join('\n')
                                    }
                                )
                                .setImage(match.map.img)
                                .setFooter({ text: `Carte : ${match.map.name}` })
                        ],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    Components.matchRulesButton(match._id.toString())
                                )
                        ]
                    });
                    await message.pin();
                }

                break;
            } else if (interaction.customId.startsWith('weapons-validate-selection-')) {
                const matchId = interaction.customId.split('-')[3];
                const match = await Match.findById(matchId).exec();
                if (!match) {
                    throw new UnknownMatch();
                }
                if (match.players['1'].id !== interaction.user.id && match.players['2'].id !== interaction.user.id) {
                    throw new InvalidMatchParticipant();
                }

                const playerId = match.players['1'].id === interaction.user.id ? '1' : '2';
                const player = match.players[playerId];
                if (player.selectionDate != null) {
                    throw new WeaponsSelectionAlreadyValidated();
                }

                if (player.weapons.length === 0) {
                    throw new NoWeaponsSelected();
                }
                const categoriesName = new Set(player.weapons.map( fullName => fullName.split('-')[0].trim() ));
                if (categoriesName.size === 1 && categoriesName.has('Bonus')) {
                    throw new NoWeaponsSelected();
                }

                if (!validateWeaponsSelection(player.weapons)) {
                    throw new MaxValueForWeaponsReached();
                }

                await sendInteractionResponse(
                    interaction,
                    {
                        ephemeral: true,
                        content: stringifyUserSelection(player.weapons) + "\n\n" +
                            "<a:warning:1022529561805721631> **Une fois validée, votre sélection ne pourra plus être modifiée. Vérifiez-là bien !**",
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    Components.weaponsSelectionCancelValidationButton(matchId),
                                    Components.weaponsSelectionValidateVerifiedButton(matchId)
                                )
                        ]
                    }
                )

                break;
            } else if (interaction.customId.startsWith('weapons-')) {
                const matchId = interaction.customId.split('-')[1];
                const match = await Match.findById(matchId);
                if (!match || (match.players['1'].id !== interaction.user.id && match.players['2'].id !== interaction.user.id)) {
                    throw new InvalidMatchParticipant();
                }

                const userData = match.players[match.players['1'].id === interaction.user.id ? '1' : '2']
                if (userData.selectionDate != null) {
                    throw new WeaponsSelectionAlreadyValidated();
                }

                await sendMainMenuSelectionResponse(interaction, userData.weapons, matchId);

                break;
            }

            throw new UnknownInteraction();
    }
}


module.exports = {
    name: Events.InteractionCreate,
    once: false,
    /**
     * @param {import('discord.js').Interaction} interaction
     * @param {import('discord.js').Client<true>} client
     */
    async execute(client, interaction) {
        if (!interaction.inCachedGuild()) return;
        if (interaction.customId.startsWith('collector-')) return;

        const shouldDeferUpdate = interaction.message.flags.has(MessageFlagsBitField.Flags.Ephemeral)
        try {
            if (shouldDeferUpdate) {
                await interaction.deferUpdate();
            } else {
                await interaction.deferReply({ ephemeral: true });
            }

            if (interaction.isButton()) {
                await handleInteractionButton(client, interaction);
            } else if (interaction.isCommand()) {
                // TODO
            } else if (interaction.isSelectMenu()) {
                await handleInteractionSelectMenu(client, interaction);
            }
        } catch (e) {
            let message
            if (e instanceof FreemodeArenaError) {
                message = e.message
            } else {
                console.error(e);

                message = 'Une erreur est survenue, veuillez contacter <@305940554221355008>.'
            }

            await sendInteractionResponse(
                interaction,
                { embeds: [ new EmbedBuilder().setDescription(message).setColor('#FF0000') ], ephemeral: true },
                shouldDeferUpdate
            );
        }
    }
}
