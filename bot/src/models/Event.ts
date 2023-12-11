import type { BotClient } from "./BotClient";
import type { ClientEvents } from "discord.js";

/**
 * Custom event class to define action to be realised
 */
export class Event<K extends keyof ClientEvents = keyof ClientEvents> {
    /**
     * Name of the event (value inside BotEvents enum)
     */
    public readonly name: K;
    /**
     * Indicate if this event definition should be executed only one time or not
     */
    public readonly once: boolean;
    /**
     * Coded to be executed once the event is emitted
     */
    private readonly action: (client: BotClient, ...args: ClientEvents[K]) => any | Promise<any>;


    public constructor(
        name: K,
        once: boolean,
        action: (client: BotClient, ...args: ClientEvents[K]) => any | Promise<any>
    ) {
        this.name = name;
        this.once = once;
        this.action = action;
    }


    /**
     * This function is used to encapsulate the action to be executed with a try/catch block to avoid bot crash
     *
     * @param client    BotClient instance
     * @param args      Arguments of the event
     */
    public async handler(client: BotClient, ...args: ClientEvents[K]): Promise<void> {
        try {
            await this.action(client, ...args);
        } catch (error) {
            console.error(`[Event] ${this.name} failed to execute: `, error);
        }
    }
}
