import type {
    APIButtonComponentWithCustomId, InteractionButtonComponentData,
    APIStringSelectComponent, StringSelectMenuComponentData
} from "discord.js";
import type { Action } from "@models/action/Action";
import { UnknownException } from "@exceptions/UnknownException";
import { ActionPropertyNotSerializableException } from "@exceptions/actions/ActionPropertyNotSerializableException";
import { DISCORD_COMPONENT_CUSTOM_ID_MAX_LENGTH } from "@constants";

export class ActionsManager {
    public linkComponentToAction<T extends Action>(component: ComponentAllowed, action: T, nameMissingProperty?: string) {
        try {
            const customId = action.generateInteractionId(nameMissingProperty);
            if (customId.length > DISCORD_COMPONENT_CUSTOM_ID_MAX_LENGTH) {
                throw new UnknownException("The interaction ID generated is too long!");
            }

            if ("customId" in component) {
                component.customId = customId;
            } else {
                component.custom_id = customId;
            }
        } catch (e) {
            if (e instanceof ActionPropertyNotSerializableException) {
                throw new UnknownException("One or more property of the interaction aren't serializable in the interaction ID!");
            } else {
                throw e;
            }
        }
    }
}

type ComponentAllowed = APIButtonComponentWithCustomId
    | APIStringSelectComponent
    | StringSelectMenuComponentData
    | InteractionButtonComponentData;
