const { Events } = require('discord.js');
const Match = require('../db/Match');
const Participant = require('../db/Participant');

module.exports = {
    name: Events.GuildMemberUpdate,
    once: false,
    /**
     * @param {FreemodeClient} client
     * @param {import('discord.js').GuildMember | import('discord.js').PartialGuildMember} oldMember
     * @param {import('discord.js').GuildMember} newMember
     */
    async execute(client, oldMember, newMember) {
        const platformsRole = Object.values(require('../utils/platforms')).reduce( (acc, roles) => {
            acc.push(...roles);
            return acc
        }, [] );

        const oldRoles = oldMember.roles.cache.map( role => role.id );
        if (oldRoles.find( role => platformsRole.includes(role) )) {
            return;
        }

        const newRoles = [...newMember.roles.cache.keys()];
        if (newRoles.includes(process.env.FREEMODE_PARTICIPANT_ROLE_ID)) {
            return;
        }
        if (!newRoles.find( role => platformsRole.includes(role) )) {
            return;
        }

        const participant = await Participant.findOne({ id: newMember.id });
        if (!participant) {
            return;
        }

        await newMember.roles.add(process.env.FREEMODE_PARTICIPANT_ROLE_ID)
            .then( async () => {
                const channelAnnouncements = await newMember.guild.channels.fetch(process.env.FREEMODE_CHANNEL_ANNOUNCEMENTS);
                const threadParticipant = await channelAnnouncements.threads.fetch(participant.thread).catch( () => null );
                if (threadParticipant) {
                    await threadParticipant.members.add(newMember.id).catch( () => null );
                }

                const channelOrganization = await newMember.guild.channels.fetch(process.env.FREEMODE_CHANNEL_ORGANIZATION);
                const matches = await Match.find({ $or: [
                    { 'players.1.id': newMember.id },
                    { 'players.2.id': newMember.id }
                ] }).exec();

                await Promise.all(
                    matches.map( async match => {
                        const threadMatch = await channelOrganization.threads.fetch(match.thread).catch( () => null );
                        if (threadMatch) {
                            await threadMatch.members.add(newMember.id).catch( () => null );
                        }
                    })
                );
            })
            .catch(console.error);
    }
}
