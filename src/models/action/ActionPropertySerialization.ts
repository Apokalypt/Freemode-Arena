type ParserFunction<CanBeMissing extends boolean> = CanBeMissing extends true ? (value: string | string[]) => unknown
    : (value: string) => unknown;

export type PropertySerializableInInteractionId = PropertyNotInjectableFromInteraction | PropertyInjectableFromInteraction;

class DefaultValuesSerializableInInteractionId {
    /**
     * Value used when the property is null, be sure that the value can't be equal to the one indicated here.
     * If the value is null, the property will refuse serialization if his value is null.
     * @default "-"
     */
    public readonly onNull: string | null;
    /**
     * Value used when the property is undefined, be sure that the value can't be equal to the one indicated here.
     * If the value is null, the property will refuse serialization if his value is undefined.
     * @default "."
     */
    public readonly onUndefined: string | null;

    public constructor(onNull: string | null = "-", onUndefined: string | null = ".") {
        if (onNull !== null && onNull === onUndefined) {
            throw new Error("The value onNull and onUndefined can't be equal");
        }

        if (onNull === null) {
            this.onNull = null;
        } else {
            this.onNull = onNull;
        }

        if (onUndefined === null) {
            this.onUndefined = null;
        } else {
            this.onUndefined = onUndefined;
        }
    }
}

abstract class BasePropertySerializableInInteractionId<CanBeMissing extends boolean = boolean> {
    /**
     * The name of the property in the class
     */
    readonly name: string;
    /**
     * Indicate if the value can be determined with the interaction data (values selected, text input, ...)
     */
    readonly canBeMissing: CanBeMissing;
    /**
     * The function used to stringify the value. If not provided, we will use the function "toString" of the value.
     */
    readonly stringify?: (value: unknown) => string;
    /**
     * Values used when the property is null or undefined
     */
    readonly values: DefaultValuesSerializableInInteractionId;

    /**
     * Function used to parse the value from the interaction data into the property value.
     */
    readonly parser?: ParserFunction<CanBeMissing>;

    protected constructor(data: ActionPropertyConstructorOptions<CanBeMissing>) {
        this.name = data.name;
        this.stringify = data.stringify;
        this.values = new DefaultValuesSerializableInInteractionId(data.onNull, data.onUndefined);
        this.canBeMissing = data.canBeMissing;
        this.parser = data.parser;
    }
}

export class PropertyNotInjectableFromInteraction extends BasePropertySerializableInInteractionId<false> {
    constructor(data: Omit<ActionPropertyConstructorOptions<false>, "canBeMissing">) {
        super({ ...data, canBeMissing: false });
    }
}
export class PropertyInjectableFromInteraction extends BasePropertySerializableInInteractionId<true> {
    constructor(data: Omit<ActionPropertyConstructorOptions<true>, "canBeMissing">) {
        super({ ...data, canBeMissing: true });
    }
}

interface ActionPropertyConstructorOptions<CanBeMissing extends boolean = boolean> {
    name: string;
    canBeMissing: CanBeMissing;
    parser?: ParserFunction<CanBeMissing>;
    stringify?: (value: any) => string;
    onNull?: string | null;
    onUndefined?: string | null;
}
