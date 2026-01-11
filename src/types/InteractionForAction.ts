import type { CacheType, ButtonInteraction, StringSelectMenuInteraction, ChatInputCommandInteraction } from "discord.js";

export type InteractionForAction<Cached extends CacheType = CacheType> =
    | ChatInputCommandInteraction<Cached>
    | StringSelectMenuInteraction<Cached>
    | ButtonInteraction<Cached>;
