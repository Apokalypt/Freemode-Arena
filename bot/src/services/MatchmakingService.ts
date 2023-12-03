import { MATCHMAKING_TICKET_STATUS, PLATFORMS, Platforms } from "@enums";
import { Participant } from "@models/championship/Participant";
import { MatchModel } from "@models/championship/Match";
import {
    MatchmakingTicketDocument,
    MatchmakingTicketModel
} from "@models/championship/MatchmakingTicket";

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

    public async getUserPlatforms(player: Participant): Promise<Platforms[]> {
        // TODO
        return [PLATFORMS.PC];
    }
}
