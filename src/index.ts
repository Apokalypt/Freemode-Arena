import "module-alias/register";

/* =============== Environment variable =============== */
import * as dotenv from "dotenv";
dotenv.config({ DOTENV_KEY: process.env.FA_DOTENV_KEY ?? "" });
import "@bot-types";

import mongoose from "mongoose";
import { BotClient } from "@models/BotClient";

mongoose.set("debug", process.env.NODE_ENV !== "production");
mongoose.set("strictQuery", true);
mongoose.connect(process.env.FA_DATABASE_URL_CONNECTION ?? "")
    .then( async _ => {
        console.info("[INFO] Connected to the database");

        return BotClient.init(process.env.FA_DISCORD_BOT_TOKEN ?? "");
    })
    .then( _ => console.info("[INFO] Discord client initialized") )
    .catch( err => console.error("[ERROR] Discord client initialization failed", err) );
