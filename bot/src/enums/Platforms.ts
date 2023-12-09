import type { ObjectValues } from "@bot-types";
import { PC_ROLE_ID, PLAYSTATION_ROLE_ID, XBOX_ROLE_ID } from "@constants";

export const PLATFORMS = {
    PLAYSTATION_NEW: "Playstation - GTA Online New Gen",
    XBOX_NEW: "Xbox - GTA Online New Gen",
    PC: "PC"
} as const;
export type Platforms = ObjectValues<typeof PLATFORMS>;
export const PLATFORMS_VALUES = Object.values(PLATFORMS);

export const PLATFORMS_ROLES = [
    { platform: PLATFORMS.PLAYSTATION_NEW, role: PLAYSTATION_ROLE_ID },
    { platform: PLATFORMS.XBOX_NEW, role: XBOX_ROLE_ID },
    { platform: PLATFORMS.PC, role: PC_ROLE_ID }
];
