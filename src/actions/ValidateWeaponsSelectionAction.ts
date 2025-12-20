import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import path from "path";
import {
    APIButtonComponentWithCustomId,
    AttachmentBuilder,
    ButtonStyle,
    ChannelType,
    ComponentType,
    EmbedBuilder
} from "discord.js";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { IntermediateModel } from "@decorators/database";
import { DisplayMatchSelectionAction } from "./DisplayMatchSelectionAction";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { ParticipantModel } from "@models/championship/Participant";
import { MatchService } from "@services/MatchService";
import { NotSupportedException } from "@exceptions/NotSupportedException";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { NotPlayerInMatchException } from "@exceptions/championship/NotPlayerInMatchException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import {
    CHAMPIONSHIP_END_DATE,
    EMOJI_FAQ,
    EMOJI_GREEN_CHECK,
    EMOJI_INFORMATION,
    EMOJI_MATCHMAKING,
    EMOJI_RIGHT_ARROW,
    EMOJI_WARNING,
    FAQ_CHANNEL_ID
} from "@constants";

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

type InputValidateWeaponsSelectionAction = InputAction<"ACTION_VALIDATE_WEAPONS_SELECTION">;
type InputValidateWeaponsSelectionActionValidated = InputActionValidated<"ACTION_VALIDATE_WEAPONS_SELECTION">;

class ValidateWeaponsSelectionActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputValidateWeaponsSelectionAction, InputValidateWeaponsSelectionActionValidated, "ACTION_VALIDATE_WEAPONS_SELECTION"> {

    protected override async _checkActionValidity(): Promise<InputValidateWeaponsSelectionActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId };
    }

    protected async _execute(this:ValidateWeaponsSelectionActionExecutionContext<true>): Promise<void> {
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

        if (player.weapons.selection.length === 0) {
            throw new InvalidPlayerStateException("Vous n'avez sélectionné aucune arme.");
        }
        if (!player.weapons.selectionIsUpdatable()) {
            throw new InvalidPlayerStateException("Vous avez déjà validé votre sélection d'armes et ne pouvez plus la modifier!");
        }

        const isSure = await this._askForBinaryChoice(
            "## Sélection actuelle\n" +
                `${player.weapons.stringifySelection()}\n` +
                "\n" +
                "Êtes-vous sûr de vouloir valider votre sélection ? *Vous ne pourrez plus la modifier par la suite.*",
            { yes: "Valider", no: "Continuer à la modifier" }
        );
        if (!isSure) {
            throw new InvalidActionException("Vous avez décidé de continuer à modifier votre sélection d'armes.");
        }

        player.weapons.validatedAt = new Date();
        await match.save();

        setImmediate(async () => {
            const updatedMatch = await MatchService.instance.getMatchFromDiscordChannel(this._source.guildId, this._source.channelId)
                .catch( _ => null );
            if (!updatedMatch || updatedMatch.players.some( p => p.weapons.validatedAt == null )) {
                return;
            }

            const thread = this._source.channel;
            if (thread?.type !== ChannelType.PrivateThread && thread?.type !== ChannelType.PublicThread) {
                return;
            }

            const displayMatchSelectionAction = new DisplayMatchSelectionAction({ matchId: updatedMatch._id.toString() });
            const buttonToDisplaySelection: APIButtonComponentWithCustomId = {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: "Voir la sélection de l'adversaire",
                custom_id: "dummy-id-0",
                emoji: EMOJI_MATCHMAKING
            };
            this._client.actions.linkComponentToAction(buttonToDisplaySelection, displayMatchSelectionAction);

            const file = new AttachmentBuilder(path.join(__dirname, '../assets/maps', updatedMatch.map.filename));

            await thread.send({
                content: `# Match prêt ${EMOJI_GREEN_CHECK}\n` +
                    `${EMOJI_INFORMATION} Pensez à consulter le règlement complet pour éviter de prendre des avertissements ou de voir le match se faire invalider...\n` +
                    "\n" +
                    `## Joueurs ${EMOJI_MATCHMAKING} \n` +
                    `- <@${updatedMatch.players[0].participantId}>\n` +
                    `- <@${updatedMatch.players[1].participantId}>\n` +
                    "\n" +
                    `## ${EMOJI_WARNING} Rappel - [clique ici pour le règlement complet](<https://discord.com/channels/547113077506834473/1180875466559737896>)\n` +
                    "- Rejoignez-vous dans l'activité à deux :round_pushpin:\n" +
                    "- Commencez à enregistrer votre gameplay avant de lancer l'activité :movie_camera:\n" +
                    "- Le match doit durer 15 minutes :hourglass_flowing_sand:\n" +
                    "- Mode de visée libre obligatoire :dart:\n" +
                    `- Lisez la [FAQ](<https://discord.com/channels/${updatedMatch.channel.guildId}/${FAQ_CHANNEL_ID}>) (99% des questions y sont répondues) ${EMOJI_GREEN_CHECK}\n` +
                    "\n" +
                    `## ${EMOJI_RIGHT_ARROW} Dorénavant, convenez d'une date pour effectuer votre match :date:`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Lieu du match")
                        .setImage(`attachment://${updatedMatch.map.filename}`)
                ],
                files: [file],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: ButtonStyle.Link,
                                label: "Règlement + FAQ",
                                url: `https://discord.com/channels/${thread.guildId}/${FAQ_CHANNEL_ID}`,
                                emoji: EMOJI_FAQ
                            },
                            buttonToDisplaySelection
                        ]
                    }
                ]
            })
                .then( msg => msg.pin() )
                .catch( _ => null );
        });

        await this._source.editReply(
            MatchService.instance.buildDashboardPlayerMenu(this._client, player)
        )
    }
}

getDiscriminatorModelForClass(ActionModel,ValidateWeaponsSelectionAction, ACTION_CODES.ACTION_VALIDATE_WEAPONS_SELECTION);
