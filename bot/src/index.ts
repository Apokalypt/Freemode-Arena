import "module-alias/register";

/* =============== Environment variable =============== */
import * as dotenv from "dotenv";
dotenv.config({ DOTENV_KEY: process.env.FA_DOTENV_KEY ?? "" });
import "@bot-types";

import { BotClient } from "@models/BotClient";

BotClient.init(process.env.FA_DISCORD_BOT_TOKEN ?? "")
    .then( _ => console.info("[INFO] Discord client initialized") )
    .catch( err => console.error("[ERROR] Discord client initialization failed", err) );
