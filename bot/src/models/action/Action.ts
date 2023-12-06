import type {
    APISelectMenuOption,
    BaseMessageOptions,
    Collection,
    Guild,
    GuildMember,
    InteractionReplyOptions,
    InteractionResponse,
    RepliableInteraction,
    Snowflake,
    User
} from "discord.js";
import type { APIActionRowComponent, APIModalActionRowComponent, } from "discord-api-types/payloads/v10/channel";
import type { BotClient } from "@models/BotClient";
import type { ActionCodes } from "@enums";
import type { WithoutModifiers, Nullish } from "@bot-types";
import {
    ButtonStyle,
    ComponentType,
    MappedInteractionTypes,
    Message,
    MessageComponentType,
    TextInputStyle
} from "discord.js";
import { v4 } from "uuid";
import { Types } from "mongoose";
import { getModelForClass, Prop } from "@typegoose/typegoose";
import { Model, RequiredProp } from "@decorators/database";
import {
    PropertyInjectableFromInteraction,
    PropertySerializableInInteractionId
} from "@models/action/ActionPropertySerialization";
import { NotSupportedException } from "@exceptions/NotSupportedException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { UnknownActionException } from "@exceptions/actions/UnknownActionException";
import { NoAnswerActionException } from "@exceptions/actions/NoAnswerActionException";
import { ActionNotSerializableException } from "@exceptions/actions/ActionNotSerializableException";
import { CantAskInformationActionException } from "@exceptions/actions/CantAskInformationActionException";
import { ActionPropertyNotSerializableException } from "@exceptions/actions/ActionPropertyNotSerializableException";
import { COLOR_INFO, MINUTE_IN_MS, SEPARATOR_PROPERTY_INTERACTION_ID } from "@constants";
import { ACTION_CODES, DATABASE_COLLECTIONS, DATABASE_MODELS, SHORT_ACTION_CODES } from "@enums";

@Model(DATABASE_COLLECTIONS.ACTIONS, DATABASE_MODELS.ACTIONS, { discriminatorKey: "__type" })
export class Action<Type extends ActionCodes = ActionCodes> {
    static PROPERTIES_SERIALIZABLE_INTERACTION_ID(): PropertySerializableInInteractionId[] {
        return [];
    }


    /**
     * The type of the action, this is the mongoose discriminator key.
     */
    readonly __type!: Type;

    /**
     * Id of the guild where the action was created.
     */
    @Prop({ type: String })
    readonly guildId?: Snowflake;
    /**
     * Id of the user who created the action. The target and the executor can be the same
     */
    @Prop({ type: String })
    readonly executorId?: Snowflake;
    /**
     * Boolean to indicate if the action should be removed from the database after being executed.
     */
    @RequiredProp({ type: Boolean, default: true })
    readonly once?: boolean;

    // Property managed by mongoose
    readonly _id!: Types.ObjectId;

    public constructor(data: Partial<WithoutModifiers<Action<Type>>> & { __type: Type }) {
        this.__type = data.__type;
        this.guildId = data.guildId;
        this.executorId = data.executorId;
        this.once = data.once;
    }

    public async startFromObject(client: BotClient, source: RepliableInteraction): Promise<void> {
        return this._execute(client, source);
    }

    public static fromInteractionId(interaction: RepliableInteraction): Action {
        if (!interaction.isMessageComponent()) {
            throw new ActionNotSerializableException();
        }

        const elements = interaction.customId.split(SEPARATOR_PROPERTY_INTERACTION_ID);
        const properties = this.PROPERTIES_SERIALIZABLE_INTERACTION_ID();

        let missingPropertyName: string | undefined;
        if (elements.length !== properties.length + 1) {
            // When we fall here it means that the interaction id could be valid ONLY if the action has a missing property
            // that will be determined by the interaction value
            if (elements.length !== properties.length + 2 || !interaction.isAnySelectMenu()) {
                throw new UnknownActionException();
            } else {
                missingPropertyName = elements.shift();
            }
        }

        const data: Partial<WithoutModifiers<Action>> & { __type: ActionCodes } = {
            __type: elements.shift() as ActionCodes,
        };
        for (const property of properties) {
            const propertyParser = (value: string) => property.parser?.(value) ?? value;

            if (property.name !== missingPropertyName) {
                const element = elements.shift() ?? "";
                if (element === property.values.onUndefined) {
                    data[property.name] = undefined;
                } else if (element === property.values.onNull) {
                    data[property.name] = null;
                } else {
                    data[property.name] = propertyParser(element);
                }
            }
        }

        return new this(data);
    }
    public generateInteractionId(missingPropertyName?: string): string {
        const ActionClass = this.constructor as typeof Action;
        const properties = ActionClass.PROPERTIES_SERIALIZABLE_INTERACTION_ID();

        const elements: (number | string)[] = [];
        if (missingPropertyName) {
            elements.push(missingPropertyName);
        }
        elements.push(SHORT_ACTION_CODES[this.__type]);

        const propertiesDefined = new Set<string>();
        Object.entries(this).forEach(([key, value]) => {
            if (value != null && key !== "once" && key !== "__type") {
                propertiesDefined.add(key);
            }
        });

        let foundMissingProperty = !missingPropertyName;
        for (const property of properties) {
            if (property.name === missingPropertyName) {
                if (foundMissingProperty) {
                    throw new InvalidActionException(
                        "La définition de l'action à réaliser est invalide. La propriété manquante est définie " +
                        "plusieurs fois."
                    );
                }

                foundMissingProperty = true;
                elements.push("");
                continue;
            }

            const value = this[property.name];
            let serializedValue: Nullish<string>;
            if (value === undefined) {
                serializedValue = property.values.onUndefined;
            } else if (value === null) {
                serializedValue = property.values.onNull;
            } else {
                serializedValue = property.stringify?.(value) ?? value?.toString();
            }

            if (serializedValue == null) {
                throw new ActionPropertyNotSerializableException(property.name);
            }

            elements.push(serializedValue);
            propertiesDefined.delete(property.name);
        }

        if (!foundMissingProperty) {
            throw new InvalidActionException("La définition de l'action à réaliser est invalide. La propriété manquante n'est pas définie.");
        }
        if (propertiesDefined.size > 0) {
            throw new ActionPropertyNotSerializableException(propertiesDefined.values().next().value);
        }

        return elements.join(SEPARATOR_PROPERTY_INTERACTION_ID);
    }


    private async _execute(client: BotClient, source: RepliableInteraction) {
        const context = this._getContext(client, this._getInput(), source);
        await context.process();
    }

    protected _getInput(): InputAction<Type> {
        return {
            guildId: this.guildId,
            executorId: this.executorId,
            once: this.once ?? true,
            __type: this.__type
        };
    }

    protected _getContext(
        _client: BotClient,
        _input: InputAction<Type>,
        _source: RepliableInteraction
    ): ActionExecutionContext<false, InputAction<Type>, InputActionValidated<Type>, Type> {
        throw new NotSupportedException();
    }
}
export const ActionModel = getModelForClass(Action);


export type InputAction<Code extends ActionCodes> = {
    guildId?: Snowflake;
    executorId?: Snowflake;
    once: boolean;
    __type: Code;
};

export type InputActionValidated<Code extends ActionCodes> = {
    guildId?: Snowflake;
    executorId: Snowflake;
    once: boolean;
    __type: Code;
}



export abstract class ActionExecutionContext<
    IsValidated extends true | false,
    Input extends InputAction<Code>,
    InputValidated extends InputAction<Code>,
    Code extends ActionCodes
> {
    executed = false;

    protected _interaction: RepliableInteraction;

    public get __type(): Code {
        return this.input.__type;
    }

    public constructor(
        protected readonly _client: BotClient,
        protected readonly _action: typeof Action<Code>,
        public readonly input: IsValidated extends true ? InputValidated : Input,
        protected readonly _source: RepliableInteraction
    ) {
        this._interaction = this._source;
    }

    public async process() {
        this._injectDataFromInteraction();

        await this._checkActionValidity();
        return (this as ActionExecutionContext<true, Input, InputValidated, Code>)._execute()
            .then( () => {
                this.executed = true;
            });
    }

    private _injectDataFromInteraction() {
        if (this._interaction.isModalSubmit()) {
            return;
        }

        this.input.guildId = this._interaction.guildId ?? this.input.guildId;
        this.input.executorId = this._interaction.user.id ?? this.input.executorId;

        if (this._interaction.isAnySelectMenu()) {
            const propertyMissing = this._interaction.customId.split(SEPARATOR_PROPERTY_INTERACTION_ID)[0];
            if (!propertyMissing || ACTION_CODES[propertyMissing]) {
                return;
            }

            let missingPropertyDefinition: PropertyInjectableFromInteraction | undefined;
            for (const property of this._action.PROPERTIES_SERIALIZABLE_INTERACTION_ID()) {
                if (!property.canBeMissing || property.name !== propertyMissing) {
                    continue;
                }

                missingPropertyDefinition = property;
                break;
            }

            if (!missingPropertyDefinition) {
                throw new InvalidActionException("Impossible de construire l'action à partir de l'interaction...");
            }

            this.input[missingPropertyDefinition.name] = missingPropertyDefinition.parser?.(this._interaction.values) ?? this._interaction.values[0];
        }
    }

    protected async _checkActionValidity(): Promise<InputActionValidated<Code>> {
        if (!this.input.executorId) {
            throw new InvalidActionException("Impossible de déterminer l'utilisateur qui fait l'action...");
        }

        return {
            executorId: this.input.executorId,
            guildId: this.input.guildId,
            once: this.input.once,
            __type: this.input.__type
        };
    }

    protected abstract _execute(this: ActionExecutionContext<true, Input, InputValidated, Code>): Promise<void>;


    protected async _getGuild(cantBeUndefined: true): Promise<Guild>;
    protected async _getGuild(cantBeUndefined?: boolean): Promise<Guild | undefined>;
    protected async _getGuild(cantBeUndefined = true): Promise<Guild | undefined> {
        if (!this.input.guildId) {
            if (cantBeUndefined) {
                throw new InvalidActionException("Impossible de déterminer le serveur concerné par l'action qui doit être effectuée...");
            }

            return undefined;
        }

        return this._client.discord.guilds.fetch(this.input.guildId)
            .catch(() => {
                throw new InvalidActionException("Impossible de déterminer le serveur concerné par l'action qui doit être effectuée...");
            });
    }

    protected async _getExecutorMember(cantBeUndefined: true): Promise<GuildMember>;
    protected async _getExecutorMember(cantBeUndefined?: boolean): Promise<GuildMember | undefined>;
    protected async _getExecutorMember(cantBeUndefined = true): Promise<GuildMember | undefined> {
        if (!this.input.executorId) {
            if (cantBeUndefined) {
                throw new InvalidActionException("Impossible de déterminer l'utilisateur qui fait l'action...");
            }

            return undefined;
        }

        const guild = await this._getGuild(cantBeUndefined);
        if (!guild) {
            return undefined;
        }

        return guild.members.fetch(this.input.executorId)
            .catch(() => {
                if (cantBeUndefined) {
                    throw new InvalidActionException("Impossible de déterminer l'utilisateur qui fait l'action...");
                }

                return undefined;
            });

    }

    protected async _deferAnswer() {
        return this._interaction.deferReply({ ephemeral: true })
            .catch( _ => null );
    }

    protected async _answer(content: BaseMessageOptions & { ephemeral?: boolean }) {
        return this._client.utils.sendInteractionAnswer(this._interaction, content);
    }

    protected async _askForBinaryChoice(messageContent: string, labels?: BinaryChoiceLabels): Promise<boolean> {
        const idNo = `local-${v4()}-no`;
        const idYes = `local-${v4()}-tes`;

        const messageData: BaseMessageOptions & { ephemeral: true } = {
            content: messageContent,
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Danger,
                            label: labels?.no ?? "Non",
                            custom_id: idNo
                        },
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Success,
                            label: labels?.yes ?? "Oui",
                            custom_id: idYes
                        }
                    ]
                }
            ],
            ephemeral: true
        };

        const [interaction, message, result] = await this._askInformationFromComponent(messageData, { componentType: ComponentType.Button })
            .catch( err => {
                if (err instanceof CantAskInformationActionException) {
                    return [undefined, undefined, undefined];
                }

                throw err;
            });
        if (interaction === undefined || message === undefined || result === undefined) {
            return true;
        }

        this._resetInteractionMessage(
            interaction,
            message,
            { embeds: [{ description: messageContent, fields: [{ name: "Choix", value: result.component.label ?? "??" }], color: COLOR_INFO }] }
        );

        return result.customId === idYes;
    }

    protected async _askForStringSelection(data: AskSelectionData & { minNumberOfOptions: 0; maxNumberOfOptions: 1 }): Promise<string | null>
    protected async _askForStringSelection(data: AskSelectionData & { minNumberOfOptions?: 1; maxNumberOfOptions: 1 }): Promise<string>
    protected async _askForStringSelection(data: AskSelectionData & { minNumberOfOptions: 0; maxNumberOfOptions?: number }): Promise<string[] | null>
    protected async _askForStringSelection(data: AskSelectionData & { maxNumberOfOptions?: number }): Promise<string[]>
    protected async _askForStringSelection(data: AskSelectionData): Promise<string | string[] | null> {
        const uid = v4();
        const messageData: BaseMessageOptions & { ephemeral: true } = {
            embeds: [
                { title: data.title, description: data.description, color: COLOR_INFO }
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.StringSelect,
                            custom_id: `local-${uid}-select`,
                            options: data.options,
                            placeholder: data.placeholder ?? "Choisissez une option",
                            min_values: data.minNumberOfOptions ?? 1,
                            max_values: data.maxNumberOfOptions ?? data.options.length
                        }
                    ]
                }
            ],
            ephemeral: true
        };
        if (data.minNumberOfOptions === 0) {
            messageData.components?.push({
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Primary,
                        label: "Aucune des options",
                        custom_id: `local-${uid}-button`
                    }
                ]
            });
        }

        const [interaction, message, result] = await this._askInformationFromComponent(messageData);
        if (result.isStringSelectMenu()) {
            this._resetInteractionMessage(
                interaction,
                message,
                {
                    embeds: [{
                        title: data.title,
                        description: data.description,
                        color: COLOR_INFO,
                        fields: [{ name: "Choix", value: result.values.join(", ") }]
                    }]
                }
            );

            return data.maxNumberOfOptions === 1 ? result.values[0] : result.values;
        } else {
            this._resetInteractionMessage(
                interaction,
                message,
                { embeds: [{ title: data.title, description: data.description, color: COLOR_INFO, fields: [{ name: "Choix", value: "*Aucun*" }] }] }
            );

            return null;
        }
    }

    protected async _askForIntegerSelection(data: AskSelectionData & { minNumberOfOptions: 0; maxNumberOfOptions: 1 }): Promise<number | null>
    protected async _askForIntegerSelection(data: AskSelectionData & { minNumberOfOptions?: 1; maxNumberOfOptions: 1 }): Promise<number>
    protected async _askForIntegerSelection(data: AskSelectionData & { minNumberOfOptions: 0; maxNumberOfOptions?: number }): Promise<number[] | null>
    protected async _askForIntegerSelection(data: AskSelectionData & { maxNumberOfOptions?: number }): Promise<number[]>
    protected async _askForIntegerSelection(data: AskSelectionData): Promise<number | number[] | null> {
        return this._askForStringSelection(data)
            .then( values => {
                if (values === null) {
                    return null;
                }

                if (Array.isArray(values)) {
                    return values.map( v => Number(v) );
                } else {
                    return Number(values);
                }
            });
    }

    protected async _askForUserSelection(data: BaseAskSelectionData & { minNumberOfOptions: 0; maxNumberOfOptions?: 1 }): Promise<User | null>
    protected async _askForUserSelection(data: BaseAskSelectionData & { minNumberOfOptions?: 1; maxNumberOfOptions?: 1 }): Promise<User>
    protected async _askForUserSelection(
        data: BaseAskSelectionData & { minNumberOfOptions: 0; maxNumberOfOptions: number }
    ): Promise<Collection<Snowflake, User> | null>
    protected async _askForUserSelection(data: BaseAskSelectionData & { maxNumberOfOptions: number }): Promise<Collection<Snowflake, User>>
    protected async _askForUserSelection(data: BaseAskSelectionData): Promise<User | Collection<Snowflake, User> | null> {
        const uid = v4();
        const messageData: BaseMessageOptions & { ephemeral: true } = {
            embeds: [
                { title: data.title, description: data.description, color: COLOR_INFO }
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.UserSelect,
                            custom_id: `local-${uid}-select`,
                            placeholder: data.placeholder ?? "Choisissez une option",
                            min_values: data.minNumberOfOptions ?? 1,
                            max_values: data.maxNumberOfOptions
                        }
                    ]
                }
            ],
            ephemeral: true
        };
        if (data.minNumberOfOptions === 0) {
            messageData.components?.push({
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        style: ButtonStyle.Secondary,
                        label: "Impossible de trouver l'utilisateur",
                        custom_id: `local-${uid}-button`
                    }
                ]
            });
        }

        const [interaction, message, result] = await this._askInformationFromComponent(messageData, { duration: 3 * MINUTE_IN_MS });
        if (result.isUserSelectMenu()) {
            this._resetInteractionMessage(
                interaction,
                message,
                {
                    embeds: [{
                        title: data.title,
                        description: data.description,
                        color: COLOR_INFO,
                        fields: [{ name: "Choix", value: result.users.map( u => u.toString() ).join(", ") }]
                    }]
                }
            );

            return data.maxNumberOfOptions === 1 ? result.users.first()! : result.users;
        } else {
            this._resetInteractionMessage(
                interaction,
                message,
                {
                    embeds: [{ title: data.title, description: data.description, color: COLOR_INFO, fields: [{ name: "Choix", value: "*Aucun*" }] }]
                }
            );

            return null;
        }
    }

    protected async _askForText<T extends TextInputAskedData>(title: string, input: T): Promise<T["required"] extends true ? string : string | null> {
        return this._askForMultiText(title, { input })
            .then( result => result.input );
    }

    protected async _askForMultiText<I extends MultiTextAsked = MultiTextAsked>(title: string, inputs: I): Promise<MultiTextAskedOutput<I>> {
        const interaction = this._interaction;
        if (!interaction || interaction.isModalSubmit()) {
            throw new CantAskInformationActionException();
        }

        const components: APIActionRowComponent<APIModalActionRowComponent>[] = [];
        const keys: string[] = [];
        for (const [key, value] of Object.entries(inputs)) {
            keys.push(key);
            components.push({
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        label: value.title,
                        placeholder: value.placeholder ?? "Saisissez votre réponse ici...",
                        custom_id: key,
                        value: value.default,
                        style: value.style ?? TextInputStyle.Paragraph,
                        required: value.required ?? false,
                        min_length: value.minLength,
                        max_length: value.maxLength
                    }
                ]
            });
        }

        const uid = v4();
        await interaction.showModal({ custom_id: `local-${uid}`, title, components });

        const modal = await interaction.awaitModalSubmit({
            time: 5 * MINUTE_IN_MS,
            filter: (i) => i.user.id === interaction.user.id && i.customId === `local-${uid}`
        }).catch(() => {
            throw new NoAnswerActionException();
        });

        this._interaction = modal;

        const result = { } as MultiTextAskedOutput<I>;
        for (const key of keys) {
            // @ts-ignore
            result[key] = modal.fields.getTextInputValue(key);
        }

        return result;
    }


    private async _askInformationFromComponent<T extends MessageComponentType>(
        data: InteractionReplyOptions,
        options: { duration?: number; componentType?: T } = { duration: MINUTE_IN_MS }
    ): Promise<[RepliableInteraction, InteractionResponse | Message, MappedInteractionTypes[T]]> {
        const oldInteraction = this._interaction;
        if (!oldInteraction) {
            throw new CantAskInformationActionException();
        }

        const ids = data.components?.map( c => {
            if (!("components" in c)) {
                return [];
            }

            return c.components?.map( c => c.custom_id );
        })
            .flat()
            .filter( c => c ) ?? [];

        const message = await this._client.utils.sendInteractionAnswer(oldInteraction, data);
        const interaction = await message.awaitMessageComponent({
            filter: (i) => i.user.id === oldInteraction.user.id && ids.includes(i.customId),
            componentType: options.componentType,
            time: options.duration ?? MINUTE_IN_MS
        })
            .then( i => {
                this._interaction = i;
                return i;
            })
            .catch( () => null );

        if (!interaction) {
            this._deleteInteractionResponse(oldInteraction, message);
            throw new NoAnswerActionException();
        }

        return [oldInteraction, message, interaction];
    }

    private _resetInteractionMessage(interaction: RepliableInteraction, message: InteractionResponse | Message, data: BaseMessageOptions): void {
        const finalData = {
            content: data.content ?? "",
            components: data.components ?? [],
            embeds: data.embeds ?? []
        };

        interaction.editReply(finalData).catch( () => { /* Ignore */ } );
    }

    private _deleteInteractionResponse(interaction: RepliableInteraction, message: InteractionResponse | Message): void {
        if (message instanceof Message) {
            message.delete().catch( () => { /* Ignore */ });
        } else {
            interaction.deleteReply().catch( () => { /* Ignore */ });
        }
    }
}

interface BaseAskSelectionData {
    title: string;
    description: string;
    placeholder?: string;
    minNumberOfOptions?: number;
    maxNumberOfOptions?: number;
}
interface AskSelectionData extends BaseAskSelectionData {
    options: APISelectMenuOption[];
}

export type TextInputAskedData = {
    title: string;
    placeholder?: string;
    required?: boolean;
    style?: TextInputStyle;
    minLength?: number; maxLength?: number;
    default?: string;
};
type MultiTextAsked = Record<string, TextInputAskedData>;
type MultiTextAskedOutput<T extends MultiTextAsked> = {
    [K in keyof T]: T[K]["required"] extends true ? string : string | null;
};

interface BinaryChoiceLabels { yes: string; no: string }
