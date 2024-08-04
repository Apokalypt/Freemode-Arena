import type {
    APIButtonComponentWithCustomId,
    APIStringSelectComponent,
} from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass, Prop, PropType } from "@typegoose/typegoose";
import { ButtonStyle, ComponentType } from "discord.js";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { IntermediateModel, RequiredProp } from "@decorators/database";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { ParticipantModel } from "@models/championship/Participant";
import { MatchService } from "@services/MatchService";
import {
    PropertyInjectableFromInteraction,
    PropertyNotInjectableFromInteraction
} from "@models/action/ActionPropertySerialization";
import { ShowWeaponCategorySelectionAction } from "./ShowWeaponCategorySelectionAction";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { NotPlayerInMatchException } from "@exceptions/championship/NotPlayerInMatchException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { CHAMPIONSHIP_END_DATE } from "@constants";

type UpdateWeaponsSelectionActionProperties = WithoutModifiers<UpdateWeaponsSelectionAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_UPDATE_WEAPONS_SELECTION, { allowMixed: true })
export class UpdateWeaponsSelectionAction extends Action<"ACTION_UPDATE_WEAPONS_SELECTION"> {
    @RequiredProp({ type: String })
    categoryId!: string;
    @Prop({ type: String }, PropType.ARRAY)
    weaponIds?: string[];

    constructor(data: Partial<UpdateWeaponsSelectionActionProperties>) {
        super({ ...data, __type: "ACTION_UPDATE_WEAPONS_SELECTION" });

        this.categoryId = data.categoryId!;
        this.weaponIds = data.weaponIds;
    }

    protected override _getContext(
        client: BotClient,
        input: InputUpdateWeaponsSelectionAction,
        interaction: InteractionForAction<'cached'>
    ): UpdateWeaponsSelectionActionExecutionContext {
        return new UpdateWeaponsSelectionActionExecutionContext(client,UpdateWeaponsSelectionAction, input, interaction);
    }

    protected override _getInput(): InputUpdateWeaponsSelectionAction {
        return { ...super._getInput(), categoryId: this.categoryId, weaponIds: this.weaponIds };
    }

    static override PROPERTIES_SERIALIZABLE_INTERACTION_ID() {
        return [
            ...super.PROPERTIES_SERIALIZABLE_INTERACTION_ID(),
            new PropertyNotInjectableFromInteraction({
                name: "categoryId",
                parser: (value: string | string[]) => {
                    if (Array.isArray(value)) {
                        if (value.length !== 1) {
                            throw new InvalidActionException("Impossible de convertir l'ID de l'interaction");
                        }

                        return value[0];
                    } else {
                        return value;
                    }
                },
                onNull: null,
                onUndefined: null
            }),
            new PropertyInjectableFromInteraction({
                name: "weaponIds",
                parser: (value: string | string[]): string[] => {
                    if (Array.isArray(value)) {
                        return value;
                    } else {
                        return [value];
                    }
                },
                onNull: null,
                onUndefined: null
            })
        ];
    }
}

type InputUpdateWeaponsSelectionAction = InputAction<"ACTION_UPDATE_WEAPONS_SELECTION"> & { categoryId?: string, weaponIds?: string[] };
type InputUpdateWeaponsSelectionActionValidated = InputActionValidated<"ACTION_UPDATE_WEAPONS_SELECTION"> & { categoryId: string, weaponIds: string[] };

class UpdateWeaponsSelectionActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputUpdateWeaponsSelectionAction, InputUpdateWeaponsSelectionActionValidated, "ACTION_UPDATE_WEAPONS_SELECTION"> {

    protected override async _checkActionValidity(): Promise<InputUpdateWeaponsSelectionActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        if (!this.input.categoryId) {
            throw new InvalidActionException("Vous devez sélectionner une catégorie d'arme.");
        }
        if (!this.input.weaponIds) {
            throw new InvalidActionException("Vous devez sélectionner au moins une arme.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId, categoryId: this.input.categoryId, weaponIds: this.input.weaponIds };
    }

    protected async _execute(this:UpdateWeaponsSelectionActionExecutionContext<true>): Promise<void> {
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

        const category = MatchService.instance.updatePlayerSelectionOnCategory(this.input.categoryId, this.input.weaponIds, player);
        await match.save();

        const weaponsSelectMenu: APIStringSelectComponent = {
            type: ComponentType.StringSelect,
            custom_id: "dummy-weapons-selection",
            placeholder: "Clique ici pour sélectionner une arme",
            min_values: 0,
            max_values: category.weapons.length,
            options: category.weapons.map( (weapon, index) => ({
                label: weapon.name,
                value: index.toString(),
                default: player.weapons.selection.find( w => w.name === weapon.name ) != null,
                description: `${weapon.value} pts`,
                disabled: player.weapons.budget < weapon.value
            }) )
        };
        const action = new UpdateWeaponsSelectionAction({ categoryId: this.input.categoryId });
        this._client.actions.linkComponentToAction(weaponsSelectMenu, action, "weaponIds");

        const backToCategoriesButton: APIButtonComponentWithCustomId = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: "dummy-back-to-categories",
            label: "Retour aux catégories"
        };
        const actionToBackToCategories = new ShowWeaponCategorySelectionAction({ });
        this._client.actions.linkComponentToAction(backToCategoriesButton, actionToBackToCategories);

        const data = MatchService.instance.buildPlayerMenu(
            player,
            `Menu - Sélection d'armes "${category.name}"`,
            "Clique ci-dessous pour sélectionner les armes à ajouter/retirer",
            [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        weaponsSelectMenu
                    ]
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        backToCategoriesButton
                    ]
                }
            ]
        );
        await this._source.editReply(data);
    }
}

getDiscriminatorModelForClass(ActionModel,UpdateWeaponsSelectionAction, ACTION_CODES.ACTION_UPDATE_WEAPONS_SELECTION);
