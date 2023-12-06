import { getModelWithString } from "@typegoose/typegoose";
import { Event } from "@models/Event";
import { Action } from "@models/action/Action";
import { Exception } from "@models/Exception";
import { SlashCommand } from "@models/command/SlashCommand";
import { UnknownException } from "@exceptions/UnknownException";
import { NotSupportedException } from "@exceptions/NotSupportedException";
import { UnknownActionException } from "@exceptions/actions/UnknownActionException";
import { UnknownCommandException } from "@exceptions/command/UnknownCommandException";
import { MAPPING_ACTION_CODES_MODELS } from "@enums";
import { SEPARATOR_PROPERTY_INTERACTION_ID } from "@constants";

export = new Event(
    "interactionCreate",
    false,
    async (client, interaction) => {
        if ("customId" in interaction && interaction.customId.startsWith("local")) {
            return;
        }

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
            } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
                const [actionIdOrTypeOrMissing, actionType,] = interaction.customId.split(SEPARATOR_PROPERTY_INTERACTION_ID);

                const modelName = MAPPING_ACTION_CODES_MODELS[actionIdOrTypeOrMissing] ?? MAPPING_ACTION_CODES_MODELS[actionType];
                if (!modelName) {
                    throw new UnknownActionException();
                }

                const model = getModelWithString(modelName);
                if (!model || !("fromInteractionId" in model) || typeof model.fromInteractionId !== "function") {
                    throw new UnknownActionException();
                }

                let action: Action | null = null;
                try {
                    action = model.fromInteractionId(client, interaction);
                } catch (_) { /* Ignore */ }

                if (!action) {
                    throw new UnknownActionException();
                }

                await action.startFromObject(client, interaction);
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
