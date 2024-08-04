import type { SubSlashCommandOption } from "@models/command/options/executable/SubSlashCommandOption";
import type { SubSlashCommandGroupOption } from "@models/command/options/executable/SubSlashCommandGroupOption";
import type { SlashCommandOptionValuable } from "@models/command/options/valuable/SlashCommandOptionValuable";

export type SubSlashCommand<O extends Record<string, SlashCommandOptionValuable> = any> = SubSlashCommandOption<O> | SubSlashCommandGroupOption<O>
