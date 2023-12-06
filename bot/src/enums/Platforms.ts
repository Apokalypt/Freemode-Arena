import type { ObjectValues } from "@bot-types";

export const PLATFORMS = {
    PLAYSTATION_NEW: "Playstation - GTA Online New Gen",
    XBOX_NEW: "Xbox - GTA Online New Gen",
    PC: "PC"
} as const;
export type Platforms = ObjectValues<typeof PLATFORMS>;
export const PLATFORMS_VALUES = Object.values(PLATFORMS);

export const PLATFORMS_ROLES = [
    { platform: PLATFORMS.PLAYSTATION_NEW, role: "935532722020032516" },
    { platform: PLATFORMS.XBOX_NEW, role: "935532722020032517" },
    { platform: PLATFORMS.PC, role: "935532722020032518" }
];
