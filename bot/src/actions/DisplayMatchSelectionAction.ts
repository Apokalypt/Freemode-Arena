import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { isValidObjectId } from "mongoose";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { IntermediateModel, RequiredProp } from "@decorators/database";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { MatchService } from "@services/MatchService";
import { PropertyNotInjectableFromInteraction } from "@models/action/ActionPropertySerialization";
import { UnknownMatchException } from "@exceptions/championship/UnknownMatchException";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { NotPlayerInMatchException } from "@exceptions/championship/NotPlayerInMatchException";
import { CHAMPIONSHIP_END_DATE, SUPPORT_ROLE_ID } from "@constants";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";

type DisplayMatchSelectionActionProperties = WithoutModifiers<DisplayMatchSelectionAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_DISPLAY_MATCH_SELECTION, { allowMixed: true })
export class DisplayMatchSelectionAction extends Action<"ACTION_DISPLAY_MATCH_SELECTION"> {
    @RequiredProp({ type: String })
    matchId!: string;

    constructor(data: Partial<DisplayMatchSelectionActionProperties>) {
        super({ ...data, __type: "ACTION_DISPLAY_MATCH_SELECTION" });


        this.matchId = data.matchId!;
    }

    protected override _getContext(
        client: BotClient,
        input: InputDisplayMatchSelectionAction,
        interaction: InteractionForAction<'cached'>
    ): DisplayMatchSelectionActionExecutionContext {
        return new DisplayMatchSelectionActionExecutionContext(client,DisplayMatchSelectionAction, input, interaction);
    }

    protected override _getInput(): InputDisplayMatchSelectionAction {
        return { ...super._getInput(), matchId: this.matchId };
    }

    static override PROPERTIES_SERIALIZABLE_INTERACTION_ID() {
        return [
            ...super.PROPERTIES_SERIALIZABLE_INTERACTION_ID(),
            new PropertyNotInjectableFromInteraction({
                name: "matchId",
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
            })
        ];
    }
}

type InputDisplayMatchSelectionAction = InputAction<"ACTION_DISPLAY_MATCH_SELECTION"> & { matchId?: string };
type InputDisplayMatchSelectionActionValidated = InputActionValidated<"ACTION_DISPLAY_MATCH_SELECTION"> & { matchId: string };

class DisplayMatchSelectionActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputDisplayMatchSelectionAction, InputDisplayMatchSelectionActionValidated, "ACTION_DISPLAY_MATCH_SELECTION"> {

    protected override async _checkActionValidity(): Promise<InputDisplayMatchSelectionActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        if (!this.input.matchId || !isValidObjectId(this.input.matchId)) {
            throw new InvalidActionException("Aucun match n'a été trouvé.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId, matchId: this.input.matchId };
    }

    protected async _execute(this:DisplayMatchSelectionActionExecutionContext<true>): Promise<void> {
        const member = await this._getExecutorMember(true);

        const match = await MatchService.instance.getMatchFromId(this.input.matchId);
        if (!match) {
            throw new UnknownMatchException();
        }

        const player = match.players.find( p => p.participantId === member.id );
        if (!player && !member.roles.cache.has(SUPPORT_ROLE_ID)) {
            throw new NotPlayerInMatchException();
        }

        await this._answer({
            ephemeral: true,
            content: match.players.map( player => {
                return `## <@${player.participantId}>\n` +
                    `${player.weapons.stringifySelection()}`
            }).join("\n"),
            allowedMentions: { parse: [] }
        });
    }
}

getDiscriminatorModelForClass(ActionModel,DisplayMatchSelectionAction, ACTION_CODES.ACTION_DISPLAY_MATCH_SELECTION);
