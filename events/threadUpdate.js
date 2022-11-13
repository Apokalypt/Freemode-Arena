const { Events } = require('discord.js');

module.exports = {
    name: Events.ThreadUpdate,
    once: false,
    /**
     * @param {FreemodeClient} client
     * @param {import('discord.js').AnyThreadChannel} newThread
     * @param {import('discord.js').AnyThreadChannel} oldThread
     */
    async execute(client, oldThread, newThread) {
        if (newThread.locked) return;

        if (!newThread.archived) return;

        await newThread.fetch();
        const channelsWatched = [
            process.env.FREEMODE_CHANNEL_FAQ ?? '',
            process.env.FREEMODE_CHANNEL_ANNOUNCEMENTS ?? '',
            process.env.FREEMODE_CHANNEL_ORGANIZATION ?? ''
        ];

        if (!channelsWatched.includes(newThread.parentId)) return;

        await newThread.setArchived(false, 'Freemode Arena thread shouldn\'t be archived.');
    }
}
