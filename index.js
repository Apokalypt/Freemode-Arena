const fs = require('fs');
// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');

mongoose.set('debug', true);

mongoose.connect(process.env.FREEMODE_ARENA_DATABASE_URI)
    .then(() => {
        // Create a new client instance
        const client = new Client({
            partials: [Partials.GuildMember, Partials.ThreadMember, Partials.Channel],
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        // Iterate on files in the events directory
        for (const file of fs.readdirSync('./events')) {
            const event = require(`./events/${file}`);
            if (!event.execute || !event.name) {
                console.error(`Event ${file} does not export an execute function or a name.`);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(client, ...args));
            } else {
                client.on(event.name, (...args) => event.execute(client, ...args));
            }
        }

        client.prefix = process.env.FREEMODE_ARENA_PREFIX || '!';

        // Iterate on files in the commands directory
        client.commands = [];
        for (const commandData of fs.readdirSync('./commands')) {
            const command = require(`./commands/${commandData}`);
            client.commands.push(command);
        }

        // Log in to Discord with your client's token
        client.login(process.env.FREEMODE_ARENA_DISCORD_TOKEN).catch(console.error);
    })
    .catch(console.error);
