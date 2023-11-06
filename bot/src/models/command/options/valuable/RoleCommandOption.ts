import type { ChatInputCommandInteraction } from "discord.js";
import type { ValueTypeFromCommandOptionType } from "@bot-types";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import {
    ApplicationCommandOptionType,
    CacheType,
    LocalizationMap, SlashCommandBuilder,
    SlashCommandRoleOption,
    SlashCommandSubcommandBuilder
} from "discord.js";

export class RoleCommandOption<IsRequired extends boolean = boolean> extends SlashCommandOptionValuable<ApplicationCommandOptionType.Role, IsRequired> {
    constructor(name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, isRequired: IsRequired) {
        super(ApplicationCommandOptionType.Role, name, nameLocalized, description, descriptionLocalized, isRequired);
    }


    getValue<C extends CacheType>(this: RoleCommandOption<true>, interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Role]
    getValue<C extends CacheType>(this: RoleCommandOption<false>, interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Role] | null
    getValue<C extends CacheType>(interaction: ChatInputCommandInteraction<C>): ValueTypeFromCommandOptionType<C>[ApplicationCommandOptionType.Role] | null {
        return interaction.options.getRole(this.name, this.isRequired);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandRoleOption()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setRequired(this.isRequired);

        command.addRoleOption(option);

        return option;
    }
}
