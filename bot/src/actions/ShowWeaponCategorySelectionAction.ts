import type { ButtonComponentData, RepliableInteraction } from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers } from "@bot-types";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { ButtonStyle, ComponentType, StringSelectMenuComponentData } from "discord.js";
import { MatchService } from "@services/MatchService";
import { ParticipantModel } from "@models/championship/Participant";
import { ShowWeaponsSelectionAction } from "./ShowWeaponsSelectionAction";
import { ValidateWeaponsSelectionAction } from "./ValidateWeaponsSelectionAction";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { UnknownPlayerException } from "@exceptions/championship/UnknownPlayerException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
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
        interaction: RepliableInteraction
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
        await this._deferAnswer();

        const participant = await ParticipantModel.findById(this._interaction?.user.id);
        if (!participant) {
            throw new UserNotRegisteredException();
        }

        const match = await MatchService.instance.getMatchFromDiscordChannel(this._interaction?.guildId!, this._interaction?.channelId!);
        if (!match) {
            throw new UnknownMatchException();
        }

        const player = match.players.find( p => p.participantId === participant._id );
        if (!player) {
            throw new UnknownPlayerException();
        }

        let actualSelectionSection: string;
        if (player.weapons.selection.length === 0) {
            actualSelectionSection = "*Aucune arme sélectionnée pour le moment*\n";
        } else {
            actualSelectionSection = player.weapons.selection.map( weapon => `- ${weapon.name} [${weapon.cost}]` )
                .join("\n") + "\n";
        }

        const weapons = MatchService.instance.getWeaponsCategories();

        const categorySelectMenu: StringSelectMenuComponentData = {
            type: ComponentType.StringSelect,
            customId: "dummy",
            placeholder: "Clique ici pour sélectionner une catégorie d'arme",
            minValues: 1,
            maxValues: 1,
            options: weapons.map( (category: any) => ({
                label: category.name,
                value: category.id.toString(),
            }) )
        };
        const action = new ShowWeaponsSelectionAction({ });
        this._client.actions.linkComponentToAction(categorySelectMenu, action, "categoryId");

        const validationButton: ButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Success,
            customId: "dummy",
            label: "Valider la sélection"
        };
        const actionToValidate = new ValidateWeaponsSelectionAction({ });
        this._client.actions.linkComponentToAction(validationButton, actionToValidate);

        await this._answer({
            content: "## Sélection des armes\n" +
                "** **\n" +
                `### Sélection actuelle ( ${player.weapons.selectionCost} / ${player.weapons.budget} )\n` +
                actualSelectionSection +
                "\n" +
                "\n" +
                ":rightarrow: Veuillez sélectionner la catégorie de l'arme que vous souhaitez sélectionner :arrow_heading_down:",
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        categorySelectMenu
                    ]
                },
                {
                    type: ComponentType.ActionRow,
                    components: [
                        validationButton
                    ]
                }
            ]
        })
    }
}

getDiscriminatorModelForClass(ActionModel,ShowWeaponCategorySelectionAction, ACTION_CODES.ACTION_SHOW_WEAPON_CATEGORY_SELECTION);
