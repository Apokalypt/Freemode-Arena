import { Types } from "mongoose";
import { Base, TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { DocumentType, getModelForClass, isDocument, Prop, Ref } from "@typegoose/typegoose";
import { Match } from "@models/championship/Match";
import { Participant } from "@models/championship/Participant";
import { Model, RequiredProp } from "@decorators/database";
import {
    DATABASE_MODELS,
    PLATFORMS_VALUES,
    DATABASE_COLLECTIONS,
    MATCHMAKING_TICKET_STATUS_VALUES,
    Platforms,
    MatchmakingTicketStatus
} from "@enums";

export interface MatchmakingTicket extends Base { }

@Model(DATABASE_COLLECTIONS.MATCHMAKING_TICKETS, DATABASE_MODELS.MATCHMAKING_TICKET)
export class MatchmakingTicket extends TimeStamps {
    @RequiredProp({ type: String, enum: MATCHMAKING_TICKET_STATUS_VALUES })
    public status!: MatchmakingTicketStatus;

    @RequiredProp({ type: String, enum: PLATFORMS_VALUES })
    public platform!: Platforms;

    @RequiredProp({ ref: () => Participant, type: String })
    public participant!: Ref<Participant, string>;
    public get participantId(): string {
        if (isDocument(this.participant)) {
            return this.participant._id;
        }

        return this.participant;
    }

    @Prop({ ref: () => Match, required: false })
    public match?: Ref<Match, Types.ObjectId>;
}

export const MatchmakingTicketModel = getModelForClass(MatchmakingTicket);
export type MatchmakingTicketDocument = DocumentType<MatchmakingTicket>
