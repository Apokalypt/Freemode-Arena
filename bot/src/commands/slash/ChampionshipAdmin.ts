import type { LocalizationMap } from "discord.js";
import { SlashCommand } from "@models/command/SlashCommand";
import { ParticipantModel } from "@models/championship/Participant";
import { UserCommandOption } from "@models/command/options/valuable/UserCommandOption";
import { IntegerCommandOption } from "@models/command/options/valuable/IntegerCommandOption";
import { SubSlashCommandOption } from "@models/command/options/executable/SubSlashCommandOption";
import { SubSlashCommandGroupOption } from "@models/command/options/executable/SubSlashCommandGroupOption";
import { MatchService } from "@services/MatchService";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { UnknownPlayerException } from "@exceptions/championship/UnknownPlayerException";
import { UnauthorizedActionException } from "@exceptions/actions/UnauthorizedActionException";
import { SUPPORT_ROLE_ID } from "@constants";


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
    { },
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
            allowedMentions: { parse: [] }
        });
    }
);

/** ========================================================================
 *  ==                            SUB-COMMAND                             ==
 *  ==                            match  step                             ==
 *  ========================================================================
 */
const matchStepSubCommandName = "step" as const;
const matchStepSubCommandNameLocalized: LocalizationMap = {
    fr: "étape"
};

const matchStepSubCommandDescription = "Allow to change the step of the match";
const matchStepSubCommandDescriptionLocalized: LocalizationMap = {
    fr: "Permet de changer l'étape du match"
};

const matchStepSubCommand = new SubSlashCommandOption(
    matchStepSubCommandName, matchStepSubCommandNameLocalized,
    matchStepSubCommandDescription, matchStepSubCommandDescriptionLocalized,
    { },
    async function (_client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new Error("The guild is not cached");
        }

        const admin = interaction.member;
        if (!admin?.roles.cache.has(SUPPORT_ROLE_ID)) {
            throw new UnauthorizedActionException();
        }

        throw new Error("Not implemented");
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
        [matchStepSubCommand.name]: matchStepSubCommand
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
            { _id: user.id },
            { level: value }
        );
        if (result.matchedCount === 0) {
            throw new UnknownPlayerException(user.id);
        }

        await interaction.reply({
            ephemeral: true,
            content: `Le niveau de <@${user.id}> a été mis à jour.`,
            allowedMentions: { parse: [] }
        });
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
        [playerLevelSubCommand.name]: playerLevelSubCommand
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
