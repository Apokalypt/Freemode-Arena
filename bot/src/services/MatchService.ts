import { isDocument } from "@typegoose/typegoose";
import { ButtonStyle, ChannelType, ComponentType, Guild, InteractionButtonComponentData } from "discord.js";
import { CHAMPIONSHIP_CHANNEL_ID, SUPPORT_ROLE_ID } from "@constants";
import { ShowWeaponCategorySelectionAction } from "../actions/ShowWeaponCategorySelectionAction";
import { BotClient } from "@models/BotClient";
import { MatchMap } from "@models/championship/MatchMap";
import { MatchPlayer } from "@models/championship/MatchPlayer";
import { Participant } from "@models/championship/Participant";
import { InGameWeapon } from "@models/championship/InGameWeapon";
import { MatchDocument, MatchModel } from "@models/championship/Match";
import { MatchmakingTicketDocument } from "@models/championship/MatchmakingTicket";
import { UnknownException } from "@exceptions/UnknownException";
import { InvalidUserSelectionException } from "@exceptions/championship/InvalidUserSelectionException";

export class MatchService {
    private static _instance: MatchService;
    public static get instance(): MatchService {
        if (!this._instance) {
            this._instance = new MatchService();
        }

        return this._instance;
    }


    public async createMatchFromTicket(client: BotClient, guild: Guild, ticket: MatchmakingTicketDocument, opponent: Participant) {
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

        const map = this.getRandomMap();

        const match = await MatchModel.create({
            channel: {
                guildId: guild.id,
                channelId: channel.id,
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
            map
        });

        ticket.match = match._id;
        await ticket.save();

        const buttonToSelectWeapons: InteractionButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: "Sélectionner mes armes",
            customId: "dummy-id-0"
        };
        const action = new ShowWeaponCategorySelectionAction({ });
        await client.actions.linkComponentToAction(action, buttonToSelectWeapons);

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
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [buttonToSelectWeapons]
                }
            ],
            allowedMentions: {
                roles: [],
                users: [ticket.participant._id, opponent._id]
            }
        });

        return match;
    }

    public async getMatchFromDiscordChannel(guildId: string, threadId: string): Promise<MatchDocument | null> {
        return MatchModel.findOne({
            "channel.guildId": guildId,
            "channel.channelId": { $ne: threadId },
            "channel.threadId": threadId
        }).exec();
    }

    public getRandomMap(): MatchMap {
        const maps: MapRawData[] = require('../data/maps.json');
        const mapData = maps[Math.floor(Math.random() * maps.length)];

        return new MatchMap(mapData.name, mapData.url);
    }

    public getWeaponsCategories(): CategoryRawData[] {
        return require('../data/weapons.json');
    }
    public getWeaponsCategoryFromId(categoryId: string): CategoryRawData {
        const category = this.getWeaponsCategories().find( c => c.id.toString() === categoryId );
        if (!category) {
            throw new UnknownException();
        }

        return category;
    }

    public updatePlayerSelectionOnCategory(categoryId: string, weaponIds: string[], player: MatchPlayer) {
        let selection = player.weapons.selection;

        const category = this.getWeaponsCategories().find( c => c.id.toString() === categoryId );
        if (!category) {
            throw new UnknownException();
        }

        // Remove all weapons selected by the player from the category
        selection = selection.filter( w => !category.weapons.find( weapon => weapon.name == w.name ) );
        // Add all weapons selected by the player to the category
        selection.push(
            ...category.weapons.filter( (_, index) => weaponIds.includes(index.toString()) )
                .map( w => new InGameWeapon(w.name, w.value) )
        );

        player.weapons.selection = selection;
        if (player.weapons.selectionCost > player.weapons.budget) {
            throw new InvalidUserSelectionException(
                `La somme de vos armes sélectionnées dépasse votre budget (${player.weapons.selectionCost} / ${player.weapons.budget}).`
            );
        }

        return category;
    }
}

interface MapRawData {
    name: string;
    url: string;
}

interface WeaponRawData {
    name: string;
    value: number;
}

interface CategoryRawData {
    id: number;
    name: string;
    weapons: WeaponRawData[];
}
