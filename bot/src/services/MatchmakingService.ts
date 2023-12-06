import type { Guild } from "discord.js";
import { MATCHMAKING_TICKET_STATUS, Platforms, PLATFORMS_ROLES } from "@enums";
import {
    MatchmakingTicketDocument,
    MatchmakingTicketModel
} from "@models/championship/MatchmakingTicket";
import { MatchModel } from "@models/championship/Match";
import { Participant } from "@models/championship/Participant";

export class MatchmakingService {
    private static _instance: MatchmakingService;
    public static get instance(): MatchmakingService {
        if (!this._instance) {
            this._instance = new MatchmakingService();
        }

        return this._instance;
    }


    public async searchTicket(platform: Platforms, player: Participant) {
        const playersIdToAvoid = await MatchModel.findAllPlayerOpponents(player._id);

        const ticket: MatchmakingTicketDocument | null = await MatchmakingTicketModel.findOneAndUpdate(
            {
                platform,
                participant: { $nin: playersIdToAvoid },
                status: MATCHMAKING_TICKET_STATUS.WAITING
            },
            { status: MATCHMAKING_TICKET_STATUS.MATCHED },
            { returnDocument: 'after', sort: { createdAt: 1 } }
        ).exec();

        return ticket;
    }

    public async createTicket(platform: Platforms, player: Participant): Promise<MatchmakingTicketDocument | null> {
        return MatchmakingTicketModel.create({
            platform,
            participant: player._id,
            status: MATCHMAKING_TICKET_STATUS.WAITING
        });
    }

    public async getUserPlatforms(guild: Guild, player: Participant): Promise<Platforms[]> {
        const member = await guild.members.fetch(player._id);

        return PLATFORMS_ROLES.filter( conf => member.roles.cache.has(conf.role) )
            .map( conf => conf.platform );
    }
}
