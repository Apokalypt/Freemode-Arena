import { Base, TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { DocumentType, getModelForClass, PropType } from "@typegoose/typegoose";
import { MatchMap } from "@models/championship/MatchMap";
import { MatchPlayer } from "@models/championship/MatchPlayer";
import { DiscordChannel } from "@models/championship/DiscordChannel";
import { Model, RequiredProp } from "@decorators/database";
import { DATABASE_COLLECTIONS, DATABASE_MODELS, Platforms, PLATFORMS_VALUES } from "@enums";

export interface Match extends Base { }

@Model(DATABASE_COLLECTIONS.MATCHES, DATABASE_MODELS.MATCH)
export class Match extends TimeStamps {
    @RequiredProp({ type: DiscordChannel })
    public channel!: DiscordChannel;

    @RequiredProp({ type: String, enum: PLATFORMS_VALUES })
    public platform!: Platforms;

    @RequiredProp({ type: MatchPlayer, validate: (value: MatchPlayer[]) => value.length === 2 }, PropType.ARRAY)
    public players!: MatchPlayer[];

    @RequiredProp({ type: MatchMap })
    public map!: MatchMap;


    /**
     * Find all players that have played against the given player
     *
     * @param playerId
     *
     * @returns The list of players ids that have played against the given player
     */
    public static async findAllPlayerOpponents(this: typeof MatchModel, playerId: string): Promise<string[]> {
        return this.aggregate()
            .match({ 'players.participant': playerId })
            .unwind({ path: '$players' })
            .match({ 'players.participant': { $ne: playerId } })
            .group({
                _id: null,
                ids: {
                    $addToSet: "$players.participant"
                }
            })
            .project({ _id: 0, ids: 1 })
            .exec()
            .then( (res: AggregateOpponentsList[] ) => {
                if (!res || res.length === 0) {
                    return [];
                }

                return res[0].ids;
            });
    }
}

export const MatchModel = getModelForClass(Match);
export type MatchDocument = DocumentType<Match>

type AggregateOpponentsList = { ids: string[] }
