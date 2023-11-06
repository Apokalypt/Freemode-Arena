import type { ApplicationCommandOptionType, CacheType, CommandInteractionOption, GuildMember } from "discord.js";

export type ValueTypeFromCommandOptionType<Cached extends CacheType = CacheType> = {
    [ApplicationCommandOptionType.String]: string;
    [ApplicationCommandOptionType.Integer]: number;
    [ApplicationCommandOptionType.Number]: number;
    [ApplicationCommandOptionType.Boolean]: boolean;
    [ApplicationCommandOptionType.User]: GuildMember | NonNullable<CommandInteractionOption<Cached>['user']>;
    [ApplicationCommandOptionType.Channel]: NonNullable<CommandInteractionOption<Cached>['channel']>;
    [ApplicationCommandOptionType.Role]: NonNullable<CommandInteractionOption<Cached>['role']>;
    [ApplicationCommandOptionType.Mentionable]: NonNullable<CommandInteractionOption<Cached>['member' | 'role' | 'user']>;
    [ApplicationCommandOptionType.Attachment]: NonNullable<CommandInteractionOption<Cached>['attachment']>;

    [ApplicationCommandOptionType.Subcommand]: never;
    [ApplicationCommandOptionType.SubcommandGroup]: never;
}
