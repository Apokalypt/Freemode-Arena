import type { ObjectValues } from "@bot-types";

export const MATCHMAKING_TICKET_STATUS = {
    WAITING: "waiting",
    MATCHED: "matched",
    CANCELLED: "cancelled"
} as const;

export type MatchmakingTicketStatus = ObjectValues<typeof MATCHMAKING_TICKET_STATUS>;

export const MATCHMAKING_TICKET_STATUS_VALUES = Object.values(MATCHMAKING_TICKET_STATUS);
