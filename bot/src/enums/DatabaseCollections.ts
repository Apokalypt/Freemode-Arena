import type { ObjectValues } from "@bot-types";

export const DATABASE_COLLECTIONS = {
    ACTIONS: "actions",
    PARTICIPANTS: "participants",
    MATCHES: "matches",
    MATCHMAKING_TICKETS: "matchmaking_tickets",
} as const;

export type DatabaseCollections = ObjectValues<typeof DATABASE_COLLECTIONS>;
