import type { SlashCommandOptionValueType } from "@bot-types";
import {
    ApplicationCommandOptionType,
    CacheType,
    ChatInputCommandInteraction,
    LocalizationMap, SlashCommandBuilder, SlashCommandSubcommandBuilder
} from "discord.js";
import { SlashCommandOption } from "@models/command/options/SlashCommandOption";

export abstract class SlashCommandOptionValuable<T extends ApplicationCommandOptionType = ApplicationCommandOptionType, IsRequired extends boolean = boolean> extends SlashCommandOption<T> {
    readonly isRequired: IsRequired;


    protected constructor(type: T, name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, isRequired: IsRequired) {
        super(type, name, nameLocalized, description, descriptionLocalized);
        this.isRequired = isRequired;
    }


    public abstract build(command: SlashCommandBuilder | SlashCommandSubcommandBuilder);

    public abstract getValue<Cached extends CacheType>(interaction: ChatInputCommandInteraction<Cached>): SlashCommandOptionValueType<T, Cached, IsRequired>;
}
