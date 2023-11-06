import { MessageFlags, MessageType } from "discord.js";
import { Event } from "@models/Event";

const MESSAGE_TYPES_SUPPORTED = [MessageType.Default, MessageType.Reply];

export = new Event(
    "messageCreate",
    false,
    async (client, message) => {
        // Take care about user messages only
        if (message.flags.has(MessageFlags.Ephemeral) || !MESSAGE_TYPES_SUPPORTED.includes(message.type)) {
            return;
        }

        // Ignore message send by the bot or by a webhook
        if (message.author.id === client.discord.user.id || message.webhookId) {
            return;
        }
        // Ignore message that's not sent in a guild
        if (!message.inGuild()) {
            return;
        }

        // TODO : Refactor to use Config command in global !
        if (message.author.id === "305940554221355008" && message.content === "!publish") {
            await client.publishCommandsToGuild(message.guild);

            await message.reply({ content: "✅ Commands published" })
                .catch( _ => null );
        }
    }
);
