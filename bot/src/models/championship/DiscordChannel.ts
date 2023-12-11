import type { Snowflake } from "discord.js";
import { EmbeddedModel, RequiredProp } from "@decorators/database";

@EmbeddedModel()
export class DiscordChannel {
    @RequiredProp({ type: String })
    public guildId!: Snowflake;
    @RequiredProp({ type: String })
    public channelId!: Snowflake;
    @RequiredProp({ type: String })
    public threadId!: Snowflake;

    constructor(guildId: Snowflake, channelId: Snowflake, threadId: Snowflake) {
        this.guildId = guildId;
        this.channelId = channelId;
        this.threadId = threadId;
    }
}
