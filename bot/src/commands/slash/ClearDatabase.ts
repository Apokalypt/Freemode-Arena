import { SlashCommand } from "@models/command/SlashCommand";
import { EmbedBuilder } from "discord.js";
import { COLOR_INFO } from "@constants";
import { MatchmakingTicketModel } from "@models/championship/MatchmakingTicket";
import { MatchModel } from "@models/championship/Match";
import { ParticipantModel } from "@models/championship/Participant";

const name = "clear-database" as const;

const description = "Clear the whole database";

export = new SlashCommand(
    name, undefined,
    description, undefined,
    { },
    async function (_client, interaction) {
        if (process.env.NODE_ENV !== "development") {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("This command can only be used in development mode")
                        .setColor(COLOR_INFO)
                ],
                ephemeral: true
            });
            return;
        }

        await Promise.allSettled([
            MatchModel.deleteMany({ }),
            MatchmakingTicketModel.deleteMany({ }),
            ParticipantModel.deleteMany({ })
        ])
            .then(() => {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Database cleared")
                            .setColor(COLOR_INFO)
                    ],
                    ephemeral: true
                });
            })
            .catch((err) => {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Error while clearing the database")
                            .setColor(COLOR_INFO)
                    ],
                    ephemeral: true
                });
            });
    }
)
