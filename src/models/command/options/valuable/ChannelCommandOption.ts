import type {
    ApplicationCommandOptionAllowedChannelTypes,
    ChatInputCommandInteraction,
    CacheType
} from "discord.js";
import type { ValueTypeFromCommandOptionType } from "@bot-types";
import {
    ApplicationCommandOptionType,
    LocalizationMap,
    SlashCommandBuilder, SlashCommandChannelOption,
    SlashCommandSubcommandBuilder
} from "discord.js";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";

export class ChannelCommandOption<IsRequired extends boolean = boolean> extends SlashCommandOptionValuable<ApplicationCommandOptionType.Channel, IsRequired> {
    channelTypes?: ApplicationCommandOptionAllowedChannelTypes[];

    constructor(name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, isRequired: IsRequired, channelTypes: ApplicationCommandOptionAllowedChannelTypes[] = []) {
        super(ApplicationCommandOptionType.Channel, name, nameLocalized, description, descriptionLocalized, isRequired);
        this.channelTypes = channelTypes;
    }


    getValue<C extends CacheType>(this: ChannelCommandOption<true>, interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Channel]
    getValue<C extends CacheType>(this: ChannelCommandOption<false>, interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Channel] | null
    getValue<C extends CacheType>(interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Channel] | null {
        return interaction.options.getChannel(this.name, this.isRequired);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandChannelOption()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setRequired(this.isRequired);
        if (this.channelTypes?.length) {
            option.addChannelTypes(...this.channelTypes);
        }

        command.addChannelOption(option);

        return option;
    }
}
