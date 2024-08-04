import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import {
    ApplicationCommandOptionType,
    CacheType,
    LocalizationMap, SlashCommandAttachmentOption,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder
} from "discord.js";
import { ValueTypeFromCommandOptionType } from "@bot-types";

export class AttachmentCommandOption<IsRequired extends boolean = boolean> extends SlashCommandOptionValuable<ApplicationCommandOptionType.Attachment, IsRequired> {
    constructor(name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, isRequired: IsRequired) {
        super(ApplicationCommandOptionType.Attachment, name, nameLocalized, description, descriptionLocalized, isRequired);
    }


    getValue<C extends CacheType>(this: AttachmentCommandOption<true>, interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Attachment]
    getValue<C extends CacheType>(this: AttachmentCommandOption<false>, interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Attachment] | null
    getValue<C extends CacheType>(interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Attachment] | null {
        return interaction.options.getAttachment(this.name, this.isRequired);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandAttachmentOption()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setRequired(this.isRequired);

        command.addAttachmentOption(option);

        return option;
    }
}
