import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { APIButtonComponentWithCustomId, ButtonStyle, ChannelType, ComponentType } from "discord.js";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { IntermediateModel } from "@decorators/database";
import { ShowWeaponCategorySelectionAction } from "./ShowWeaponCategorySelectionAction";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { ParticipantModel } from "@models/championship/Participant";
import { MatchService } from "@services/MatchService";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { UnknownPlayerException } from "@exceptions/championship/UnknownPlayerException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";

type ValidateWeaponsSelectionActionProperties = WithoutModifiers<ValidateWeaponsSelectionAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_VALIDATE_WEAPONS_SELECTION, { allowMixed: true })
export class ValidateWeaponsSelectionAction extends Action<"ACTION_VALIDATE_WEAPONS_SELECTION"> {
    constructor(data: Partial<ValidateWeaponsSelectionActionProperties>) {
        super({ ...data, __type: "ACTION_VALIDATE_WEAPONS_SELECTION" });
    }

    protected override _getContext(
        client: BotClient,
        input: InputValidateWeaponsSelectionAction,
        interaction: InteractionForAction<'cached'>
    ): ValidateWeaponsSelectionActionExecutionContext {
        return new ValidateWeaponsSelectionActionExecutionContext(client,ValidateWeaponsSelectionAction, input, interaction);
    }
}

type InputValidateWeaponsSelectionAction = InputAction<"ACTION_VALIDATE_WEAPONS_SELECTION"> & { };
type InputValidateWeaponsSelectionActionValidated = InputActionValidated<"ACTION_VALIDATE_WEAPONS_SELECTION"> & { };

class ValidateWeaponsSelectionActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputValidateWeaponsSelectionAction, InputValidateWeaponsSelectionActionValidated, "ACTION_VALIDATE_WEAPONS_SELECTION"> {

    protected override async _checkActionValidity(): Promise<InputValidateWeaponsSelectionActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId };
    }

    protected async _execute(this:ValidateWeaponsSelectionActionExecutionContext<true>): Promise<void> {
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

        if (player.weapons.selection.length === 0) {
            throw new InvalidPlayerStateException("Vous n'avez sélectionné aucune arme.");
        }
        if (!player.weapons.selectionIsUpdatable()) {
            throw new InvalidPlayerStateException("Vous avez déjà validé votre sélection d'armes et ne pouvez plus la modifier!");
        }

        const isSure = await this._askForBinaryChoice(
            "Êtes-vous sûr de vouloir valider votre sélection d'armes ?",
            { yes: "Valider", no: "Continuer à la modifier" }
        );
        if (!isSure) {
            throw new InvalidActionException("Vous avez décidé de continuer à modifier votre sélection d'armes.");
        }

        player.weapons.validatedAt = new Date();
        await match.save();

        setImmediate(async () => {
            if (match.players.some( p => p.weapons.validatedAt == null )) {
                return;
            }

            const thread = this._source.channel;
            if (thread?.type !== ChannelType.PrivateThread && thread?.type !== ChannelType.PublicThread) {
                return;
            }

            await thread.send({
                content: "Les deux joueurs ont validé leur sélection d'armes. Voici les armes sélectionnées par chacun d'eux:",
                embeds: await Promise.all(
                    match.players.map( async p => {
                        const user = await this._client.discord.users.fetch(p.participantId)
                            .catch( _ => null );

                        return {
                            title: `${user?.displayName}`,
                            description: p.weapons.selection.map( w => `- ${w.name}`)
                                .join("\n")
                        };
                    })
                )
            }).catch( _ => null );

            const mention = match.players.map( p => `<@${p.participantId}>` ).join(" ");

            await thread.send({
                content: `Vous pouvez désormais commencer le match! ${mention}\n` +
                    "Mettez-vous d'accord sur un horaire puis rendez-vous sur la carte indiquée au début du fil de discussion."
            })
        });

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

getDiscriminatorModelForClass(ActionModel,ValidateWeaponsSelectionAction, ACTION_CODES.ACTION_VALIDATE_WEAPONS_SELECTION);
