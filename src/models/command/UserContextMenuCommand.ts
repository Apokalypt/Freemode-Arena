import type { UserContextMenuCommandInteraction } from "discord.js";
import type { BotClient } from "@models/BotClient";
import { ApplicationCommandType, ContextMenuCommandBuilder, LocalizationMap } from "discord.js";
import { BaseCommand } from "@models/command/BaseCommand";

export class UserContextMenuCommand extends BaseCommand<ApplicationCommandType.User> {
    constructor(
        name: string, nameLocalized: LocalizationMap | undefined,
        description: string, descriptionLocalized: LocalizationMap | undefined,
        action: (this: UserContextMenuCommand, client: BotClient, interaction: UserContextMenuCommandInteraction) => Promise<void>,
        defaultPermissions?: bigint,
        allowInDm?: boolean
    ) {
        super(ApplicationCommandType.User, name, nameLocalized, description, descriptionLocalized, action, defaultPermissions, allowInDm);
    }


    public build() {
        return new ContextMenuCommandBuilder()
            .setType(this.type)
            .setName(this.name)
            .setNameLocalizations(this.nameLocalized ?? null)
            .setDefaultMemberPermissions(this.defaultPermissions ?? null)
            .setDMPermission(this.allowInDM)
            .toJSON();
    }
}
