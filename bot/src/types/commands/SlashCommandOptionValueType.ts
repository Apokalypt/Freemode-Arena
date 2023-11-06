import type { ValueTypeFromCommandOptionType, Nullish } from "@bot-types";
import type { ApplicationCommandOptionType, CacheType } from "discord.js";

export type SlashCommandOptionValueType<T extends ApplicationCommandOptionType, Cached extends CacheType, IsRequired extends true | false> =
    IsRequired extends true ? ValueTypeFromCommandOptionType<Cached>[T] : Nullish<ValueTypeFromCommandOptionType<Cached>[T]>;
