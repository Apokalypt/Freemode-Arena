import { Event } from "@models/Event";
import { Exception } from "@models/Exception";
import { SlashCommand } from "@models/command/SlashCommand";
import { UnknownException } from "@exceptions/UnknownException";
import { NotSupportedException } from "@exceptions/NotSupportedException";
import { UnknownCommandException } from "@exceptions/command/UnknownCommandException";

export = new Event(
    "interactionCreate",
    false,
    async (client, interaction) => {
        if (interaction.isAnySelectMenu()) {
            interaction.message.edit({ components: interaction.message.components }).catch( _ => null );
        }

        try {
            if (interaction.isCommand()) {
                const command = client.getCommand(interaction.commandType, interaction.commandName);
                if (!command) {
                    throw new UnknownCommandException();
                }

                await command.execute(client, interaction);
            } else if (interaction.isAutocomplete()) {
                const command = client.getCommand(interaction.commandType, interaction.commandName);
                if (!command || !(command instanceof SlashCommand)) {
                    await interaction.respond([]);

                    throw new UnknownCommandException();
                }

                await command.autocomplete(client, interaction);
            } else {
                throw new NotSupportedException();
            }
        } catch (e) {
            let error: Exception;
            if (e instanceof Exception) {
                error = e;
            } else {
                console.error("An unknown error occurred while handling the interaction:", e);
                error = new UnknownException();
            }

            if (interaction.isRepliable()) {
                await client.utils.sendInteractionAnswer(
                    interaction,
                    { embeds: [error.toEmbed()], ephemeral: true }
                );
            }
        }
    }
);
