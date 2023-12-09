import type { Guild } from "discord.js";
import { MatchModel } from "@models/championship/Match";
import { Participant } from "@models/championship/Participant";
import { MatchmakingTicketDocument, MatchmakingTicketModel } from "@models/championship/MatchmakingTicket";
import { DEFAULT_USER_LEVEL, KNOWN_USERS_LEVEL } from "@constants";
import { MATCHMAKING_TICKET_STATUS, Platforms, PLATFORMS_ROLES } from "@enums";

export class MatchmakingService {
    private static _instance: MatchmakingService;
    public static get instance(): MatchmakingService {
        if (!this._instance) {
            this._instance = new MatchmakingService();
        }

        return this._instance;
    }


    public async searchTicket(participant: Participant) {
        const playersIdToAvoid = await MatchModel.findAllPlayerOpponents(participant._id);
        playersIdToAvoid.push(participant._id);

        const ticket: MatchmakingTicketDocument | null = await MatchmakingTicketModel.findOneAndUpdate(
            {
                platform: participant.platform,
                participant: { $nin: playersIdToAvoid },
                status: MATCHMAKING_TICKET_STATUS.WAITING
            },
            { status: MATCHMAKING_TICKET_STATUS.MATCHED },
            { returnDocument: 'after', sort: { createdAt: 1 } }
        ).exec();

        return ticket;
    }

    public async playerIsInQueue(playerId: string): Promise<boolean> {
        const res = await MatchmakingTicketModel.exists({
            participant: playerId,
            status: MATCHMAKING_TICKET_STATUS.WAITING
        }).exec();

        return res != null;
    }

    public async createTicket(player: Participant): Promise<MatchmakingTicketDocument | null> {
        return MatchmakingTicketModel.create({
            platform: player.platform,
            participant: player._id,
            status: MATCHMAKING_TICKET_STATUS.WAITING
        });
    }

    public async getUserPlatforms(guild: Guild, playerId: string): Promise<Platforms[]> {
        const member = await guild.members.fetch(playerId);

        return PLATFORMS_ROLES.filter( conf => member.roles.cache.has(conf.role) )
            .map( conf => conf.platform );
    }

    public getUserLevel(id: string): number {
        return KNOWN_USERS_LEVEL[id] || DEFAULT_USER_LEVEL;
    }
}
