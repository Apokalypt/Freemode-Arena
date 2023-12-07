import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { IntermediateModel } from "@decorators/database";
import { MatchService } from "@services/MatchService";
import { MatchmakingService } from "@services/MatchmakingService";
import { ParticipantModel } from "@models/championship/Participant";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { UserNotRegisteredException } from "@exceptions/championship/UserNotRegisteredException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { MatchmakingInProgressException } from "@exceptions/championship/MatchmakingInProgressException";
import { ACTION_CODES, DATABASE_MODELS, Platforms } from "@enums";

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

type InputSearchOpponentChampionshipAction = InputAction<"ACTION_SEARCH_OPPONENT_CHAMPIONSHIP"> & { };
type InputSearchOpponentChampionshipActionValidated = InputActionValidated<"ACTION_SEARCH_OPPONENT_CHAMPIONSHIP"> & { };

class SearchOpponentChampionshipActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputSearchOpponentChampionshipAction, InputSearchOpponentChampionshipActionValidated, "ACTION_SEARCH_OPPONENT_CHAMPIONSHIP"> {

    protected override async _checkActionValidity(): Promise<InputSearchOpponentChampionshipActionValidated> {
        const inputValidated = await super._checkActionValidity();

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

        const guild = await this._getGuild(true);
        const userPlatforms = await MatchmakingService.instance.getUserPlatforms(guild, participant);
        if (userPlatforms.length === 0) {
            throw new InvalidPlayerStateException("Vous n'avez pas sélectionné de plateforme dans <id:customize>.")
        }

        let platform: Platforms;
        if (userPlatforms.length === 1) {
            platform = userPlatforms[0];
        } else {
            platform = await this._askForStringSelection({
                title: "Sur quelle plateforme souhaitez-vous jouer?",
                description: "Choisissez la plateforme sur laquelle vous souhaitez jouer ce match. La sélection concernera " +
                    "uniquement ce match donc vous pourrez lancer une recherche sur une autre plateforme juste après.",
                options: userPlatforms.map( platform => ({ label: platform, value: platform }) ),
                placeholder: "Cliquez ici pour choisir une plateforme...",
                minNumberOfOptions: 1,
                maxNumberOfOptions: 1
            }) as Platforms;
        }

        const ticket = await MatchmakingService.instance.searchTicket(platform, participant);
        if (ticket) {
            const match = await MatchService.instance.createMatchFromTicket(this._client, this._interaction!.guild!, ticket, participant);

            await this._answer({
                content: "Nous vous avons trouvé un adversaire!\n" +
                    `**Rendez-vous dans votre fil de discussion ( <#${match.channel.threadId}> ) pour découvrir le détail du match et pour convenir d'une date avec votre adversaire.**`,
                ephemeral: true
            });
        } else {
            if (await MatchmakingService.instance.isParticipantInQueue(platform, participant)) {
                throw new MatchmakingInProgressException(platform);
            }

            await MatchmakingService.instance.createTicket(platform, participant);

            await this._answer({
                content: `Vous avez été ajouté à la liste d\'attente sur la plateforme ${platform}.\n` +
                    'Vous serez notifié dès qu\'un adversaire sera disponible :thumbsup:',
                ephemeral: true
            });
        }
    }
}

getDiscriminatorModelForClass(ActionModel,SearchOpponentChampionshipAction, ACTION_CODES.ACTION_SEARCH_OPPONENT_CHAMPIONSHIP);
