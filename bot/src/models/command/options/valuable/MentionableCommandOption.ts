import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import {
    ApplicationCommandOptionType,
    LocalizationMap, SlashCommandBuilder,
    SlashCommandMentionableOption,
    SlashCommandSubcommandBuilder
} from "discord.js";
import { ValueTypeFromCommandOptionType } from "@bot-types";

export class MentionableCommandOption<IsRequired extends boolean = boolean> extends SlashCommandOptionValuable<ApplicationCommandOptionType.Mentionable, IsRequired> {
    constructor(name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, isRequired: IsRequired) {
        super(ApplicationCommandOptionType.Mentionable, name, nameLocalized, description, descriptionLocalized, isRequired);
    }


    getValue<C extends CacheType>(this: MentionableCommandOption<true>, interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Mentionable]
    getValue<C extends CacheType>(this: MentionableCommandOption<false>, interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Mentionable] | null
    getValue<C extends CacheType>(interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Mentionable] | null {
        return interaction.options.getMentionable(this.name, this.isRequired);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandMentionableOption()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setRequired(this.isRequired);

        command.addMentionableOption(option);

        return option;
    }
}
