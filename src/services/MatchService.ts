import type { ParticipantDocument } from "@models/championship/Participant";
import path from "path";
import { isDocument } from "@typegoose/typegoose";
import {
    AttachmentBuilder,
    ButtonStyle,
    ChannelType,
    ComponentType, EmbedBuilder,
    Guild,
    InteractionButtonComponentData,
    type InteractionReplyOptions,
    type APIActionRowComponent, type APIMessageActionRowComponent, type APIButtonComponentWithCustomId,
    type APIStringSelectComponent
} from "discord.js";
import { BotClient } from "@models/BotClient";
import { MatchMap } from "@models/championship/MatchMap";
import { MatchPlayer } from "@models/championship/MatchPlayer";
import { InGameWeapon } from "@models/championship/InGameWeapon";
import { MatchDocument, MatchModel } from "@models/championship/Match";
import { MatchmakingTicketDocument } from "@models/championship/MatchmakingTicket";
import { ShowWeaponsSelectionAction } from "../actions/ShowWeaponsSelectionAction";
import { UpdateWeaponsSelectionAction } from "../actions/UpdateWeaponsSelectionAction";
import { ShowWeaponSelectionMenuAction } from "../actions/ShowWeaponSelectionMenuAction";
import { ValidateWeaponsSelectionAction } from "../actions/ValidateWeaponsSelectionAction";
import { UnknownException } from "@exceptions/UnknownException";
import { InvalidUserSelectionException } from "@exceptions/championship/InvalidUserSelectionException";
import { Platforms } from "@enums";
import {
    TOKENS_GROUP_METHOD,
    BASE_TOKENS_COUNT,
    CHAMPIONSHIP_CHANNEL_ID,
    SUPPORT_ROLE_ID,
    EMOJI_INFORMATION,
    EMOJI_RIGHT_ARROW,
    ENABLE_ADVANCED_MAP_RANDOMIZER,
    ENABLE_LEVEL_BASED_ADVANTAGE
} from "@constants";

export class MatchService {
    private static _instance: MatchService;
    public static get instance(): MatchService {
        if (!this._instance) {
            this._instance = new MatchService();
        }

        return this._instance;
    }


    public async createMatchManually(client: BotClient, guild: Guild, platform: Platforms, firstParticipant: ParticipantDocument, secondParticipant: ParticipantDocument, phase: string) {
        return this._createMatch(
            client,
            guild,
            platform,
            firstParticipant,
            secondParticipant,
            phase
        );
    }

    public async createMatchFromTicket(client: BotClient, guild: Guild, ticket: MatchmakingTicketDocument, opponent: ParticipantDocument) {
        if (!ticket.populated("participant")) {
            await ticket.populate("participant");
        }

        if (!isDocument(ticket.participant)) {
            throw new UnknownException();
        }

        return this._createMatch(
            client,
            guild,
            ticket.platform,
            ticket.participant,
            opponent,
            undefined,
            ticket
        )
    }

    public async getMatchFromId(id: string): Promise<MatchDocument | null> {
        return MatchModel.findById(id).exec();
    }

    public async getMatchFromDiscordChannel(guildId: string, threadId: string): Promise<MatchDocument | null> {
        return MatchModel.findOne({
            "channel.guildId": guildId,
            "channel.channelId": { $ne: threadId },
            "channel.threadId": threadId
        }).exec();
    }

    public async getRandomMap(firstPlayerId: string, secondPlayerId: string): Promise<MatchMap> {
        const maps: MapRawData[] = require('../data/maps.json');

        if (!ENABLE_ADVANCED_MAP_RANDOMIZER) {
            const random = Math.floor(Math.random() * maps.length);
            return MatchMap.fromRawData(maps[random]);
        }

        const result: AggregatedMapCount[] = await MatchModel.aggregate([
            { $match: { "players.participant": { $in: [firstPlayerId, secondPlayerId] } } },
            { $group: { _id: "$map.name", count: { $sum: 1 } } }
        ]).exec();

        let minCount = Number.MAX_SAFE_INTEGER;
        let globalCount = 0;
        const mapsWithCount: MapWithCountRawData[] = maps.map( map => {
            const count = result.find( r => r._id === map.name )?.count ?? 0;
            if (count < minCount) {
                minCount = count;
            }

            globalCount += count;
            return { ...map, count, probability: 1 / maps.length };
        });

        let countTo0 = 0;
        if (minCount === 0) {
            countTo0 = mapsWithCount.filter(map => map.count === 0).length;
        } else {
            for (const map of mapsWithCount) {
                map.count -= minCount;
                globalCount -= minCount;

                if (map.count === 0) {
                    countTo0++;
                }
            }
        }

        if (globalCount !== 0) {
            for (const map of mapsWithCount) {
                if (map.count === 0) {
                    map.probability = 1 / mapsWithCount.length + ((1 / mapsWithCount.length) / countTo0)
                } else {
                    map.probability = (1 / mapsWithCount.length) * ((globalCount - map.count) / globalCount);
                }
            }
        }

        const random = Math.random();
        let sum = 0;
        for (const map of mapsWithCount) {
            sum += map.probability;
            if (random <= sum) {
                return MatchMap.fromRawData(map);
            }
        }

        // Should never happen
        return MatchMap.fromRawData(mapsWithCount[mapsWithCount.length - 1]);
    }

    public async findAllPlayerMatches(id: string): Promise<MatchDocument[]> {
        return MatchModel.find({ "players.participant": id }).exec();
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
        const category = this.getWeaponsCategoryFromId(categoryId);
        let selection = player.weapons.selection;

        // Remove all weapons selected by the player from the category
        selection = selection.filter( w => !category.weapons.find( weapon => weapon.name == w.name ) );
        // Add all weapons selected by the player to the category
        selection.push(
            ...category.weapons.filter( (_, index) => weaponIds.includes(index.toString()) )
                .map( w => new InGameWeapon(category.name, w.name, w.value) )
        );

        player.weapons.selection = selection;
        if (TOKENS_GROUP_METHOD === "global") {
            const selectionCost = player.weapons.globalSelectionCost();
            if (selectionCost > player.weapons.budget) {
                throw new InvalidUserSelectionException(
                    `La somme de vos armes sélectionnées dépasse votre budget (${selectionCost} / ${player.weapons.budget}).`
                );
            }
        } else {
            const categoryName = category.name;
            const categorySelectionCost = player.weapons.categorySelectionCost(categoryName);
            if (categorySelectionCost > player.weapons.budget) {
                throw new InvalidUserSelectionException(
                    `Le nombre d'armes sélectionnées dans la catégorie "${categoryName}" dépasse votre budget (${categorySelectionCost} / ${player.weapons.budget}).`
                );
            }
        }

        return category;
    }

    public buildPlayerWeaponSelectionMenu(client: BotClient, player: MatchPlayer, category: CategoryRawData) {
        const hasOnlyOneCategory = this.getWeaponsCategories().length === 1;

        const actionButton: APIStringSelectComponent = {
            type: ComponentType.StringSelect,
            custom_id: "dummy-weapons-selection",
            placeholder: "Clique ici pour sélectionner une arme",
            min_values: 0,
            max_values: category.weapons.length,
            options: category.weapons.map( (weapon, index) => ({
                label: weapon.name,
                value: index.toString(),
                default: player.weapons.selection.find( w => w.name === weapon.name ) != null,
                description: `${weapon.value} pts`
            }) )
        };
        const action = new UpdateWeaponsSelectionAction({ categoryId: category.id.toString() });
        client.actions.linkComponentToAction(actionButton, action, "weaponIds");

        const backButton: APIButtonComponentWithCustomId = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: "dummy-back",
            label: hasOnlyOneCategory ? "Retour au menu principal" : "Retour aux catégories",
            emoji: { name: "🔙" }
        };
        const actionToBackToCategories = hasOnlyOneCategory ? new ShowWeaponSelectionMenuAction({ })
            : new ShowWeaponsSelectionAction({ });
        client.actions.linkComponentToAction(backButton, actionToBackToCategories);

        let title = "Menu - Sélection d'armes";
        if (category.name) {
            title += ` "${category.name}"`;
        }
        const footer = "Clique ci-dessous pour sélectionner les armes à ajouter/retirer";

        return this._buildPlayerMenu(
            player,
            title,
            footer,
            [
                { type: ComponentType.ActionRow, components: [actionButton] },
                { type: ComponentType.ActionRow, components: [backButton] }
            ]
        );
    }

    public buildPlayerCategorySelectionMenu(client: BotClient, player: MatchPlayer) {
        const categories = this.getWeaponsCategories();

        const actionButton: APIStringSelectComponent = {
            type: ComponentType.StringSelect,
            custom_id: "dummy",
            placeholder: "Clique ici pour sélectionner une catégorie d'arme",
            min_values: 1,
            max_values: 1,
            options: categories.map( category => ({
                label: category.name,
                value: category.id.toString(),
            }) )
        };
        const action = new ShowWeaponsSelectionAction({ });
        client.actions.linkComponentToAction(actionButton, action, "categoryId");

        const backButton: APIButtonComponentWithCustomId = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            custom_id: "dummy-back-to-categories",
            label: "Retour au menu principal",
            emoji: { name: "🔙" }
        };
        const actionToBackToHomeMenu = new ShowWeaponSelectionMenuAction({ });
        client.actions.linkComponentToAction(backButton, actionToBackToHomeMenu);

        return this._buildPlayerMenu(
            player,
            "Menu - Catégories d'armes",
            "Clique ci-dessous pour sélectionner la catégorie de l'arme à ajouter/retirer",
            [
                { type: ComponentType.ActionRow, components: [actionButton] },
                { type: ComponentType.ActionRow, components: [backButton] }
            ]
        );
    }

    public buildDashboardPlayerMenu(client: BotClient, player: MatchPlayer) {
        const categories = this.getWeaponsCategories();
        const categoryId: string | undefined = categories.length === 1 ? categories[0].id.toString() : undefined;

        const buttonToSelectWeapons: APIButtonComponentWithCustomId = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: "Modifier la sélection",
            custom_id: "dummy-id-0",
            disabled: !player.weapons.selectionIsUpdatable(),
            emoji: { name: "✏️" }
        };
        const action = new ShowWeaponsSelectionAction({ categoryId });
        client.actions.linkComponentToAction(buttonToSelectWeapons, action);

        const validationButton: APIButtonComponentWithCustomId = {
            type: ComponentType.Button,
            style: ButtonStyle.Success,
            custom_id: "dummy-validate-selection",
            label: "Valider la sélection",
            disabled: !player.weapons.selectionIsUpdatable() || !player.weapons.hasReachedBudgetSelection()
        };
        const actionToValidate = new ValidateWeaponsSelectionAction({ });
        client.actions.linkComponentToAction(validationButton, actionToValidate);

        return this._buildPlayerMenu(
            player,
            "Tableau de bord",
            "Clique ci-dessous pour modifier ta sélection ou la valider",
            [
                {
                    type: ComponentType.ActionRow,
                    components: [buttonToSelectWeapons, validationButton]
                }
            ]
        );
    }

    private _buildPlayerMenu(player: MatchPlayer, title: string, footer: string, components: APIActionRowComponent<APIMessageActionRowComponent>[]): InteractionReplyOptions {
        let selectionSection = "## Sélection";
        if (TOKENS_GROUP_METHOD === "global") {
            const categories = this.getWeaponsCategories();
            const atLeastWeaponCostMore = categories.some(category => {
                return category.weapons.some( weapon => weapon.value !== 1 );
            })

            if (atLeastWeaponCostMore) {
                selectionSection += ` - ${player.weapons.globalSelectionCost()} / ${player.weapons.budget} jetons`;
            } else {
                selectionSection += ` - ${player.weapons.selection.length} / ${player.weapons.budget} armes`;
            }
        }
        selectionSection += `\n${player.weapons.stringifySelection()}`;

        let content = `# ${title}\n` +
            "\n" +
            "## Status\n" +
            `${player.weapons.stringifyStatus()}\n` +
            `${selectionSection}\n` +
            "\n" +
            `### ${footer} :arrow_heading_down:`;

        return { content, components };
    }

    private _getBudget(participant: ParticipantDocument, opponent: ParticipantDocument): number {
        if (!ENABLE_LEVEL_BASED_ADVANTAGE) {
            return BASE_TOKENS_COUNT;
        }

        const levelDifference = opponent.level - participant.level;
        const multiplier = Math.abs(levelDifference) === 2 ? 3 : 2;

        return BASE_TOKENS_COUNT + (levelDifference * multiplier);
    }

    private _formatMatchPlayerMention(participant: ParticipantDocument, opponent: ParticipantDocument): string {
        if (!ENABLE_LEVEL_BASED_ADVANTAGE) {
            return `<@${participant._id}>`;
        }

        return `<@${participant._id}> ( ${participant.levelStr} ) ${EMOJI_RIGHT_ARROW} _${this._formatAdvantage(participant, opponent)}_`
    }

    private _formatAdvantage(player: ParticipantDocument, opponent: ParticipantDocument): string {
        const budget = this._getBudget(player, opponent);

        if (budget === BASE_TOKENS_COUNT) {
            return "Aucun avantage";
        } else if (budget > BASE_TOKENS_COUNT) {
            return `+${budget - BASE_TOKENS_COUNT} jetons pour ton choix d'arme`;
        } else {
            return `-${BASE_TOKENS_COUNT - budget} jetons pour ton choix d'arme`;
        }
    }

    private async _createMatch(client: BotClient, guild: Guild, platform: Platforms, firstParticipant: ParticipantDocument, secondParticipant: ParticipantDocument, phase?: string, matchmakingTicket?: MatchmakingTicketDocument) {
        const count = await MatchModel.countDocuments();

        const channel = await guild.channels.fetch(CHAMPIONSHIP_CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) {
            throw new UnknownException();
        }

        let nameThread = `${firstParticipant.displayName} vs ${secondParticipant.displayName} - ${String(count).padStart(4,'0')}`;
        if (phase) {
            nameThread = `${phase} - ${nameThread}`;
        }

        const thread = await channel.threads.create({
            type: ChannelType.PrivateThread,
            invitable: false,
            name: nameThread
        });

        const map = await this.getRandomMap(firstParticipant._id, secondParticipant._id);

        const match = await MatchModel.create({
            channel: {
                guildId: guild.id,
                channelId: channel.id,
                threadId: thread.id
            },
            platform,
            players: [
                {
                    participant: firstParticipant._id,
                    weapons: { budget: this._getBudget(firstParticipant, secondParticipant) }
                },
                {
                    participant: secondParticipant._id,
                    weapons: { budget: this._getBudget(secondParticipant, firstParticipant) }
                }
            ],
            map
        });

        if (matchmakingTicket) {
            // Link the created match to the matchmaking ticket
            matchmakingTicket.match = match._id;
            await matchmakingTicket.save();
        }

        const buttonToSelectWeapons: InteractionButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: "Sélectionner mes armes",
            customId: "dummy-id-0",
            emoji: { name: "🔫" }
        };
        const action = new ShowWeaponSelectionMenuAction({ });
        client.actions.linkComponentToAction(buttonToSelectWeapons, action);

        const file = new AttachmentBuilder(path.join(__dirname, '../assets/maps', map.filename));

        let titleMatch = `# Nouveau Match - ${platform} 🏆 `;
        if (phase) {
            titleMatch = `# ${phase} - ${platform} 🏆 `;
        }

        const message = await thread.send({
            content: `${titleMatch}\n` +
                `${EMOJI_INFORMATION} Ce fil de discussion a été créé pour que vous puissiez organiser votre match. Les organisateurs () sont aussi présent en cas de besoin.\n` +
                "\n" +
                "## Joueurs ⚔️ \n" +
                `- ${this._formatMatchPlayerMention(firstParticipant, secondParticipant)}\n` +
                `- ${this._formatMatchPlayerMention(secondParticipant, firstParticipant)}\n` +
                "\n" +
                "## Étapes à effectuer 📝 \n" +
                "1. Sélectionnez vos trois armes 🔫 \n" +
                "2. Quand les deux joueurs auront sélectionné leurs armes, le bot enverra un message avec les armes des deux joueurs 🧾 \n" +
                "3. Mettez vous d'accord sur une date de match 📅 \n" +
                "4. Faites votre match en enregistrant le gameplay 🎥 \n" +
                "5. Envoyez le gameplay dans ce fil de discussion 📬 \n" +
                "6. Les organisateurs vérifient le match et saisissent le score des joueurs 📊 \n" +
                "\n" +
                "## Où faire le match ? 🗺️ \n" +
                `Le match doit se faire sur l'activité suivante : <${map.activity}>`,
            embeds: [
                new EmbedBuilder().setImage(`attachment://${map.filename}`)
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [buttonToSelectWeapons]
                }
            ],
            allowedMentions: {
                roles: [],
                users: [firstParticipant._id, secondParticipant._id]
            },
            files: [file]
        });
        setImmediate( () => {
            return Promise.allSettled([
                message.pin(),
                message.edit({ content: message.content.replace("()", `(<@&${SUPPORT_ROLE_ID}>)`) })
            ])
        });

        return match;
    }
}

interface MapRawData {
    name: string;
    url: string;
}
interface MapWithCountRawData extends MapRawData {
    count: number;
    probability: number;
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

interface AggregatedMapCount {
    _id: string;
    count: number;
}
