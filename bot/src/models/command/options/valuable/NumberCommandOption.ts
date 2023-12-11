import type { NumberCommandOptionType, AutocompleteOrChoices } from "@bot-types";
import { AutocompleteCommandOption } from "@models/command/options/valuable/AutocompleteCommandOption";
import { LocalizationMap } from "discord.js";

export abstract class NumberCommandOption<T extends NumberCommandOptionType, IsRequired extends boolean> extends AutocompleteCommandOption<T, IsRequired> {
    readonly minValue?: number;
    readonly maxValue?: number;

    protected constructor(
        type: T,
        name: string, nameLocalized: LocalizationMap | undefined,
        description: string, descriptionLocalized: LocalizationMap | undefined,
        isRequired: IsRequired,
        minValue?: number, maxValue?: number,
        autocompleteOrChoices?: AutocompleteOrChoices<T>
    ) {
        super(type, name, nameLocalized, description, descriptionLocalized, isRequired, autocompleteOrChoices);

        this.minValue = minValue;
        this.maxValue = maxValue;
    }
}
