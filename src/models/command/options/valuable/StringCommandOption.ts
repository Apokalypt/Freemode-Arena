import type { ChatInputCommandInteraction } from "discord.js";
import type { AutocompleteOrChoices } from "@bot-types";
import {
    ApplicationCommandOptionType,
    LocalizationMap, SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder
} from "discord.js";
import { AutocompleteCommandOption } from "@models/command/options/valuable/AutocompleteCommandOption";

export class StringCommandOption<IsRequired extends boolean = boolean> extends AutocompleteCommandOption<ApplicationCommandOptionType.String, IsRequired> {
    readonly minLength?: number;
    readonly maxLength?: number;

    constructor(
        name: string, nameLocalized: LocalizationMap | undefined,
        description: string, descriptionLocalized: LocalizationMap | undefined,
        isRequired: IsRequired,
        minLength?: number, maxLength?: number,
        autocompleteOrChoices?: AutocompleteOrChoices<ApplicationCommandOptionType.String>
    ) {
        super(ApplicationCommandOptionType.String, name, nameLocalized, description, descriptionLocalized, isRequired, autocompleteOrChoices);

        this.minLength = minLength;
        this.maxLength = maxLength;
    }

    public getValue(this: StringCommandOption<true>, interaction: ChatInputCommandInteraction): string
    public getValue(this: StringCommandOption<false>, interaction: ChatInputCommandInteraction): string | null
    public getValue(interaction: ChatInputCommandInteraction): string | null {
        return interaction.options.getString(this.name, this.isRequired);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandStringOption()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setRequired(this.isRequired);
        if (this.minLength !== undefined) {
            option.setMinLength(this.minLength);
        }
        if (this.maxLength !== undefined) {
            option.setMaxLength(this.maxLength);
        }

        if (typeof this.autocompleteOrChoices === "function") {
            option.setAutocomplete(true);
        } else if (this.autocompleteOrChoices?.length) {
            option.addChoices(...this.autocompleteOrChoices);
        }

        command.addStringOption(option);

        return option;
    }
}
