import type { ObjectValues } from "@bot-types";

export const PLATFORMS = {
    PLAYSTATION_OLD: "Playstation - Old Gen",
    PLAYSTATION_NEW: "Playstation - New Gen",
    XBOX_OLD: "Xbox - Old Gen",
    XBOX_NEW: "Xbox - New Gen",
    PC: "PC"
} as const;

export type Platforms = ObjectValues<typeof PLATFORMS>;

export const PLATFORMS_VALUES = Object.values(PLATFORMS);
