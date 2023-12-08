import type { APIButtonComponentWithCustomId, APIStringSelectComponent } from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { ButtonStyle, ComponentType } from "discord.js";
import { MatchService } from "@services/MatchService";
import { ParticipantModel } from "@models/championship/Participant";
import { ShowWeaponsSelectionAction } from "./ShowWeaponsSelectionAction";
import { ShowWeaponSelectionMenuAction } from "./ShowWeaponSelectionMenuAction";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { NotPlayerInMatchException } from "@exceptions/championship/NotPlayerInMatchException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { IntermediateModel } from "@decorators/database";

type ShowWeaponCategorySelectionActionProperties = WithoutModifiers<ShowWeaponCategorySelectionAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_SHOW_WEAPON_CATEGORY_SELECTION, { allowMixed: true })
export class ShowWeaponCategorySelectionAction extends Action<"ACTION_SHOW_WEAPON_CATEGORY_SELECTION"> {
    constructor(data: Partial<ShowWeaponCategorySelectionActionProperties>) {
        super({ ...data, __type: "ACTION_SHOW_WEAPON_CATEGORY_SELECTION" });
    }

    protected override _getContext(
        client: BotClient,
        input: InputShowWeaponCategorySelectionAction,
        interaction: InteractionForAction<'cached'>
    ): ShowWeaponCategorySelectionActionExecutionContext {
        return new ShowWeaponCategorySelectionActionExecutionContext(client,ShowWeaponCategorySelectionAction, input, interaction);
    }
}

type InputShowWeaponCategorySelectionAction = InputAction<"ACTION_SHOW_WEAPON_CATEGORY_SELECTION"> & { };
type InputShowWeaponCategorySelectionActionValidated = InputActionValidated<"ACTION_SHOW_WEAPON_CATEGORY_SELECTION"> & { };

class ShowWeaponCategorySelectionActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputShowWeaponCategorySelectionAction, InputShowWeaponCategorySelectionActionValidated, "ACTION_SHOW_WEAPON_CATEGORY_SELECTION"> {

    protected override async _checkActionValidity(): Promise<InputShowWeaponCategorySelectionActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId };
    }

    protected async _execute(this:ShowWeaponCategorySelectionActionExecutionContext<true>): Promise<void> {
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

        const weapons = MatchService.instance.getWeaponsCategories();

        const categorySelectMenu: APIStringSelectComponent = {
            type: ComponentType.StringSelect,
            custom_id: "dummy",
            placeholder: "Clique ici pour sélectionner une catégorie d'arme",
            min_values: 1,
            max_values: 1,
            options: weapons.map( category => ({
                label: category.name,
                value: category.id.toString(),
            }) )
        };
        const action = new ShowWeaponsSelectionAction({ });
        this._client.actions.linkComponentToAction(categorySelectMenu, action, "categoryId");

        const backToHomeMenuButton: APIButtonComponentWithCustomId = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: "dummy-back-to-categories",
            label: "Retour au menu principal"
        };
        const actionToBackToHomeMenu = new ShowWeaponSelectionMenuAction({ });
        this._client.actions.linkComponentToAction(backToHomeMenuButton, actionToBackToHomeMenu);

        const data = MatchService.instance.buildPlayerMenu(
            player,
            "Menu - Catégories d'armes",
            "Clique ci-dessous pour sélectionner la catégorie de l'arme à ajouter/retirer",
            [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        categorySelectMenu
                    ]
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        backToHomeMenuButton
                    ]
                }
            ]
        );
        await this._source.editReply(data);
    }
}

getDiscriminatorModelForClass(ActionModel,ShowWeaponCategorySelectionAction, ACTION_CODES.ACTION_SHOW_WEAPON_CATEGORY_SELECTION);
