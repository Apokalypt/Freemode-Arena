import type { ChatInputCommandInteraction, User } from "discord.js";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import {
    ApplicationCommandOptionType, GuildMember,
    LocalizationMap,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder, SlashCommandUserOption
} from "discord.js";

export class UserCommandOption<IsRequired extends boolean = boolean> extends SlashCommandOptionValuable<ApplicationCommandOptionType.User, IsRequired> {
    constructor(name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, isRequired: IsRequired) {
        super(ApplicationCommandOptionType.User, name, nameLocalized, description, descriptionLocalized, isRequired);
    }


    getValue(this: UserCommandOption<true>, interaction: ChatInputCommandInteraction): GuildMember | User
    getValue(this: UserCommandOption<false>, interaction: ChatInputCommandInteraction): User | null
    getValue(interaction: ChatInputCommandInteraction): GuildMember | User | null {
        const member = interaction.options.getMember(this.name);
        if (member instanceof GuildMember) {
            return member;
        }

        return interaction.options.getUser(this.name, this.isRequired);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        const option = new SlashCommandUserOption()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setRequired(this.isRequired);

        command.addUserOption(option);

        return option;
    }
}
