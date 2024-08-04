import path from "path";
import {
    ButtonStyle,
    ComponentType,
    InteractionButtonComponentData,
    LocalizationMap,
    PermissionFlagsBits
} from "discord.js";
import { SlashCommand } from "@models/command/SlashCommand";
import { SubSlashCommandOption } from "@models/command/options/executable/SubSlashCommandOption";
import { RegisterForChampionshipAction } from "../../actions/RegisterForChampionshipAction";
import { SearchOpponentChampionshipAction } from "../../actions/SearchOpponentChampionshipAction";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { CHAMPIONSHIP_CHANNEL_ID, EMOJI_FAQ, EMOJI_INFORMATION, EMOJI_MATCHMAKING, FAQ_CHANNEL_ID } from "@constants";

/**
 * [SUB-COMMAND] - Event registering
 */
const sc_RegisterChampionship = "register" as const;
const sc_RegisterChampionshipLocalized: LocalizationMap = {
    fr: "inscription"
};
const sc_RegisterChampionshipDescription = "Send the registration message for the championship";
const sc_RegisterChampionshipDescriptionLocalized: LocalizationMap = {
    fr: "Envoie le message d'inscription pour le championnat"
};

const sc_RegisterChampionshipCommand = new SubSlashCommandOption(
    sc_RegisterChampionship, sc_RegisterChampionshipLocalized,
    sc_RegisterChampionshipDescription, sc_RegisterChampionshipDescriptionLocalized,
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

        const inscriptionButton: InteractionButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: "S'inscrire",
            customId: "dummy-1"
        };
        const action = new RegisterForChampionshipAction({ });
        client.actions.linkComponentToAction(inscriptionButton, action);

        await channel.send({
            content: "# Freemode Arena 5 🏆 \n" +
                "La nouvelle saison de Freemode Arena arrive sur Glitch GTA France !\n" +
                "C'est le moment de se battre et de gagner des duels. Inscris-toi et affronte d'autres participants " +
                "pour remporter un titre, et potentiellement des récompenses <:23_Dollar:1229109417497202804> \n" +
                "\n" +
                "# Les récompenses 🎁 \n" +
                "- Cartes cadeaux pour la majorité des participants\n" +
                "- Rôle unique et obtenable qu'avec une participation dans ce tournoi\n" +
                "- Expérience (RP) sur le serveur\n" +
                "\n" +
                "# Conditions d'accès 📝 \n" +
                "- Être sur PC, sur PS5 ou Xbox Series\n" +
                "- Devoir enregistrer son gameplay\n" +
                "- Un pseudonyme qui sera affiché sur les rediffusions (15 caractères)\n" +
                "- Accepter que son gameplay et son pseudo de jeu soit diffusé sur la chaîne de RedCrow\n" +
                "- Accepter que sa voix soit diffusé sur la chaîne de RedCrow (optionnel)\n" +
                "\n" +
                "# Comment participer ?\n" +
                "Clique sur le bouton ci-dessous ⤵️\n" +
                "\n" +
                `-# ${EMOJI_INFORMATION} _Une fois inscrit, vous devrez vous rendre dans <#${CHAMPIONSHIP_CHANNEL_ID}> pour rechercher des adversaires._`,
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        inscriptionButton,
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            label: "Règlement + FAQ",
                            url: `https://discord.com/channels/${channel.guildId}/${FAQ_CHANNEL_ID}`,
                            emoji: EMOJI_FAQ
                        }
                    ]
                }
            ]
        });

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

        const matchmakingButton: InteractionButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: "Chercher un adversaire",
            customId: "dummy-1",
            emoji: EMOJI_MATCHMAKING
        };
        const action = new SearchOpponentChampionshipAction({ });
        client.actions.linkComponentToAction(matchmakingButton, action);

        await channel.send({
            content: "# LANCER UN MATCH 🏆 \n" +
                "Faîtes un maximum de matchs contre les autres participants ! **Vous remporterez davantage de points 📈  ET de cashprize <:23_Dollar:1229109417497202804> **\n" +
                "\n" +
                "## Clique sur le bouton \"Je Cherche Un Adversaire\"\n" +
                "_Le bot cherche un adversaire sur la même plateforme que toi_\n" +
                "**Si aucun adversaire n'est trouvé, le bot te mettra dans la file d'attente ⏳**\n" +
                "\n" +
                "## Une fois qu'un adversaire est trouvé, vous êtes ajoutés ensemble dans un fil de discussion.\n" +
                "1. Sélectionnez vos armes 🔫 \n" +
                "2. Planifiez votre match 📆 \n" +
                "3. Validez votre enregistrement <:02_Accepter:1088997177935794257> \n" +
                "\n" +
                "Maintenant, n'attendez plus et lancez un match via \"Chercher un adversaire\" ⚔️",
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        matchmakingButton,
                        {
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            label: "Règlement + FAQ",
                            url: `https://discord.com/channels/${channel.guildId}/${FAQ_CHANNEL_ID}`,
                            emoji: EMOJI_FAQ
                        }
                    ]
                }
            ],
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
        [sc_RegisterChampionship]: sc_RegisterChampionshipCommand,
        [sc_MatchmakingChampionship]: sc_MatchmakingChampionshipCommand
    },
    undefined,
    PermissionFlagsBits.ManageGuild
)
