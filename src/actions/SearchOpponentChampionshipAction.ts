import type { BotClient } from "@models/BotClient";
import type { InteractionForAction, WithoutModifiers } from "@bot-types";
import { ButtonStyle, ComponentType } from "discord.js";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { IntermediateModel } from "@decorators/database";
import { MatchService } from "@services/MatchService";
import { MatchmakingService } from "@services/MatchmakingService";
import { ParticipantModel } from "@models/championship/Participant";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { CHAMPIONSHIP_END_DATE, EMOJI_FAQ, EMOJI_INFORMATION, EMOJI_MATCHMAKING, FAQ_CHANNEL_ID } from "@constants";

type SearchOpponentChampionshipActionProperties = WithoutModifiers<SearchOpponentChampionshipAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_SEARCH_OPPONENT_CHAMPIONSHIP, { allowMixed: true })
export class SearchOpponentChampionshipAction extends Action<"ACTION_SEARCH_OPPONENT_CHAMPIONSHIP"> {
    constructor(data: Partial<SearchOpponentChampionshipActionProperties>) {
        super({ ...data, __type: "ACTION_SEARCH_OPPONENT_CHAMPIONSHIP" });
    }

    protected override _getContext(
        client: BotClient,
        input: InputSearchOpponentChampionshipAction,
        interaction: InteractionForAction<'cached'>
    ): SearchOpponentChampionshipActionExecutionContext {
        return new SearchOpponentChampionshipActionExecutionContext(client,SearchOpponentChampionshipAction, input, interaction);
    }
}

type InputSearchOpponentChampionshipAction = InputAction<"ACTION_SEARCH_OPPONENT_CHAMPIONSHIP">;
type InputSearchOpponentChampionshipActionValidated = InputActionValidated<"ACTION_SEARCH_OPPONENT_CHAMPIONSHIP">;

class SearchOpponentChampionshipActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputSearchOpponentChampionshipAction, InputSearchOpponentChampionshipActionValidated, "ACTION_SEARCH_OPPONENT_CHAMPIONSHIP"> {

    protected override async _checkActionValidity(): Promise<InputSearchOpponentChampionshipActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId };
    }

    protected async _execute(this:SearchOpponentChampionshipActionExecutionContext<true>): Promise<void> {
        await this._deferAnswer();

        const participant = await ParticipantModel.findById(this._source.user.id);
        if (!participant) {
            throw new UserNotRegisteredException();
        }

        const ticket = await MatchmakingService.instance.searchTicket(participant);
        if (ticket) {
            const match = await MatchService.instance.createMatchFromTicket(this._client, this._interaction.guild, ticket, participant);

            await this._answer({
                content: "## Adversaire trouvé!\n" +
                    "** **\n" +
                    `- Plateforme: **${participant.platform}**\n` +
                    `- Adversaire: <@${ticket.participantId}>\n` +
                    "\n" +
                    `${EMOJI_INFORMATION} Rendez-vous dans votre fil de discussion ( <#${match.channel.threadId}> ) pour sélectionner vos armes et pour convenir d'une date avec votre adversaire.`,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: ButtonStyle.Link,
                                label: "Clique ici pour accéder au fil",
                                url: `https://discord.com/channels/${this._source.guildId}/${match.channel.threadId}`,
                                emoji: EMOJI_MATCHMAKING
                            }
                        ]
                    },
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                style: ButtonStyle.Link,
                                label: "Règlement + FAQ",
                                url: `https://discord.com/channels/${this._source.guildId}/${FAQ_CHANNEL_ID}`,
                                emoji: EMOJI_FAQ
                            }
                        ]
                    }
                ],
                ephemeral: true
            });
        } else {
            await MatchmakingService.instance.createTicket(participant)
                .catch( error => {
                    if (error.name === "MongoServerError" && error.code === 11000) {
                        return null;
                    }

                    throw error;
                });

            await this._answer({
                content: "## Matchmaking en cours\n" +
                    "** **\n" +
                    `- Plateforme: **${participant.platform}**\n` +
                    `- Temps d'attente: *inconnu*\n` +
                    "\n" +
                    `${EMOJI_INFORMATION} Dès lors qu'un joueur cherchera un adversaire sur la même plateforme que vous, nous créerons un fil de discussion :thumbsup:`,
                ephemeral: true
            });
        }
    }
}

getDiscriminatorModelForClass(ActionModel,SearchOpponentChampionshipAction, ACTION_CODES.ACTION_SEARCH_OPPONENT_CHAMPIONSHIP);
