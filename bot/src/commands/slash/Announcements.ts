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
        client.actions.linkComponentToAction(action, inscriptionButton);

        await channel.send({
            content: "# Freemode Arena - Saison 4\n" +
                "\n" +
                "La nouvelle saison de **Freemode Arena** arrive sur **Glitch GTA France** !\n" +
                "C'est le moment de montrer à tout le monde qui est le patron des duels Freemode, inscris-toi et affronte d'autres participants pour t'amuser et, potentiellement, gagner des cadeaux!\n" +
                "\n" +
                "## Les récompenses\n" +
                "- Cartes cadeaux pour la majorité des participants\n" +
                "- Rôle unique et obtenable qu'avec une participation dans ce tournoi\n" +
                "- Expérience (RP) sur le serveur\n" +
                "\n" +
                "## Conditions d'accès\n" +
                "- Être sur PC, sur PS5 ou Xbox Series\n" +
                "- Pouvoir enregistrer son gameplay (boitier d'acquisition, capture de jeu de votre console, ...)\n" +
                "- Accepter que son gameplay soit diffusé sur la [chaîne de RedCrow](<https://www.youtube.com/c/RedCrow>)\n" +
                "- Avoir une armurerie sur GTA Online - *Optionnel mais grandement conseillé*\n" +
                "- Pseudonyme qui sera affiché sur les rediffusions\n" +
                "\n" +
                "## Comment participer ?\n" +
                "Clique sur le bouton ci-dessous :arrow_heading_down: ",
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [inscriptionButton]
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
            customId: "dummy-1"
        };
        const action = new SearchOpponentChampionshipAction({ });
        client.actions.linkComponentToAction(action, matchmakingButton);

        await channel.send({
            content: "# Trouver un adversaire pour faire des points\n" +
                "\n" +
                "Vous souhaitez gagner ? Faîtes un **maximum de matchs** contre les autres participants !\n" +
                "\n" +
                "1. Clique sur le bouton \"Je Cherche Un Adversaire\"\n" +
                "2. Le bot cherche un adversaire sur la même plateforme que toi\n" +
                "  - *Si aucun adversaire n'est trouvé, le bot te mettra dans la file d'attente*\n" +
                "3. Une fois qu'un adversaire est trouvé, vous êtes ajoutés dans le même fil de discussion pour :\n" +
                "  - Sélectionnez vos armes\n" +
                "  - Planifiez votre match\n" +
                "  - Validez votre enregistrement\n" +
                "\n" +
                ":arrow: N'attends plus et clique sur \"Chercher un adversaire\" !",
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [matchmakingButton]
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
