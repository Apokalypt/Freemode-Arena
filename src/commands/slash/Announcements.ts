import path from "path";
import {
    APIMessageActionRowComponent,
    ButtonStyle,
    ComponentType,
    LocalizationMap,
    PermissionFlagsBits
} from "discord.js";
import { SlashCommand } from "@models/command/SlashCommand";
import { SubSlashCommandOption } from "@models/command/options/executable/SubSlashCommandOption";
import { RegisterForChampionshipAction } from "../../actions/RegisterForChampionshipAction";
import { SearchOpponentChampionshipAction } from "../../actions/SearchOpponentChampionshipAction";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import {
    DISABLE_MATCHMAKING,
    DISABLE_NEW_REGISTRATION,
    EMOJI_FAQ,
    EMOJI_VALIDATED,
    EMOJI_INFORMATION,
    EMOJI_MATCHMAKING,
    FAQ_CHANNEL_ID,
    SUPPORT_CHANNEL_ID,
    CHAMPIONSHIP_CHANNEL_ID
} from "@constants";

/**
 * [SUB-COMMAND] - Event home message
 */
const sc_HomeChampionshipMessage = "home" as const;
const sc_HomeChampionshipMessageLocalized: LocalizationMap = {
    fr: "accueil"
};
const sc_HomeChampionshipMessageDescription = "Send the home message for the championship";
const sc_HomeChampionshipMessageDescriptionLocalized: LocalizationMap = {
    fr: "Envoie le message d'accueil pour le championnat"
};

const sc_HomeChampionshipMessageCommand = new SubSlashCommandOption(
    sc_HomeChampionshipMessage, sc_HomeChampionshipMessageLocalized,
    sc_HomeChampionshipMessageDescription, sc_HomeChampionshipMessageDescriptionLocalized,
    { },
    async function (client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new InvalidActionException("La commande doit être exécutée dans un serveur");
        }

        await interaction.deferReply({ ephemeral: true });

        const channel = await interaction.guild.channels.fetch(interaction.channelId);
        if (!channel?.isTextBased()) {
            throw new InvalidActionException("La commande doit être exécutée dans un salon textuel");
        }

        const components: APIMessageActionRowComponent[] = [
            {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: "Règlement + FAQ",
                url: `https://discord.com/channels/${channel.guildId}/${FAQ_CHANNEL_ID}`,
                emoji: EMOJI_FAQ
            }
        ];
        if (!DISABLE_NEW_REGISTRATION) {
            const inscriptionButton: APIMessageActionRowComponent = {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: "S'inscrire",
                custom_id: "dummy-1"
            };
            const action = new RegisterForChampionshipAction({ });
            client.actions.linkComponentToAction(inscriptionButton, action);

            components.push(inscriptionButton);
        }

        await channel.send({
            content: "# Freemode Arena 6 🏆 \n" +
                "La nouvelle saison de Freemode Arena est maintenant lancée sur Glitch GTA France !\n" +
                "\n" +
                `### ${EMOJI_INFORMATION} Vous retrouverez, dans ce canal, les annonces suivantes :\n` +
                "- les avancements du tournoi 📈 \n" +
                "- les résultats de chaque matchs 📊 \n" +
                "- des \"stats of the day\" en fonction de la pertinence 📍 \n" +
                "- des clips issus des matchs 📸 \n" +
                "- et bien plus !",
            components: [{ type: ComponentType.ActionRow, components }],
            files: [
                path.join(__dirname, "..", "..", "assets", "freemode_arena_home.png")
            ]
        });

        if (!DISABLE_MATCHMAKING) {
            await channel.send(`-# ${EMOJI_INFORMATION} _Une fois inscrit, vous devrez vous rendre dans <#${CHAMPIONSHIP_CHANNEL_ID}> pour rechercher des adversaires._`);
        }

        await interaction.editReply({ content: "The message has been sent" });
    }
);


/**
 * [SUB-COMMAND] - Matchmaking
 */
const sc_MatchmakingChampionship = "matchmaking" as const;
const sc_MatchmakingChampionshipLocalized: LocalizationMap = {
    fr: "matchmaking"
};
const sc_MatchmakingChampionshipDescription = "Send the message to search an opponent for the championship";
const sc_MatchmakingChampionshipDescriptionLocalized: LocalizationMap = {
    fr: "Envoie le message afin de rechercher un adversaire pour le championnat"
};

const sc_MatchmakingChampionshipCommand = new SubSlashCommandOption(
    sc_MatchmakingChampionship, sc_MatchmakingChampionshipLocalized,
    sc_MatchmakingChampionshipDescription, sc_MatchmakingChampionshipDescriptionLocalized,
    { },
    async function (client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new InvalidActionException("La commande doit être exécutée dans un serveur");
        }

        await interaction.deferReply({ ephemeral: true });

        const channel = await interaction.guild.channels.fetch(interaction.channelId);
        if (!channel?.isTextBased()) {
            throw new InvalidActionException("La commande doit être exécutée dans un salon textuel");
        }

        const components: APIMessageActionRowComponent[] = [
            {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: "Règlement + FAQ",
                url: `https://discord.com/channels/${channel.guildId}/${FAQ_CHANNEL_ID}`,
                emoji: EMOJI_FAQ
            }
        ];
        if (!DISABLE_MATCHMAKING) {
            const matchmakingButton: APIMessageActionRowComponent = {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: "Chercher un adversaire",
                custom_id: "dummy-1",
                emoji: EMOJI_MATCHMAKING
            };
            const action = new SearchOpponentChampionshipAction({ });
            client.actions.linkComponentToAction(matchmakingButton, action);

            components.unshift(matchmakingButton);
        }

        await channel.send({
            content: "# LANCER UN MATCH 🏆 \n" +
                `${EMOJI_INFORMATION} Retrouvez dans ce canal les fils de discussions de chacun de vos matchs !\n` +
                "\n" +
                "## 🆘 Si besoin, clique sur le bouton \"J'ai besoin d'aide\" \n" +
                `_Le bot mentionne les organisateurs, et ils te répondront dans ton fil de joueur (sous le canal <#${SUPPORT_CHANNEL_ID}> )_\n` +
                "**Soyez patient, les organisateurs sont des bénévoles et ne sont pas à disposition 24h/24 ⏳**\n" +
                "\n" +
                "## Une fois qu'un match est lancé, vous êtes ajoutés ensemble dans un fil de discussion.\n" +
                "1. Sélectionnez vos armes 🔫 \n" +
                "2. Planifiez votre match 📆 \n" +
                `3. Validez votre enregistrement ${EMOJI_VALIDATED}` +
                "Maintenant, n'attendez plus et rejoignez l'arène ! ⚔️",
            components: [{ type: ComponentType.ActionRow, components }],
            files: [
                path.join(__dirname, "..", "..", "assets", "freemode_arena_VS.png")
            ]
        });

        await interaction.editReply({ content: "The message has been sent" });
    }
);


/**
 * [COMMAND]
 */
const name = "announcements" as const;
const nameLocalized: LocalizationMap = {
    fr: "annonces"
};
const description = "Manage announcements messages";
const descriptionLocalized: LocalizationMap = {
    fr: "Gère les messages d'annonces"
};

export = new SlashCommand(
    name, nameLocalized,
    description, descriptionLocalized,
    {
        [sc_HomeChampionshipMessage]: sc_HomeChampionshipMessageCommand,
        [sc_MatchmakingChampionship]: sc_MatchmakingChampionshipCommand
    },
    undefined,
    PermissionFlagsBits.ManageGuild
)
