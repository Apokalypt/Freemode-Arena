import { Event } from "@models/Event";

export = new Event(
    "ready",
    true,
    async (_client) => {
        console.info("[INFO] Ready to be used");
    }
);
