import type { DocumentType } from "@typegoose/typegoose";
import type { BotClient } from "@models/BotClient";
import type { ActionCodes } from "@enums";
import type { ActionDocument } from "@models/action/Action";
import type { Action } from "@models/action/Action";
import { UnknownException } from "@exceptions/UnknownException";
import { ActionPropertyNotSerializableException } from "@exceptions/actions/ActionPropertyNotSerializableException";
import { InteractionButtonComponentData } from "discord.js";
import { DISCORD_COMPONENT_CUSTOM_ID_MAX_LENGTH } from "@constants";

export class ActionsManager {
    private readonly _cache: Partial<Record<ActionCodes, Record<string, ActionDocument>>>;

    constructor(private readonly client: BotClient) {
        this._cache = { };
    }

    public async delete<T extends Action>(action: DocumentType<T>) {
        const cache = this._cache[action.__type];
        if (cache) {
            delete cache[action._id.toString()];
        }

        await action.deleteOne();
    }

    public async linkComponentToAction<T extends Action>(action: T, component: InteractionButtonComponentData, nameMissingProperty?: string) {
        try {
            const customId = action.generateInteractionId(nameMissingProperty);
            if (customId.length > DISCORD_COMPONENT_CUSTOM_ID_MAX_LENGTH) {
                throw new UnknownException();
            }

            component.customId = customId;
        } catch (e) {
            if (e instanceof ActionPropertyNotSerializableException) {
                throw new UnknownException();
            } else {
                throw e;
            }
        }
    }
}
