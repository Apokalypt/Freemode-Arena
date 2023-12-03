import { isDocument } from "@typegoose/typegoose";
import { ChannelType, Guild } from "discord.js";
import { MatchModel } from "@models/championship/Match";
import { Participant } from "@models/championship/Participant";
import { MatchmakingTicketDocument } from "@models/championship/MatchmakingTicket";
import { CHAMPIONSHIP_CHANNEL_ID, SUPPORT_ROLE_ID } from "@constants";
import { UnknownException } from "@exceptions/UnknownException";

export class MatchService {
    private static _instance: MatchService;
    public static get instance(): MatchService {
        if (!this._instance) {
            this._instance = new MatchService();
        }

        return this._instance;
    }


    public async createMatchFromTicket(guild: Guild, ticket: MatchmakingTicketDocument, opponent: Participant) {
        if (!ticket.populated("participant")) {
            await ticket.populate("participant");
        }

        if (!isDocument(ticket.participant)) {
            throw new UnknownException();
        }

        const count = await MatchModel.countDocuments();

        const channel = await guild.channels.fetch(CHAMPIONSHIP_CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) {
            throw new UnknownException();
        }

        const thread = await channel.threads.create({
            type: ChannelType.PrivateThread,
            invitable: false,
            name: `${ticket.participant.displayName} vs ${opponent.displayName} - ${String(count).padStart(4,'0')}`
        });

        // Randomly choose the map
        const maps = require('../data/maps.json');
        const map = maps[Math.floor(Math.random() * maps.length)];

        const match = await MatchModel.create({
            channel: {
                guildId: guild.id,
                channelId: thread.id,
                threadId: thread.id
            },
            platform: ticket.platform,
            players: [
                {
                    participant: ticket.participant._id,
                    weapons: { }
                },
                {
                    participant: opponent._id,
                    weapons: { }
                }
            ],
            map: {
                name: map.name,
                url: map.url
            }
        });

        ticket.match = match._id;
        await ticket.save();

        await thread.send({
            content: `# <@${ticket.participant._id}> VS <@${opponent._id}>\n` +
                "** **" +
                "Ce fil de discussion a été créé pour que vous puissiez organiser votre match et discuter avec les " +
                `organisateurs (<@&${SUPPORT_ROLE_ID}>) en cas de besoin.\n` +
                "\n" +
                "## Étapes\n" +
                "1. Chaque joueur sélectionne ses armes\n" +
                "2. Une fois ceci fait, le bot envoie un message avec les armes des deux joueurs\n" +
                "3. Les joueurs doivent se mettre d'accord sur une date\n" +
                "4. Les joueurs font leur match en enregistrant leur gameplay\n" +
                "5. Les joueurs envoient leur gameplay dans ce fil de discussion ou en privé à l'un des organisateurs\n" +
                "6. Les organisateurs vérifient le match et saisissent le score des joueurs\n" +
                "\n" +
                "## Où faire le match ?\n" +
                `Le match doit se faire sur la carte suivante: ${map.url}`,
            allowedMentions: {
                roles: [],
                users: [ticket.participant._id, opponent._id]
            }
        });

        return match;
    }
}
