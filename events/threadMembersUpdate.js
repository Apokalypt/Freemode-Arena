const { Events } = require('discord.js');
const Match = require('../db/Match');
const Participant = require('../db/Participant');

module.exports = {
    name: Events.ThreadMembersUpdate,
    once: false,
    /**
     * @param {FreemodeClient} client
     * @param {import('discord.js').Collection<string, import('discord.js').ThreadMember>} addedMembers
     * @param {import('discord.js').Collection<string, import('discord.js').ThreadMember>} removedMembers
     * @param {import('discord.js').AnyThreadChannel} partialThread
     */
    async execute(client, addedMembers, removedMembers, partialThread) {
        if (removedMembers.size === 0) {
            return
        }

        /**
         * @type {import('discord.js').AnyThreadChannel}
         */
        const thread = await partialThread.fetch();

        switch (thread.parentId) {
            case process.env.FREEMODE_CHANNEL_ORGANIZATION:
                const match = await Match.findOne({ thread: thread.id });
                if (!match) break;

                const players = [match.players['1'].id, match.players['2'].id].filter( id => removedMembers.has(id) );
                if (players.length > 0) {
                    const res = await Promise.all(
                        players.map( id => thread.members.add(id).then( () => true ).catch( () => false ) )
                    );

                    if (res.some( r => r )) {
                        await thread.send({
                            content: `Vous ne pouvez pas quitter ce fil de discussion car vous êtes un participant du match!`
                        });
                    }
                }
                break;
            case process.env.FREEMODE_CHANNEL_ANNOUNCEMENTS:
                const res = await Promise.all(
                    removedMembers.map( async member => {
                        const participant = await Participant.findOne({ id: member.id, thread: thread.id })
                        if (participant) {
                            return thread.members.add(participant.id).then( () => true ).catch( () => false );
                        }

                        return false
                    })
                );

                if (res.some( r => r )) {
                    await thread.send({
                        content: `Vous ne pouvez pas quitter ce fil de discussion le temps du tournoi.`
                    });
                }

                break;
        }
    }
}
