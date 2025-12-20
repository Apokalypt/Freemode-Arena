import type { InteractionReplyOptions } from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass, Prop } from "@typegoose/typegoose";
import { MatchService } from "@services/MatchService";
import { ParticipantModel } from "@models/championship/Participant";
import { PropertyInjectableFromInteraction } from "@models/action/ActionPropertySerialization";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { UnknownException } from "@exceptions/UnknownException";
import { NotSupportedException } from "@exceptions/NotSupportedException";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { NotPlayerInMatchException } from "@exceptions/championship/NotPlayerInMatchException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { IntermediateModel } from "@decorators/database";
import { CHAMPIONSHIP_END_DATE } from "@constants";

type ShowWeaponsSelectionActionProperties = WithoutModifiers<ShowWeaponsSelectionAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_SHOW_WEAPONS_SELECTION, { allowMixed: true })
export class ShowWeaponsSelectionAction extends Action<"ACTION_SHOW_WEAPONS_SELECTION"> {
    @Prop({ type: String })
    categoryId?: string;

    constructor(data: Partial<ShowWeaponsSelectionActionProperties>) {
        super({ ...data, __type: "ACTION_SHOW_WEAPONS_SELECTION" });

        this.categoryId = data.categoryId;
    }

    protected override _getInput(): InputShowWeaponsSelectionAction {
        return { ...super._getInput(), categoryId: this.categoryId };
    }

    protected override _getContext(
        client: BotClient,
        input: InputShowWeaponsSelectionAction,
        interaction: InteractionForAction<'cached'>
    ): ShowWeaponsSelectionActionExecutionContext {
        return new ShowWeaponsSelectionActionExecutionContext(client,ShowWeaponsSelectionAction, input, interaction);
    }

    static override PROPERTIES_SERIALIZABLE_INTERACTION_ID() {
        return [
            ...super.PROPERTIES_SERIALIZABLE_INTERACTION_ID(),
            new PropertyInjectableFromInteraction({ name: "categoryId", onNull: null, onUndefined: "-" })
        ];
    }
}

type InputShowWeaponsSelectionAction = InputAction<"ACTION_SHOW_WEAPONS_SELECTION"> & { categoryId?: string };
type InputShowWeaponsSelectionActionValidated = InputActionValidated<"ACTION_SHOW_WEAPONS_SELECTION"> & { categoryId?: string };

class ShowWeaponsSelectionActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputShowWeaponsSelectionAction, InputShowWeaponsSelectionActionValidated, "ACTION_SHOW_WEAPONS_SELECTION"> {

    protected override async _checkActionValidity(): Promise<InputShowWeaponsSelectionActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId, categoryId: this.input.categoryId };
    }

    protected async _execute(this:ShowWeaponsSelectionActionExecutionContext<true>): Promise<void> {
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

        if (!player.weapons.selectionIsUpdatable()) {
            throw new InvalidPlayerStateException("Vous avez déjà validé votre sélection d'armes et ne pouvez plus la modifier!");
        }

        const categories = MatchService.instance.getWeaponsCategories();
        let hasOnlyOneCategory = categories.length === 1;
        const categoryIdSelected = this.input.categoryId;
        let categorySelected: undefined | typeof categories[0] = undefined;
        if (categoryIdSelected) {
            categorySelected = categories.find( c => c.id.toString() === categoryIdSelected );
            if (!categorySelected) {
                throw new UnknownException();
            }
        } else if (hasOnlyOneCategory) {
            categorySelected = categories[0];
        }

        let data: InteractionReplyOptions;
        if (categorySelected) {
            data = MatchService.instance.buildPlayerWeaponSelectionMenu(this._client, player, categorySelected);
        } else {
            data = MatchService.instance.buildPlayerCategorySelectionMenu(this._client, player);
        }
        await this._source.editReply(data);
    }
}

getDiscriminatorModelForClass(ActionModel,ShowWeaponsSelectionAction, ACTION_CODES.ACTION_SHOW_WEAPONS_SELECTION);
