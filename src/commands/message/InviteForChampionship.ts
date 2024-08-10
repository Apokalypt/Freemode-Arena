import { ButtonComponentData, ButtonStyle, ComponentType, PermissionFlagsBits } from "discord.js";
import { MessageContextMenuCommand } from "@models/command/MessageContextMenuCommand";
import { RegisterForChampionshipAction } from "../../actions/RegisterForChampionshipAction";
import { UnknownGuildException } from "@exceptions/guild/UnknownGuildException";
import { CHAMPIONSHIP_END_DATE, EMOJI_FAQ, FAQ_CHANNEL_ID } from "@constants";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";

const commandName = "Invite for FA" as const;

export = new MessageContextMenuCommand(
    commandName,
    {
        "en-US": "Invite for FA",
        "en-GB": "Invite for FA",
        "fr": "Inviter pour FA",
    },
    "Send a message that allow people to register for the championship.",
    {
        "en-US": "Send a message that allow people to register for the championship.",
        "en-GB": "Send a message that allow people to register for the championship.",
        "fr": "Envoie un message qui permet aux gens de s'inscrire au championnat.",
    },
    async function(client, interaction) {
        if (!interaction.inCachedGuild()) {
            throw new UnknownGuildException(interaction.guildId ?? "*Unknown*");
        }

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        const registerButton: ButtonComponentData = {
            customId: "dummy",
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: "Je m'inscris !",
            emoji: { name: "🏆"}
        };
        client.actions.linkComponentToAction(registerButton, new RegisterForChampionshipAction({ }));

        const faqButton: ButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: "FAQ",
            url: `https://discord.com/channels/${interaction.guildId}/${FAQ_CHANNEL_ID}`,
            emoji: EMOJI_FAQ
        };

        await interaction.targetMessage.reply({
            content: "## Intéressé par Freemode Arena ? Inscris-toi :arrow_heading_down:",
            components: [
                { type: ComponentType.ActionRow, components: [registerButton, faqButton] }
            ]
        });

        await interaction.reply({ content: "Message envoyé !", ephemeral: true });
    },
    PermissionFlagsBits.ManageMessages
);
