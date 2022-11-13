const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    /**
     * @param {FreemodeClient} client
     * @param {import('discord.js').Message} message
     */
    async execute(client, message) {
        if (message.author.id !== '305940554221355008') return;
        if (!client.prefix || !client.commands) return;

        if (!message.content.startsWith(client.prefix)) return;

        const args = message.content.slice(client.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const res = client.commands.find(cmd => cmd.name === commandName || cmd.aliases?.includes(commandName))
            ?.execute(client, message, args);

        if (res instanceof Promise) {
            res.catch( err => {
                console.error(err);
                message.reply('There was an error trying to execute that command!');
            });
        }
    }
}
