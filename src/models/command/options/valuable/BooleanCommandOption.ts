import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import {
    ApplicationCommandOptionType,
    LocalizationMap,
    SlashCommandBooleanOption, SlashCommandBuilder,
    SlashCommandSubcommandBuilder
} from "discord.js";

export class BooleanCommandOption<IsRequired extends boolean = boolean> extends SlashCommandOptionValuable<ApplicationCommandOptionType.Boolean, IsRequired> {
    constructor(name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, isRequired: IsRequired) {
        super(ApplicationCommandOptionType.Boolean, name, nameLocalized, description, descriptionLocalized, isRequired);
    }


    getValue(this: BooleanCommandOption<true>, interaction: ChatInputCommandInteraction): boolean
    getValue(this: BooleanCommandOption<false>, interaction: ChatInputCommandInteraction): boolean | null
    getValue(interaction: ChatInputCommandInteraction): boolean | null {
        return interaction.options.getBoolean(this.name, this.isRequired);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandBooleanOption()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setRequired(this.isRequired);

        command.addBooleanOption(option);

        return option;
    }
}
