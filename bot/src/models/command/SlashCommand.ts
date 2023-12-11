import type { ChatInputCommandInteraction } from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { SubSlashCommand } from "@bot-types";
import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    AutocompleteInteraction,
    LocalizationMap,
    SlashCommandBuilder
} from "discord.js";
import { BaseCommand } from "@models/command/BaseCommand";
import { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";
import { SubSlashCommandGroupOption } from "@models/command/options/executable/SubSlashCommandGroupOption";
import { SubSlashCommandOption } from "@models/command/options/executable/SubSlashCommandOption";
import { AutocompleteCommandOption } from "@models/command/options/valuable/AutocompleteCommandOption";
import { CommandOptionNotAutocompleteException } from "@exceptions/command/CommandOptionNotAutocompleteException";
import { UnknownCommandException } from "@exceptions/command/UnknownCommandException";

type CommandOption = Record<string, SlashCommandOptionValuable> | Record<string, SubSlashCommand>

export class SlashCommand<O extends CommandOption = CommandOption> extends BaseCommand<ApplicationCommandType.ChatInput> {
    readonly options: O;
    readonly isGlobal: boolean;

    constructor(
        name: string, nameLocalized: LocalizationMap | undefined,
        description: string, descriptionLocalized: LocalizationMap | undefined,
        options: O,
        action: O extends Record<string, SlashCommandOptionValuable> ? (this: SlashCommand<O>, client: BotClient, interaction: ChatInputCommandInteraction) => Promise<void>
            : undefined,
        defaultPermissions?: bigint,
        allowInDm?: boolean,
        isGlobal?: boolean
    ) {
        let finalAction: (client: BotClient, interaction: ChatInputCommandInteraction) => Promise<void>;
        if (action) {
            finalAction = action;
        } else {
            finalAction = async function (this: SlashCommand<O>, client: BotClient, interaction: ChatInputCommandInteraction) {
                const command = this._getCommand(interaction);
                if (command === this) {
                    throw new UnknownCommandException();
                }

                return command.execute(client, interaction);
            }
        }

        super(ApplicationCommandType.ChatInput, name, nameLocalized, description, descriptionLocalized, finalAction, defaultPermissions, allowInDm);

        this.options = options;
        this.isGlobal = isGlobal ?? false;
    }

    public async autocomplete(client: BotClient, interaction: AutocompleteInteraction): Promise<void> {
        const command = this._getCommand(interaction);

        const optionFocused = interaction.options.getFocused(true);
        const option = command.options[optionFocused.name];
        if (!(option instanceof AutocompleteCommandOption) || option.type !== optionFocused.type) {
            throw new CommandOptionNotAutocompleteException();
        }

        const valueTyped = option.type === ApplicationCommandOptionType.String ? optionFocused.value : Number(optionFocused.value);

        const suggestions = await option.autocomplete(client, interaction, valueTyped);
        return interaction.respond(suggestions);
    }

    public build() {
        const command = new SlashCommandBuilder()
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDescription(this.description)
            .setDescriptionLocalizations(this.descriptionLocalized ?? null)
            .setDefaultMemberPermissions(this.defaultPermissions)
            .setDMPermission(this.allowInDM);

        for (const option of Object.values(this.options)) {
            option.build(command);
        }

        return command;
    }

    /**
     * Return the command associated with the interaction with handling of subcommands
     *
     * @param interaction
     * @private
     */
    private _getCommand(interaction: ChatInputCommandInteraction | AutocompleteInteraction): SubSlashCommandOption | this {
        let command: SubSlashCommand | this = this;
        let options: CommandOption = this.options;

        const groupName = interaction.options.getSubcommandGroup(false);
        if (groupName) {
            const option = this.options[groupName];
            if (option instanceof SubSlashCommandGroupOption) {
                options = option.options;
                command = option;
            } else {
                throw new UnknownCommandException();
            }
        }

        const subcommandName = interaction.options.getSubcommand(false);
        if (subcommandName) {
            const option = options[subcommandName];
            if (option instanceof SubSlashCommandOption) {
                command = option;
            } else {
                throw new UnknownCommandException();
            }
        }

        if (command instanceof SubSlashCommandGroupOption) {
            throw new UnknownCommandException();
        }

        return command;
    }
}
