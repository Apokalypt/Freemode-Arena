import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import type { RepliableInteraction } from "discord.js";
import { ChannelType } from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers } from "@bot-types";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { IntermediateModel } from "@decorators/database";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { ParticipantModel } from "@models/championship/Participant";
import { MatchService } from "@services/MatchService";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { UnknownPlayerException } from "@exceptions/championship/UnknownPlayerException";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";

type ValidateWeaponsSelectionActionProperties = WithoutModifiers<ValidateWeaponsSelectionAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_VALIDATE_WEAPONS_SELECTION, { allowMixed: true })
export class ValidateWeaponsSelectionAction extends Action<"ACTION_VALIDATE_WEAPONS_SELECTION"> {
    constructor(data: Partial<ValidateWeaponsSelectionActionProperties>) {
        super({ ...data, __type: "ACTION_VALIDATE_WEAPONS_SELECTION" });
    }

    protected override _getContext(
        client: BotClient,
        input: InputValidateWeaponsSelectionAction,
        interaction: RepliableInteraction
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

        if (player.weapons.selection.length === 0) {
            throw new InvalidPlayerStateException("Vous n'avez sélectionné aucune arme.");
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

            const thread = this._interaction?.channel;
            if (thread?.type !== ChannelType.PrivateThread && thread?.type !== ChannelType.PublicThread) {
                return;
            }

            await thread.send({
                content: "Les deux joueurs ont validé leur sélection d'armes. Voici les armes sélectionnées par chacun d'eux:",
                embeds: match.players.map( p => {
                    return {
                        title: `<@${p.participantId}>`,
                        description: p.weapons.selection.map( w => `- ${w.name}`)
                            .join("\n")
                    }
                })
            })
                .catch(_ => null)
        });

        await this._answer({
            content: "Votre sélection d'armes a bien été validée.",
            ephemeral: true
        });
    }
}

getDiscriminatorModelForClass(ActionModel,ValidateWeaponsSelectionAction, ACTION_CODES.ACTION_VALIDATE_WEAPONS_SELECTION);
