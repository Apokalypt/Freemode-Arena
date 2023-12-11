import type {
    ArrayPropOptions,
    BasePropOptions,
    ICustomOptions,
    MapPropOptions,
    PropOptionsForNumber,
    PropOptionsForString
} from "@typegoose/typegoose/lib/types";
import type { SchemaOptions } from "mongoose";
import type { DatabaseCollections, DatabaseModels } from "@enums";
import { modelOptions, prop, Severity, PropType } from "@typegoose/typegoose";

type RequiredPropOptions = BasePropOptions | ArrayPropOptions | MapPropOptions | PropOptionsForNumber | PropOptionsForString;

export function RequiredProp(options: Omit<RequiredPropOptions, "required">, kind?: PropType) {
    return prop({ ...options, required: true }, kind);
}

export function EmbeddedModel(options?: { timestamps?: boolean, allowMixed?: boolean }): ClassDecorator {
    const schemaOptions: SchemaOptions = { _id: false, timestamps: options?.timestamps ?? false };
    if (options?.allowMixed) {
        schemaOptions.minimize = false;
    }

    const typegooseOptions: ICustomOptions = { };
    if (options?.allowMixed) {
        typegooseOptions.allowMixed = Severity.ALLOW;
    }

    return modelOptions({ schemaOptions, options: typegooseOptions });
}

interface BaseModelOptions {
    /**
     * Name of the property used for the model's discriminator.
     * @default undefined
     */
    discriminatorKey?: string;
    /**
     * Name of the property used for the model's version.
     * @default undefined
     */
    versionKey?: string;
    /**
     * Whether to allow mixed types in the model.
     * @default undefined
     */
    allowMixed?: boolean;
}
export function Model(collectionName: DatabaseCollections, modelName: DatabaseModels, options?: BaseModelOptions): ClassDecorator {
    const schemaOptions: SchemaOptions = {
        collection: collectionName,
        timestamps: { createdAt: true, updatedAt: true },
        versionKey: options?.versionKey ?? false
    };
    if (options?.discriminatorKey) {
        schemaOptions.discriminatorKey = options.discriminatorKey;
    }

    const typegooseOptions: ICustomOptions = { customName: modelName, automaticName: false };
    if (options?.allowMixed) {
        typegooseOptions.allowMixed = Severity.ALLOW;
    }

    return modelOptions({ schemaOptions, options: typegooseOptions });
}

export function IntermediateModel(modelName: DatabaseModels, options?: { allowMixed: boolean }): ClassDecorator {
    return modelOptions({
        options: {
            customName: modelName,
            automaticName: false,
            enableMergeHooks: true,
            allowMixed: options?.allowMixed ? Severity.ALLOW : undefined
        }
    });
}

export function RefProp(options: { ref: DatabaseModels, localField?: string, foreignField: string }): PropertyDecorator {
    return prop({
        ref: options.ref,
        foreignField: options.foreignField,
        localField: options.localField ?? "_id",
        match: doc => ({ guildId: doc.guildId })
    }, PropType.ARRAY);
}
