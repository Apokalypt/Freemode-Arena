import type { AutocompleteOrChoices } from "@bot-types";
import {
    ApplicationCommandOptionType, ChatInputCommandInteraction,
    LocalizationMap, SlashCommandBuilder,
    SlashCommandNumberOption,
    SlashCommandSubcommandBuilder
} from "discord.js";
import { NumberCommandOption } from "@models/command/options/valuable/NumberCommandOption";
import { NumberCommandOptionType } from "@bot-types";

export class DoubleCommandOption<IsRequired extends boolean = boolean> extends NumberCommandOption<ApplicationCommandOptionType.Number, IsRequired> {
    constructor(
        name: string, nameLocalized: LocalizationMap | undefined,
        description: string, descriptionLocalized: LocalizationMap | undefined,
        isRequired: IsRequired,
        minValue?: number, maxValue?: number,
        autocompleteOrChoices?: AutocompleteOrChoices<ApplicationCommandOptionType.Number>
    ) {
        super(ApplicationCommandOptionType.Number, name, nameLocalized, description, descriptionLocalized, isRequired, minValue, maxValue, autocompleteOrChoices);
    }


    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandNumberOption()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setRequired(this.isRequired);
        if (this.minValue !== undefined) {
            option.setMinValue(this.minValue);
        }
        if (this.maxValue !== undefined) {
            option.setMaxValue(this.maxValue);
        }

        if (typeof this.autocompleteOrChoices === "function") {
            option.setAutocomplete(true);
        } else if (this.autocompleteOrChoices?.length) {
            option.setChoices(...this.autocompleteOrChoices);
        }

        command.addNumberOption(option);

        return option;
    }

    public getValue(this: NumberCommandOption<NumberCommandOptionType, true>, interaction: ChatInputCommandInteraction): number
    public getValue(this: NumberCommandOption<NumberCommandOptionType, false>, interaction: ChatInputCommandInteraction): number | null
    public getValue(interaction: ChatInputCommandInteraction): number | null {
        return interaction.options.getNumber(this.name, this.isRequired);
    }
}
