import fs from "fs";
import path from "path";
import { ApplicationCommandType, Client, GatewayIntentBits, Guild } from "discord.js";
import { Event } from "./Event";
import { Utils } from "./Utils";
import { BaseCommand } from "./command/BaseCommand";
import { SlashCommand } from "./command/SlashCommand";
import { UserContextMenuCommand } from "./command/UserContextMenuCommand";
import { MessageContextMenuCommand } from "./command/MessageContextMenuCommand";
import { ActionsManager } from "@managers/ActionsManager";

type CommandsList = {
    [ApplicationCommandType.ChatInput]: Map<string, SlashCommand>;
    [ApplicationCommandType.User]: Map<string, UserContextMenuCommand>;
    [ApplicationCommandType.Message]: Map<string, MessageContextMenuCommand>;
};

export class BotClient {
    readonly discord: Client<true>;

    readonly utils: Utils;

    readonly actions: ActionsManager;

    private readonly _commands: CommandsList;

    private constructor(discord: Client<true>) {
        this.discord = discord;

        this.utils = new Utils(this);

        this.actions = new ActionsManager(this);

        this._commands = {
            [ApplicationCommandType.ChatInput]: this._getDiscordSlashCommands()
                .reduce((map, command) => map.set(command.name, command), new Map()),
            [ApplicationCommandType.User]: this._getDiscordUserContextCommands()
                .reduce((map, command) => map.set(command.name, command), new Map()),
            [ApplicationCommandType.Message]: this._getDiscordMessageContextCommands()
                .reduce((map, command) => map.set(command.name, command), new Map())
        };

        this._registerDiscordClientEvents();
    }

    static async init(token: string): Promise<BotClient> {
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        const bot = new BotClient(client);
        await client.login(token);
        return bot;
    }

    public getCommand<K extends ApplicationCommandType>(type: K, name: string): BaseCommand<K> | undefined {
        // FIXME
        // @ts-ignore
        return this._commands[type]?.get(name);
    }
    public publishCommandsToGuild(guild: Guild) {
        const commands = [
            ...Array.from(this._commands[ApplicationCommandType.ChatInput].values())
                .filter( c => !c.isGlobal ),
            ...Array.from(this._commands[ApplicationCommandType.User].values()),
            ...Array.from(this._commands[ApplicationCommandType.Message].values())
        ];

        return guild.commands.set( commands.map( c => c.build() ) );
    }
    public publishGlobalCommands() {
        const commands = Array.from(this._commands[ApplicationCommandType.ChatInput].values())
            .filter( c => c.isGlobal );

        return this.discord.application.commands.set( commands.map( c => c.build() ) );
    }

    private _registerDiscordClientEvents(dir = "../events"): void {
        for (const name of fs.readdirSync(path.join(__dirname, dir))) {
            const fileStat = fs.lstatSync(path.join(__dirname, dir, name));
            if (fileStat.isDirectory()) {
                this._registerDiscordClientEvents(path.join(dir, name));
            } else {
                const event: Event = require(path.join(__dirname, dir, name));

                if (event.once) {
                    this.discord.once(event.name, (...args) => event.handler(this, ...args));
                } else {
                    this.discord.on(event.name, (...args) => event.handler(this, ...args));
                }
            }
        }
    }

    private _getDiscordSlashCommands(): SlashCommand[] {
        return this._getDiscordClientCommands<SlashCommand, ApplicationCommandType.ChatInput>("../commands/slash");
    }
    private _getDiscordUserContextCommands(): UserContextMenuCommand[] {
        return this._getDiscordClientCommands<UserContextMenuCommand, ApplicationCommandType.User>("../commands/user");
    }
    private _getDiscordMessageContextCommands(): MessageContextMenuCommand[] {
        return this._getDiscordClientCommands<MessageContextMenuCommand, ApplicationCommandType.Message>("../commands/message");
    }
    private _getDiscordClientCommands<T extends BaseCommand<K>, K extends ApplicationCommandType>(dir: string): T[] {
        if (!fs.existsSync(path.join(__dirname, dir))) {
            return [];
        }

        const commands: T[] = [];

        for (const name of fs.readdirSync(path.join(__dirname, dir))) {
            const fileStat = fs.lstatSync(path.join(__dirname, dir, name));
            if (fileStat.isDirectory()) {
                commands.push( ...this._getDiscordClientCommands<T, K>(path.join(dir, name)) );
            } else {
                commands.push( require(path.join(__dirname, dir, name)) );
            }
        }

        return commands;
    }
}
