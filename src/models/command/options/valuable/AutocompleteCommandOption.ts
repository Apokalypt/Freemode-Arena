import type { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from "discord.js";
import type { AutoCompleteCommandOptionType, ValueTypeFromCommandOptionType, AutocompleteOrChoices } from "@bot-types";
import type { BotClient } from "@models/BotClient";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import { LocalizationMap } from "discord.js";

export abstract class AutocompleteCommandOption<T extends AutoCompleteCommandOptionType, IsRequired extends boolean> extends SlashCommandOptionValuable<T, IsRequired> {
    public readonly autocompleteOrChoices?: AutocompleteOrChoices<T>;

    protected constructor(
        type: T,
        name: string, nameLocalized: LocalizationMap | undefined,
        description: string, descriptionLocalized: LocalizationMap | undefined,
        isRequired: IsRequired,
        autocompleteOrChoices?: AutocompleteOrChoices<T>
    ) {
        super(type, name, nameLocalized, description, descriptionLocalized, isRequired);

        this.autocompleteOrChoices = autocompleteOrChoices;
    }

    public async autocomplete(client: BotClient, interaction: AutocompleteInteraction, value: ValueTypeFromCommandOptionType[T]): Promise<ApplicationCommandOptionChoiceData[]> {
        if (!this.autocompleteOrChoices) {
            return [];
        }

        if (typeof this.autocompleteOrChoices === "function") {
            return this.autocompleteOrChoices(client, interaction, value);
        } else {
            return this.autocompleteOrChoices;
        }
    }
}
