import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from "discord.js";
import type { AutoCompleteCommandOptionType, ValueTypeFromCommandOptionType } from "@bot-types";
import type { BotClient } from "@models/BotClient";

export type AutocompleteOrChoices<T extends AutoCompleteCommandOptionType> =
    | ((client: BotClient, interaction: AutocompleteInteraction, value: ValueTypeFromCommandOptionType[T]) => Promise<ApplicationCommandOptionChoiceData<ValueTypeFromCommandOptionType[T]>[]>)
    | ApplicationCommandOptionChoiceData<ValueTypeFromCommandOptionType[T]>[];
