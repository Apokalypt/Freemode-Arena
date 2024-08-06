import type { LocalizationMap, ApplicationCommandType } from "discord-api-types/v10";
import type { BotClient } from "@models/BotClient";
import type { InteractionFromCommandType } from "@bot-types";


export abstract class BaseCommand<T extends ApplicationCommandType = ApplicationCommandType> {
    readonly type: T;

    readonly name: string;
    readonly nameLocalized?: LocalizationMap;

    readonly description: string;
    readonly descriptionLocalized?: LocalizationMap;

    readonly defaultPermissions?: bigint;
    readonly allowInDM: boolean;

    readonly action: (client: BotClient, interaction: InteractionFromCommandType[T]) => Promise<void>;

    /**
     * Construct a new command. This function should only be used for local command since it instantiates some property
     * that are not needed for database commands.
     */
    protected constructor(
        type: T,
        name: string, nameLocalized: LocalizationMap | undefined,
        description: string, descriptionLocalized: LocalizationMap | undefined,
        action: (client: BotClient, interaction: InteractionFromCommandType[T]) => Promise<void>,
        defaultPermissions?: bigint,
        allowInDM: boolean = false,
    ) {
        this.type = type;
        this.name = name;
        this.nameLocalized = nameLocalized;
        this.description = description;
        this.descriptionLocalized = descriptionLocalized;
        this.action = action;

        this.defaultPermissions = defaultPermissions;
        this.allowInDM = allowInDM;
    }


    public async execute(client: BotClient, interaction: InteractionFromCommandType[T]): Promise<void> {
        return this.action(client, interaction);
    }

    public abstract build();
}
