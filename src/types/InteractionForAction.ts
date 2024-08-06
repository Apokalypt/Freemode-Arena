import type { CacheType, ButtonInteraction, StringSelectMenuInteraction } from "discord.js";

export type InteractionForAction<Cached extends CacheType = CacheType> = StringSelectMenuInteraction<Cached> | ButtonInteraction<Cached>;
