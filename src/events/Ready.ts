import { Event } from "@models/Event";

export = new Event(
    "ready",
    true,
    async (client) => {
        await client.publishGlobalCommands()
            .then( () => console.info("[INFO] Global commands published") )
            .catch( (e) => console.error("[ERROR] An error occurred while publishing global commands:", e) );

        console.info("[INFO] Ready to be used");
    }
);
