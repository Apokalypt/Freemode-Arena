import type { BooleanCache, CacheType, InteractionReplyOptions, Message, RepliableInteraction } from "discord.js";
import type { BotClient } from "@models/BotClient";

export class Utils {
    constructor(private readonly _client: BotClient) { }

    /**
     * Send an interaction answer based on different property to avoid error (reply when interaction deferred).
     *
     * @param interaction   Interaction to answer
     * @param data          Data to send
     * @param options       Options to use
     */
    public async sendInteractionAnswer<Cached extends CacheType>(
        interaction: RepliableInteraction<Cached>,
        data: InteractionReplyOptions,
        options?: { forceEdit?: boolean }
    ): Promise< Message<BooleanCache<Cached>> > {
        if (!interaction.replied && !interaction.deferred) {
            return interaction.reply({ ...data, fetchReply: true });
        } else if (interaction.replied && options?.forceEdit) {
            return interaction.editReply(data);
        } else {
            return interaction.followUp(data);
        }
    }
}
