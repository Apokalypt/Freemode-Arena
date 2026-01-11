import type { ObjectValues } from "@bot-types";
import {
    PC_NG_ROLE_ID, PC_OG_ROLE_ID,
    PLAYSTATION_NG_ROLE_ID,
    PLAYSTATION_OG_ROLES_ID,
    XBOX_NG_ROLE_ID,
    XBOX_OG_ROLES_ID
} from "@constants";

export const PLATFORMS = {
    PLAYSTATION_OLD: "Playstation - GTA Old Gen",
    PLAYSTATION_NEW: "Playstation - GTA New Gen",
    XBOX_OLD: "Xbox - GTA Old Gen",
    XBOX_NEW: "Xbox - GTA New Gen",
    PC_OLD: "PC - GTA Old Gen",
    PC_NEW: "PC - GTA New Gen",
} as const;
export type Platforms = ObjectValues<typeof PLATFORMS>;
export const PLATFORMS_VALUES = Object.values(PLATFORMS);

export const PLATFORMS_ROLES = [
    { platform: PLATFORMS.PLAYSTATION_OLD, roles: [...PLAYSTATION_OG_ROLES_ID] },
    { platform: PLATFORMS.XBOX_OLD, roles: [...XBOX_OG_ROLES_ID] },
    { platform: PLATFORMS.PC_OLD, roles: [PC_OG_ROLE_ID] },

    { platform: PLATFORMS.PLAYSTATION_NEW, roles: [PLAYSTATION_NG_ROLE_ID] },
    { platform: PLATFORMS.XBOX_NEW, roles: [XBOX_NG_ROLE_ID] },
    { platform: PLATFORMS.PC_NEW, roles: [PC_NG_ROLE_ID] }
];
