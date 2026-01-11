import { AutocompleteInteraction, ButtonStyle, ComponentType, LocalizationMap } from "discord.js";
import { SlashCommand } from "@models/command/SlashCommand";
import { ParticipantModel } from "@models/championship/Participant";
import { UserCommandOption } from "@models/command/options/valuable/UserCommandOption";
import { StringCommandOption } from "@models/command/options/valuable/StringCommandOption";
import { IntegerCommandOption } from "@models/command/options/valuable/IntegerCommandOption";
import { SubSlashCommandOption } from "@models/command/options/executable/SubSlashCommandOption";
import { SubSlashCommandGroupOption } from "@models/command/options/executable/SubSlashCommandGroupOption";
import { AdminRegisterForChampionshipAction } from "../../actions/AdminRegisterForChampionshipAction";
import { MatchService } from "@services/MatchService";
import { MatchmakingService } from "@services/MatchmakingService";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { UnknownPlayerException } from "@exceptions/championship/UnknownPlayerException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { UnauthorizedActionException } from "@exceptions/actions/UnauthorizedActionException";
import { Platforms, PLATFORMS_VALUES } from "@enums";
import { EMOJI_GREEN_CHECK, EMOJI_RED_CROSS, SUPPORT_ROLE_ID } from "@constants";


/** ========================================================================
 *  ==                            SUB-COMMAND                             ==
 *  ==                           match  status                            ==
 *  ========================================================================
 */
const matchStatusSubCommandName = "status" as const;
const matchStatusSubCommandNameLocalized: LocalizationMap = {
    fr: "statut"
};

const matchStatusSubCommandDescription = "Return the status of the match linked to the channel";
const matchStatusSubCommandDescriptionLocalized: LocalizationMap = {
    fr: "Renvoie le statut du match lié au salon"
};

const matchStatusSubCommand = new SubSlashCommandOption(
    matchStatusSubCommandName, matchStatusSubCommandNameLocalized,
    matchStatusSubCommandDescription, matchStatusSubCommandDescriptionLocalized,
    {},
    async function (_client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new Error("The guild is not cached");
        }

        const admin = interaction.member;
        if (!admin?.roles.cache.has(SUPPORT_ROLE_ID)) {
            throw new UnauthorizedActionException();
        }

        const match = await MatchService.instance.getMatchFromDiscordChannel(interaction.guildId, interaction.channelId);
        if (!match) {
            throw new UnknownMatchException();
        }

        await interaction.reply({
            ephemeral: true,
            content: "## Sélections des armes\n" +
                `### - <@${match.players[0].participantId}>  •  ${match.players[0].weapons.stringifyStatus()}\n` +
                `${match.players[0].weapons.stringifySelection()}` +
                `### - <@${match.players[1].participantId}>  •  ${match.players[1].weapons.stringifyStatus()}\n` +
                `${match.players[1].weapons.stringifySelection()}\n`,
            allowedMentions: {parse: []}
        });
    }
);

/** ========================================================================
 *  ==                            SUB-COMMAND                             ==
 *  ==                            match   add                             ==
 *  ========================================================================
 */
const matchAddSubCommandName = "add" as const;
const matchAddSubCommandNameLocalized: LocalizationMap = {
    fr: "ajouter"
};

const matchAddSubCommandDescription = "Add a match to the championship";
const matchAddSubCommandDescriptionLocalized: LocalizationMap = {
    fr: "Ajouter un match au championnat"
};

const matchAddOptionFirstUserName = "player-1" as const;
const matchAddOptionFirstUserNameLocalized: LocalizationMap = {
    fr: "joueur-1"
};
const matchAddOptionFirstUserDescription = "The first user in the match";
const matchAddOptionFirstUserDescriptionLocalized: LocalizationMap = {
    fr: "Le 1er joueur du match"
};
const matchAddOptionFirstUser = new StringCommandOption(
    matchAddOptionFirstUserName, matchAddOptionFirstUserNameLocalized,
    matchAddOptionFirstUserDescription, matchAddOptionFirstUserDescriptionLocalized,
    true,
    undefined, undefined,
    async (_client, interaction) => {
        return _autocompleteParticipantByPlatform(interaction, matchAddOptionPlatform.name, matchAddOptionSecondUser.name);
    }
);

const matchAddOptionSecondUserName = "player-2" as const;
const matchAddOptionSecondUserNameLocalized: LocalizationMap = {
    fr: "joueur-2"
};
const matchAddOptionSecondUserDescription = "The Second user in the match";
const matchAddOptionSecondUserDescriptionLocalized: LocalizationMap = {
    fr: "Le 2nd joueur du match"
};
const matchAddOptionSecondUser = new StringCommandOption(
    matchAddOptionSecondUserName, matchAddOptionSecondUserNameLocalized,
    matchAddOptionSecondUserDescription, matchAddOptionSecondUserDescriptionLocalized,
    true,
    undefined, undefined,
    async (_client, interaction) => {
        return _autocompleteParticipantByPlatform(interaction, matchAddOptionPlatform.name, matchAddOptionFirstUser.name);
    }
);

const matchAddOptionMatchPhaseName = "phase" as const;
const matchAddOptionMatchPhaseNameLocalized: LocalizationMap = {
    fr: "phase"
};
const matchAddOptionMatchPhaseDescription = "The phase of the match (quarter, semi, final)";
const matchAddOptionMatchPhaseDescriptionLocalized: LocalizationMap = {
    fr: "La phase du match (quart, demi, finale)"
};
const matchAddOptionMatchPhase = new StringCommandOption(
    matchAddOptionMatchPhaseName, matchAddOptionMatchPhaseNameLocalized,
    matchAddOptionMatchPhaseDescription, matchAddOptionMatchPhaseDescriptionLocalized,
    true,
    undefined, undefined,
    [
        {name: "Winner Round 1/2", value: "Winner Round 1/2"},
        {name: "Winner Round 2/2", value: "Winner Round 2/2"},
        {name: "Finale Winner", value: "Finale Winner"},
        {name: "Last Chance 1/2", value: "Last Chance 1/2"},
        {name: "Last Chance 2/2", value: "Last Chance 2/2"},
        {name: "Finale Last Chance", value: "Finale Last Chance"},
        {name: "Finale", value: "Finale"}
    ]
);

const matchAddOptionPlatformName = "platform" as const;
const matchAddOptionPlatformNameLocalized: LocalizationMap = {
    fr: "plateforme"
};
const matchAddOptionPlatformDescription = "The platform on which the match will be played";
const matchAddOptionPlatformDescriptionLocalized: LocalizationMap = {
    fr: "La plateforme sur laquelle le match sera joué"
};
const matchAddOptionPlatform = new StringCommandOption(
    matchAddOptionPlatformName, matchAddOptionPlatformNameLocalized,
    matchAddOptionPlatformDescription, matchAddOptionPlatformDescriptionLocalized,
    false,
    undefined, undefined,
    PLATFORMS_VALUES.map(platform => ({name: platform, value: platform}))
);

const matchAddSubCommand = new SubSlashCommandOption(
    matchAddSubCommandName, matchAddSubCommandNameLocalized,
    matchAddSubCommandDescription, matchAddSubCommandDescriptionLocalized,
    {
        [matchAddOptionFirstUser.name]: matchAddOptionFirstUser,
        [matchAddOptionSecondUser.name]: matchAddOptionSecondUser,
        [matchAddOptionMatchPhase.name]: matchAddOptionMatchPhase,
        [matchAddOptionPlatform.name]: matchAddOptionPlatform
    },
    async function (_client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new Error("The guild is not cached");
        }

        await interaction.deferReply({ ephemeral: true });

        const admin = interaction.member;
        if (!admin?.roles.cache.has(SUPPORT_ROLE_ID)) {
            throw new UnauthorizedActionException();
        }

        const firstPlayerOptionValue = interaction.options.getString(matchAddOptionFirstUser.name, true);
        const secondPlayerOptionValue = interaction.options.getString(matchAddOptionSecondUser.name, true);

        const firstParticipant = await ParticipantModel.findById(firstPlayerOptionValue);
        if (!firstParticipant) {
            throw new UnknownPlayerException(firstPlayerOptionValue);
        }
        const secondParticipant = await ParticipantModel.findById(secondPlayerOptionValue);
        if (!secondParticipant) {
            throw new UnknownPlayerException(secondPlayerOptionValue);
        }

        if (firstParticipant._id === secondParticipant._id) {
            throw new InvalidActionException("Un joueur ne peut pas s'affronter lui-même.");
        }

        const phase = interaction.options.getString(matchAddOptionMatchPhase.name, true);

        let platform = interaction.options.getString(matchAddOptionPlatform.name, false) as Platforms | null;
        if (!platform) {
            const platformIntersection = firstParticipant.platforms.filter(platform =>
                secondParticipant.platforms.includes(platform)
            );
            if (platformIntersection.length === 0) {
                throw new InvalidPlayerStateException(`<@${firstParticipant._id}> n'a pas de plateforme en commun avec <@${secondParticipant._id}>`, firstParticipant._id);
            }
            if (platformIntersection.length > 1) {
                throw new InvalidPlayerStateException(
                    `<@${firstParticipant._id}> a plusieurs plateformes en commun avec <@${secondParticipant._id}>, veuillez renseigner la plateforme dans la commande.`,
                    firstParticipant._id
                );
            }
            platform = platformIntersection[0] as Platforms;
        } else {
            // Check that both players are registered on the given platform

            if (!firstParticipant.platforms.includes(platform)) {
                throw new InvalidPlayerStateException(`Le joueur <@${firstParticipant._id}> n'est pas inscrit sur la plateforme ${platform} indiquée.`, firstParticipant._id);
            }
            if (!secondParticipant.platforms.includes(platform)) {
                throw new InvalidPlayerStateException(`Le joueur <@${secondParticipant._id}> n'est pas inscrit sur la plateforme ${platform} indiquée.`, secondParticipant._id);
            }
        }

        const match = await MatchService.instance.createMatchManually(
            _client,
            interaction.guild,
            platform,
            firstParticipant,
            secondParticipant,
            phase
        );

        await interaction.editReply({
            content: "# Nouveau match enregistré\n" +
                "## Joueurs\n" +
                `- <@${firstParticipant._id}>\n` +
                `- <@${secondParticipant._id}>\n` +
                "## Détails\n" +
                `- Phase : **${phase}**\n` +
                `- Plateforme : **${platform}**\n`,
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            label: "Aller au match",
                            emoji: {name: "🛠️"},
                            style: ButtonStyle.Link,
                            url: `https://discord.com/channels/${interaction.guildId}/${match.channel.threadId}`
                        }
                    ]
                }
            ],
            allowedMentions: {parse: []}
        });
    }
);

/** ========================================================================
 *  ==                           GROUP-COMMAND                            ==
 *  ==                              match                                 ==
 *  ========================================================================
 */
const matchSubCommandName = "match" as const;
const matchSubCommandNameLocalized: LocalizationMap = {
    fr: "match"
};

const matchSubCommandDescription = "All the commands reserved to the championship administrators on a match";
const matchSubCommandDescriptionLocalized: LocalizationMap = {
    fr: "Toutes les commandes réservées aux administrateurs du championnat sur un match"
};

const matchGroupCommand = new SubSlashCommandGroupOption(
    matchSubCommandName, matchSubCommandNameLocalized,
    matchSubCommandDescription, matchSubCommandDescriptionLocalized,
    {
        [matchStatusSubCommand.name]: matchStatusSubCommand,
        [matchAddSubCommand.name]: matchAddSubCommand
    }
);


/** ========================================================================
 *  ==                            SUB-COMMAND                             ==
 *  ==                           player  level                            ==
 *  ========================================================================
 */
const playerLevelSubCommandName = "level" as const;
const playerLevelSubCommandNameLocalized: LocalizationMap = {
    fr: "niveau"
};

const playerLevelSubCommandDescription = "Allow to change the level of a user";
const playerLevelSubCommandDescriptionLocalized: LocalizationMap = {
    fr: "Permet de changer le niveau d'un utilisateur"
};

const playerLevelOptionValueName = "value" as const;
const playerLevelOptionValueNameLocalized: LocalizationMap = {
    fr: "valeur"
};
const playerLevelOptionValueDescription = "The new level of the user";
const playerLevelOptionValueDescriptionLocalized: LocalizationMap = {
    fr: "Le nouveau niveau de l'utilisateur"
};
const playerLevelOptionValue = new IntegerCommandOption(
    playerLevelOptionValueName, playerLevelOptionValueNameLocalized,
    playerLevelOptionValueDescription, playerLevelOptionValueDescriptionLocalized,
    true, 0, 2
);

const playerLevelOptionUserName = "player" as const;
const playerLevelOptionUserNameLocalized: LocalizationMap = {
    fr: "joueur"
};
const playerLevelOptionUserDescription = "The user to change the level";
const playerLevelOptionUserDescriptionLocalized: LocalizationMap = {
    fr: "Le joueur dont on veut changer le niveau"
};
const playerLevelOptionUser = new UserCommandOption(
    playerLevelOptionUserName, playerLevelOptionUserNameLocalized,
    playerLevelOptionUserDescription, playerLevelOptionUserDescriptionLocalized,
    true
);

const playerLevelSubCommand = new SubSlashCommandOption(
    playerLevelSubCommandName, playerLevelSubCommandNameLocalized,
    playerLevelSubCommandDescription, playerLevelSubCommandDescriptionLocalized,
    {
        [playerLevelOptionUser.name]: playerLevelOptionUser,
        [playerLevelOptionValue.name]: playerLevelOptionValue
    },
    async function (_client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new Error("The guild is not cached");
        }

        const admin = interaction.member;
        if (!admin?.roles.cache.has(SUPPORT_ROLE_ID)) {
            throw new UnauthorizedActionException();
        }

        const value = interaction.options.getInteger(playerLevelOptionValue.name, true);
        if (value !== 0 && value !== 1 && value !== 2) {
            throw new Error("The value must be 0, 1 or 2");
        }

        const user = interaction.options.getUser(playerLevelOptionUser.name, true);

        const result = await ParticipantModel.updateOne(
            {_id: user.id},
            {level: value}
        );
        if (result.matchedCount === 0) {
            throw new UnknownPlayerException(user.id);
        }

        await interaction.reply({
            ephemeral: true,
            content: `Le niveau de <@${user.id}> a été mis à jour.`,
            allowedMentions: {parse: []}
        });
    }
);

/** ========================================================================
 *  ==                            SUB-COMMAND                             ==
 *  ==                           player status                            ==
 *  ========================================================================
 */
const playerStatusSubCommandName = "status" as const;
const playerStatusSubCommandNameLocalized: LocalizationMap = {
    fr: "statut"
};

const playerStatusSubCommandDescription = "Return the status of the player";
const playerStatusSubCommandDescriptionLocalized: LocalizationMap = {
    fr: "Renvoie le statut du joueur"
};

const playerStatusOptionUserName = "player" as const;
const playerStatusOptionUserNameLocalized: LocalizationMap = {
    fr: "joueur"
};
const playerStatusOptionUserDescription = "The user to get the status";
const playerStatusOptionUserDescriptionLocalized: LocalizationMap = {
    fr: "Le joueur dont on veut le statut"
};
const playerStatusOptionUser = new UserCommandOption(
    playerStatusOptionUserName, playerStatusOptionUserNameLocalized,
    playerStatusOptionUserDescription, playerStatusOptionUserDescriptionLocalized,
    false
);

const playerStatusSubCommand = new SubSlashCommandOption(
    playerStatusSubCommandName, playerStatusSubCommandNameLocalized,
    playerStatusSubCommandDescription, playerStatusSubCommandDescriptionLocalized,
    {
        [playerStatusOptionUser.name]: playerStatusOptionUser
    },
    async function (_client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new Error("The guild is not cached");
        }

        const admin = interaction.member;
        if (!admin?.roles.cache.has(SUPPORT_ROLE_ID)) {
            throw new UnauthorizedActionException();
        }

        const user = interaction.options.getUser(playerStatusOptionUser.name, false);
        if (user) {
            const [participant, matchmakingInProgress, matches] = await Promise.all([
                ParticipantModel.findById(user.id),
                MatchmakingService.instance.playerIsInQueue(user.id),
                MatchService.instance.findAllPlayerMatches(user.id)
            ]);
            if (!participant) {
                throw new UnknownPlayerException(user.id);
            }


            await interaction.reply({
                ephemeral: true,
                content: `# <@${user.id}>` +
                    "\n" +
                    "## Matchmaking\n" +
                    `- Plateforme : **${participant.platforms.join(', ')}**\n` +
                    `- Est en recherche d'aversaires : **${matchmakingInProgress ? "Oui" : "Non"}**\n` +
                    `- Elo : **${participant.level}**\n` +
                    "\n" +
                    `## Matchs (${matches.length})\n` +
                    matches.map(match => {
                        const opponent = match.players.find(player => player.participantId !== user.id);
                        const opponentName = opponent ? `<@${opponent.participantId}>` : "Inconnu";

                        const userWeapons = match.players.find(player => player.participantId === user.id)?.weapons;

                        return `- ${opponentName}  •  ${userWeapons?.stringifyStatus()}`;
                    }).join("\n"),
                allowedMentions: {parse: []}
            });
        } else {
            const participantsStatus = await MatchmakingService.instance.getFullMatchmakingStatus();

            await interaction.reply({
                ephemeral: true,
                content: `# Matchmaking des joueurs\n` +
                    participantsStatus.map(participantStatus => {
                        return `- ${participantStatus.hasWaitingTicket ? EMOJI_GREEN_CHECK : EMOJI_RED_CROSS}  •  <@${participantStatus._id}>`;
                    }).join("\n"),
                allowedMentions: {parse: []}
            });
        }
    }
);

/** ========================================================================
 *  ==                            SUB-COMMAND                             ==
 *  ==                          player register                           ==
 *  ========================================================================
 */
const playerRegisterSubCommandName = "register" as const;
const playerRegisterSubCommandNameLocalized: LocalizationMap = {
    fr: "inscrire"
};

const playerRegisterSubCommandDescription = "Register manually a player into the championship";
const playerRegisterSubCommandDescriptionLocalized: LocalizationMap = {
    fr: "Inscrit manuellement un joueur dans le championnat"
};

const playerRegisterOptionUserName = "player" as const;
const playerRegisterOptionUserNameLocalized: LocalizationMap = {
    fr: "joueur"
};
const playerRegisterOptionUserDescription = "The user to register";
const playerRegisterOptionUserDescriptionLocalized: LocalizationMap = {
    fr: "Le joueur à inscrire"
};
const playerRegisterOptionUser = new UserCommandOption(
    playerRegisterOptionUserName, playerRegisterOptionUserNameLocalized,
    playerRegisterOptionUserDescription, playerRegisterOptionUserDescriptionLocalized,
    true
);

const playerRegisterSubCommand = new SubSlashCommandOption(
    playerRegisterSubCommandName, playerRegisterSubCommandNameLocalized,
    playerRegisterSubCommandDescription, playerRegisterSubCommandDescriptionLocalized,
    {
        [playerRegisterOptionUser.name]: playerRegisterOptionUser
    },
    async function (client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new Error("The guild is not cached");
        }

        const admin = interaction.member;
        if (!admin?.roles.cache.has(SUPPORT_ROLE_ID)) {
            throw new UnauthorizedActionException();
        }

        const user = interaction.options.getUser(playerRegisterOptionUser.name, true);

        await new AdminRegisterForChampionshipAction({userId: user.id}).startFromObject(client, interaction);
    }
);

/** ========================================================================
 *  ==                           GROUP-COMMAND                            ==
 *  ==                               player                               ==
 *  ========================================================================
 */
const playerSubCommandName = "player" as const;
const playerSubCommandNameLocalized: LocalizationMap = {
    fr: "joueur"
};

const playerSubCommandDescription = "All the commands reserved to the championship administrators on a player";
const playerSubCommandDescriptionLocalized: LocalizationMap = {
    fr: "Toutes les commandes réservées aux administrateurs du championnat sur un joueur"
};

const playerGroupCommand = new SubSlashCommandGroupOption(
    playerSubCommandName, playerSubCommandNameLocalized,
    playerSubCommandDescription, playerSubCommandDescriptionLocalized,
    {
        [playerLevelSubCommand.name]: playerLevelSubCommand,
        [playerStatusSubCommand.name]: playerStatusSubCommand,
        [playerRegisterSubCommand.name]: playerRegisterSubCommand
    }
);


/** ========================================================================
 *  ==                              COMMAND                               ==
 *  ========================================================================
 */
const name = "admin" as const;
const nameLocalized: LocalizationMap = {
    fr: "admin"
};

const description = "All the commands reserved to the championship administrators";
const descriptionLocalized: LocalizationMap = {
    fr: "Toutes les commandes réservées aux administrateurs du championnat"
};

export = new SlashCommand(
    name, nameLocalized,
    description, descriptionLocalized,
    {
        [matchGroupCommand.name]: matchGroupCommand,
        [playerGroupCommand.name]: playerGroupCommand
    },
    undefined
);


/** ========================================================================
 *  ==                               UTILS                                ==
 *  ========================================================================
 */
async function _autocompleteParticipantByPlatform(interaction: AutocompleteInteraction, platformOptionName: string, optionName: string) {
    const platform = interaction.options.getString(platformOptionName, false);
    if (platform) {
        return ParticipantModel.find({platforms: platform})
            .limit(15)
            .exec()
            .then(part => part.map(participant => ({name: participant.displayName, value: participant._id})));
    }

    const firstPlayer = interaction.options.getString(optionName, false);
    if (!firstPlayer) {
        return ParticipantModel.find()
            .limit(15)
            .exec()
            .then(part => part.map(participant => ({name: participant.displayName, value: participant._id})));
    }

    const participantDocuments = await ParticipantModel.find({
        $or: [
            {_id: firstPlayer},
            {displayName: firstPlayer}
        ]
    }).exec();
    if (participantDocuments.length === 0) {
        return ParticipantModel.find()
            .limit(15)
            .exec()
            .then(part => part.map(participant => ({name: participant.displayName, value: participant._id})));
    }

    // Suggest participants on the same platforms as the matching one
    const platforms = participantDocuments.map(doc => doc.platforms).flat();
    const uniquePlatforms = Array.from(new Set(platforms));
    return ParticipantModel.find({platforms: {$in: uniquePlatforms}})
        .limit(15)
        .exec()
        .then(part => part.map(participant => ({name: participant.displayName, value: participant._id})));
}