import type { APIButtonComponentWithCustomId } from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { ButtonStyle, ComponentType } from "discord.js";
import { MatchService } from "@services/MatchService";
import { ParticipantModel } from "@models/championship/Participant";
import { ValidateWeaponsSelectionAction } from "./ValidateWeaponsSelectionAction";
import { ShowWeaponCategorySelectionAction } from "./ShowWeaponCategorySelectionAction";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { NotPlayerInMatchException } from "@exceptions/championship/NotPlayerInMatchException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { IntermediateModel } from "@decorators/database";

type ShowWeaponSelectionMenuActionProperties = WithoutModifiers<ShowWeaponSelectionMenuAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_SHOW_WEAPON_SELECTION_MENU, { allowMixed: true })
export class ShowWeaponSelectionMenuAction extends Action<"ACTION_SHOW_WEAPON_SELECTION_MENU"> {
    constructor(data: Partial<ShowWeaponSelectionMenuActionProperties>) {
        super({ ...data, __type: "ACTION_SHOW_WEAPON_SELECTION_MENU" });
    }

    protected override _getContext(
        client: BotClient,
        input: InputShowWeaponSelectionMenuAction,
        interaction: InteractionForAction<'cached'>
    ): ShowWeaponSelectionMenuActionExecutionContext {
        return new ShowWeaponSelectionMenuActionExecutionContext(client,ShowWeaponSelectionMenuAction, input, interaction);
    }
}

type InputShowWeaponSelectionMenuAction = InputAction<"ACTION_SHOW_WEAPON_SELECTION_MENU"> & { };
type InputShowWeaponSelectionMenuActionValidated = InputActionValidated<"ACTION_SHOW_WEAPON_SELECTION_MENU"> & { };

class ShowWeaponSelectionMenuActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputShowWeaponSelectionMenuAction, InputShowWeaponSelectionMenuActionValidated, "ACTION_SHOW_WEAPON_SELECTION_MENU"> {

    protected override async _checkActionValidity(): Promise<InputShowWeaponSelectionMenuActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId };
    }

    protected async _execute(this:ShowWeaponSelectionMenuActionExecutionContext<true>): Promise<void> {
        if (this._source.message.flags.has("Ephemeral")) {
            // We are navigating through the menu, we don't want to send new messages each time but just update the
            // previous one to offer a better user experience.
            await this._source.deferUpdate();
        } else {
            await this._source.deferReply({ ephemeral: true });
        }

        const participant = await ParticipantModel.findById(this._source.user.id);
        if (!participant) {
            throw new UserNotRegisteredException();
        }

        const match = await MatchService.instance.getMatchFromDiscordChannel(this._source.guildId, this._source.channelId);
        if (!match) {
            throw new UnknownMatchException();
        }

        const player = match.players.find( p => p.participantId === participant._id );
        if (!player) {
            throw new NotPlayerInMatchException();
        }

        const buttonToSelectWeapons: APIButtonComponentWithCustomId = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: "Modifier la sélection",
            custom_id: "dummy-id-0",
            disabled: !player.weapons.selectionIsUpdatable()
        };
        const action = new ShowWeaponCategorySelectionAction({ });
        this._client.actions.linkComponentToAction(buttonToSelectWeapons, action);

        const validationButton: APIButtonComponentWithCustomId = {
            type: ComponentType.Button,
            style: ButtonStyle.Success,
            custom_id: "dummy-validate-selection",
            label: "Valider la sélection",
            disabled: !player.weapons.selectionIsUpdatable()
        };
        const actionToValidate = new ValidateWeaponsSelectionAction({ });
        this._client.actions.linkComponentToAction(validationButton, actionToValidate);

        const data = MatchService.instance.buildPlayerMenu(
            player,
            "Tableau de bord",
            "Clique ci-dessous pour modifier ta sélection ou la valider",
            [
                {
                    type: ComponentType.ActionRow,
                    components: [buttonToSelectWeapons, validationButton]
                }
            ]
        );
        await this._source.editReply(data)
    }
}

getDiscriminatorModelForClass(ActionModel,ShowWeaponSelectionMenuAction, ACTION_CODES.ACTION_SHOW_WEAPON_SELECTION_MENU);
