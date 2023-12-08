import type { LocalizationMap } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "@models/command/SlashCommand";
import { MatchService } from "@services/MatchService";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";

const name = "match-status" as const;
const nameLocalized: LocalizationMap = {
    fr: "statut-match"
};

const description = "Return the status of the match linked to the channel";
const descriptionLocalized: LocalizationMap = {
    fr: "Renvoie le statut du match lié au salon"
};

export = new SlashCommand(
    name, nameLocalized,
    description, descriptionLocalized,
    { },
    async function (client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new Error("The guild is not cached");
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
    },
    PermissionFlagsBits.Administrator,
    false
);
