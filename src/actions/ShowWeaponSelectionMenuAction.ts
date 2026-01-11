import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { MatchService } from "@services/MatchService";
import { ParticipantModel } from "@models/championship/Participant";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { NotSupportedException } from "@exceptions/NotSupportedException";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { NotPlayerInMatchException } from "@exceptions/championship/NotPlayerInMatchException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { IntermediateModel } from "@decorators/database";
import { CHAMPIONSHIP_END_DATE } from "@constants";

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

type InputShowWeaponSelectionMenuAction = InputAction<"ACTION_SHOW_WEAPON_SELECTION_MENU">;
type InputShowWeaponSelectionMenuActionValidated = InputActionValidated<"ACTION_SHOW_WEAPON_SELECTION_MENU">;

class ShowWeaponSelectionMenuActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputShowWeaponSelectionMenuAction, InputShowWeaponSelectionMenuActionValidated, "ACTION_SHOW_WEAPON_SELECTION_MENU"> {

    protected override async _checkActionValidity(): Promise<InputShowWeaponSelectionMenuActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId };
    }

    protected async _execute(this:ShowWeaponSelectionMenuActionExecutionContext<true>): Promise<void> {
        if (this._source.isChatInputCommand()) {
            throw new NotSupportedException();
        }

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

        await this._source.editReply(
            MatchService.instance.buildDashboardPlayerMenu(this._client, player)
        );
    }
}

getDiscriminatorModelForClass(ActionModel,ShowWeaponSelectionMenuAction, ACTION_CODES.ACTION_SHOW_WEAPON_SELECTION_MENU);
