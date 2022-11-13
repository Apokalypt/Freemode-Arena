const { Message } = require('../builder');

module.exports = {
    name: 'init',
    /**
     * @param {FreemodeClient} client
     * @param {import('discord.js').Message} message
     * @param _args
     */
    async execute(client, message, _args) {
        if (!message.inGuild()) return;

        const guild = message.guild;

        const announcementChannel = await guild.channels.fetch(process.env.FREEMODE_CHANNEL_ANNOUNCEMENTS);
        if (!announcementChannel || !announcementChannel.isTextBased()) {
            throw new Error('Channel d\'annonce introuvable');
        }

        const organizationChannel = await guild.channels.fetch(process.env.FREEMODE_CHANNEL_ORGANIZATION);
        if (!organizationChannel || !organizationChannel.isTextBased()) {
            throw new Error('Channel d\'organisation introuvable');
        }

        await Promise.all([
            Message.sendAnnouncementMessage(announcementChannel),
            Message.sendOrganizationMessage(organizationChannel)
        ]);
    }
}
