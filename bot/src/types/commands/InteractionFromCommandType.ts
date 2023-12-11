import type { ApplicationCommandType } from "discord.js"
import type {
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction
} from "discord.js";

export type InteractionFromCommandType = {
    [ApplicationCommandType.ChatInput]: ChatInputCommandInteraction;
    [ApplicationCommandType.User]: UserContextMenuCommandInteraction;
    [ApplicationCommandType.Message]: MessageContextMenuCommandInteraction;
}
