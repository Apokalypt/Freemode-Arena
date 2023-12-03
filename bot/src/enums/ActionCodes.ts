import type { ObjectValues } from "@bot-types";
import { DATABASE_MODELS, DatabaseModels } from "./DatabaseModels";

export const ACTION_CODES = {
    ACTION_REGISTER_CHAMPIONSHIP: "ACTION_REGISTER_CHAMPIONSHIP",
    ACTION_SEARCH_OPPONENT_CHAMPIONSHIP: "ACTION_SEARCH_OPPONENT_CHAMPIONSHIP"
} as const;
export type ActionCodes = ObjectValues<typeof ACTION_CODES>;

// Make sure that there is no duplicate in values
export const SHORT_ACTION_CODES: Record<ActionCodes, string> = {
    [ACTION_CODES.ACTION_REGISTER_CHAMPIONSHIP]: "RC",
    [ACTION_CODES.ACTION_SEARCH_OPPONENT_CHAMPIONSHIP]: "SO"
} as const;
type ShortActionCodes = ObjectValues<typeof SHORT_ACTION_CODES>;

export const MAPPING_ACTION_CODES_MODELS: Record<ShortActionCodes, DatabaseModels> = {
    [SHORT_ACTION_CODES.ACTION_REGISTER_CHAMPIONSHIP]: DATABASE_MODELS.ACTION_REGISTER_CHAMPIONSHIP,
    [SHORT_ACTION_CODES.ACTION_SEARCH_OPPONENT_CHAMPIONSHIP]: DATABASE_MODELS.ACTION_SEARCH_OPPONENT_CHAMPIONSHIP
};
