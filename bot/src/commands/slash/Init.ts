import type { LocalizationMap } from "discord.js";
import { SlashCommand } from "@models/command/SlashCommand";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { COLOR_INFO } from "@constants";

const name = "init" as const;

const description = "Initialize the bot in the guild";
const descriptionLocalized: LocalizationMap = {
    fr: "Initialise le bot sur le serveur"
};

export = new SlashCommand(
    name, undefined,
    description, descriptionLocalized,
    { },
    async function (client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new Error("The guild is not cached");
        }

        await client.publishCommandsToGuild(interaction.guild);

        await client.utils.sendInteractionAnswer(
            interaction,
            {
                embeds: [
                    new EmbedBuilder()
                        .setColor(COLOR_INFO)
                        .setTitle("Initialization")
                        .setDescription("The bot has been successfully initialized in the guild")
                ],
                ephemeral: true
            }
        )
    },
    PermissionFlagsBits.Administrator,
    false,
    true
);
