import { ApplicationCommandOptionType, LocalizationMap } from "discord.js";

export abstract class SlashCommandOption<T extends ApplicationCommandOptionType = ApplicationCommandOptionType> {
    readonly type: T;

    readonly name: string;
    readonly nameLocalized?: LocalizationMap;

    readonly description: string;
    readonly descriptionLocalized?: LocalizationMap;


    protected constructor(type: T, name: string, nameLocalized: LocalizationMap | undefined, description: string, descriptionLocalized: LocalizationMap | undefined) {
        this.type = type;
        this.name = name;
        this.nameLocalized = nameLocalized;
        this.description = description;
        this.descriptionLocalized = descriptionLocalized;
    }
}
