import type { BotClient } from "@models/BotClient";
import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    LocalizationMap, SlashCommandBuilder,
    SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder
} from "discord.js";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import { SlashCommandOption } from "@models/command/options/SlashCommandOption";

export class SubSlashCommandOption<O extends Record<string, SlashCommandOptionValuable> = Record<string, SlashCommandOptionValuable>> extends SlashCommandOption<ApplicationCommandOptionType.Subcommand> {
    readonly options: O;

    readonly action: (this: SubSlashCommandOption<O>, client: BotClient, interaction: ChatInputCommandInteraction) => Promise<void>;


    constructor(name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined, options: O, action: (this: SubSlashCommandOption<O>, client: BotClient, interaction: ChatInputCommandInteraction) => Promise<void>) {
        super(ApplicationCommandOptionType.Subcommand, name, nameLocalized, description, descriptionLocalized);
        this.options = options;
        this.action = action;
    }


    public async execute(client: BotClient, interaction: ChatInputCommandInteraction): Promise<void> {
        return this.action(client, interaction);
    }

    public build(command: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandBuilder {
        const subcommand = new SlashCommandSubcommandBuilder()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null);

        for (const option of Object.values(this.options)) {
            option.build(subcommand);
        }

        command.addSubcommand(subcommand);

        return subcommand;
    }
}
