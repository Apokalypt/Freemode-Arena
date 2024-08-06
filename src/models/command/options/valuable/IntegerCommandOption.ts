import type { AutocompleteOrChoices } from "@bot-types";
import {
    ApplicationCommandOptionType, ChatInputCommandInteraction,
    LocalizationMap, SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandSubcommandBuilder
} from "discord.js";
import { NumberCommandOption } from "@models/command/options/valuable/NumberCommandOption";
import { NumberCommandOptionType } from "@bot-types";

export class IntegerCommandOption<IsRequired extends boolean = boolean> extends NumberCommandOption<ApplicationCommandOptionType.Integer, IsRequired> {
    constructor(
        name: string, nameLocalized: LocalizationMap | undefined,
        description: string, descriptionLocalized: LocalizationMap | undefined,
        isRequired: IsRequired,
        minValue?: number, maxValue?: number,
        autocompleteOrChoices?: AutocompleteOrChoices<ApplicationCommandOptionType.Integer>
    ) {
        super(ApplicationCommandOptionType.Integer, name, nameLocalized, description, descriptionLocalized, isRequired, minValue, maxValue, autocompleteOrChoices);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandIntegerOption()
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

        command.addIntegerOption(option);

        return option;
    }

    public getValue(this: NumberCommandOption<NumberCommandOptionType, true>, interaction: ChatInputCommandInteraction): number
    public getValue(this: NumberCommandOption<NumberCommandOptionType, false>, interaction: ChatInputCommandInteraction): number | null
    public getValue(interaction: ChatInputCommandInteraction): number | null {
        return interaction.options.getInteger(this.name, this.isRequired);
    }
}
