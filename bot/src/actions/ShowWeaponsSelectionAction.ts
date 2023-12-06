import type { StringSelectMenuComponentData } from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass, Prop } from "@typegoose/typegoose";
import { ButtonComponentData, ButtonStyle, ComponentType } from "discord.js";
import { MatchService } from "@services/MatchService";
import { ParticipantModel } from "@models/championship/Participant";
import { PropertyInjectableFromInteraction } from "@models/action/ActionPropertySerialization";
import { UpdateWeaponsSelectionAction } from "./UpdateWeaponsSelectionAction";
import { ValidateWeaponsSelectionAction } from "./ValidateWeaponsSelectionAction";
import { ShowWeaponCategorySelectionAction } from "./ShowWeaponCategorySelectionAction";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { UnknownPlayerException } from "@exceptions/championship/UnknownPlayerException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { IntermediateModel } from "@decorators/database";

type ShowWeaponsSelectionActionProperties = WithoutModifiers<ShowWeaponsSelectionAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_SHOW_WEAPONS_SELECTION, { allowMixed: true })
export class ShowWeaponsSelectionAction extends Action<"ACTION_SHOW_WEAPONS_SELECTION"> {
    @Prop({ type: String })
    categoryId?: string;

    constructor(data: Partial<ShowWeaponsSelectionActionProperties>) {
        super({ ...data, __type: "ACTION_SHOW_WEAPONS_SELECTION" });

        this.categoryId = data.categoryId;
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
            new PropertyInjectableFromInteraction({ name: "categoryId", onNull: null, onUndefined: null }),
        ];
    }
}

type InputShowWeaponsSelectionAction = InputAction<"ACTION_SHOW_WEAPONS_SELECTION"> & { categoryId?: string };
type InputShowWeaponsSelectionActionValidated = InputActionValidated<"ACTION_SHOW_WEAPONS_SELECTION"> & { categoryId: string };

class ShowWeaponsSelectionActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputShowWeaponsSelectionAction, InputShowWeaponsSelectionActionValidated, "ACTION_SHOW_WEAPONS_SELECTION"> {

    protected override async _checkActionValidity(): Promise<InputShowWeaponsSelectionActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        if (!this.input.categoryId) {
            throw new InvalidActionException("Vous devez sélectionner une catégorie d'arme.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId, categoryId: this.input.categoryId };
    }

    protected async _execute(this:ShowWeaponsSelectionActionExecutionContext<true>): Promise<void> {
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
            throw new UnknownPlayerException();
        }

        if (player.weapons.validatedAt != null) {
            throw new InvalidPlayerStateException("Vous avez déjà validé votre sélection d'armes et ne pouvez plus la modifier!");
        }

        let actualSelectionSection: string;
        if (player.weapons.selection.length === 0) {
            actualSelectionSection = "*Aucune arme sélectionnée pour le moment*\n";
        } else {
            actualSelectionSection = player.weapons.selection.map( weapon => `- ${weapon.name} [${weapon.cost}]` )
                .join("\n") + "\n";
        }

        const category = MatchService.instance.getWeaponsCategoryFromId(this.input.categoryId);

        const weaponsSelectMenu: StringSelectMenuComponentData = {
            type: ComponentType.StringSelect,
            customId: "dummy-weapons-selection",
            placeholder: "Clique ici pour sélectionner une arme",
            minValues: 0,
            maxValues: category.weapons.length,
            options: category.weapons.map( (weapon, index) => ({
                label: weapon.name,
                value: index.toString(),
                default: player.weapons.selection.find( w => w.name === weapon.name ) != null,
                description: `${weapon.value} pts`
            }) )
        };
        const action = new UpdateWeaponsSelectionAction({ categoryId: this.input.categoryId });
        this._client.actions.linkComponentToAction(weaponsSelectMenu, action, "weaponIds");

        const backToCategoriesButton: ButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            customId: "dummy-back-to-categories",
            label: "Retour aux catégories"
        };
        const actionToBackToCategories = new ShowWeaponCategorySelectionAction({ });
        this._client.actions.linkComponentToAction(backToCategoriesButton, actionToBackToCategories);

        const validationButton: ButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Success,
            customId: "dummy",
            label: "Valider la sélection"
        };
        const actionToValidate = new ValidateWeaponsSelectionAction({ });
        this._client.actions.linkComponentToAction(validationButton, actionToValidate);

        await this._source.editReply({
            content: `### Armes sélectionnées ( ${player.weapons.selectionCost} / ${player.weapons.budget} )\n` +
                actualSelectionSection +
                "\n" +
                "\n" +
                ":rightarrow: Veuillez sélectionner les armes de cette catégorie :arrow_heading_down:",
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        weaponsSelectMenu
                    ]
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        backToCategoriesButton,
                        validationButton
                    ]
                }
            ]
        });
    }
}

getDiscriminatorModelForClass(ActionModel,ShowWeaponsSelectionAction, ACTION_CODES.ACTION_SHOW_WEAPONS_SELECTION);
