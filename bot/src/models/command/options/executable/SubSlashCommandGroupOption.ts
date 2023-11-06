import type { SubSlashCommandOption } from "@models/command/options/executable/SubSlashCommandOption";
import type { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import {
    ApplicationCommandOptionType,
    LocalizationMap,
    SlashCommandBuilder,
    SlashCommandSubcommandGroupBuilder
} from "discord.js";
import { SlashCommandOption } from "@models/command/options/SlashCommandOption";

export class SubSlashCommandGroupOption<O extends Record<string, SlashCommandOptionValuable>> extends SlashCommandOption<ApplicationCommandOptionType.SubcommandGroup> {
    readonly options: Record<string, SubSlashCommandOption<O>>;


    constructor(name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, commands: Record<string, SubSlashCommandOption<any>>) {
        super(ApplicationCommandOptionType.SubcommandGroup, name, nameLocalized, description, descriptionLocalized);
        this.options = commands;
    }


    public build(command: SlashCommandBuilder): SlashCommandSubcommandGroupBuilder {
        const group = new SlashCommandSubcommandGroupBuilder()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null);

        for (const subcommand of Object.values(this.options)) {
            subcommand.build(group);
        }

        command.addSubcommandGroup(group);

        return group;
    }
}
