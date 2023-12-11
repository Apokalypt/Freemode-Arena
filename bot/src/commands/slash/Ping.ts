import type { LocalizationMap } from "discord.js";
import { SlashCommand } from "@models/command/SlashCommand";
import { EmbedBuilder } from "discord.js";
import { COLOR_INFO } from "@constants";

const name = "ping" as const;

const description = "Retrieve information about the bot";
const descriptionLocalized: LocalizationMap = {
    "en-US": "Retrieve information about the bot",
    "en-GB": "Retrieve information about the bot",
    "fr": "Récupère des informations sur le bot"
};

export = new SlashCommand(
    name, undefined,
    description, descriptionLocalized,
    { },
    async function (client, interaction) {
        const reply = await interaction.deferReply({ ephemeral: true, fetchReply: true });

        const clientPing = reply.createdTimestamp - interaction.createdTimestamp;
        const apiPing = client.discord.ws.ping;

        await client.utils.sendInteractionAnswer(
            interaction,
            {
                ephemeral: true,
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🏓 Pong !")
                        .addFields(
                            { name: "Bot ping", value: _formatPing(clientPing), inline: true },
                            { name: "API ping", value: _formatPing(apiPing), inline: true }
                        )
                        .setColor(COLOR_INFO)
                        .setTimestamp()
                ]
            }
        );
    }
)

function _formatPing(ping: number): string {
    if (ping < 0) {
        return "N/A";
    }

    return `${ping}ms`;
}
