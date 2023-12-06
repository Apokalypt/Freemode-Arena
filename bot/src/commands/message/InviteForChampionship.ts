import { ButtonComponentData, ButtonStyle, ComponentType, PermissionFlagsBits } from "discord.js";
import { MessageContextMenuCommand } from "@models/command/MessageContextMenuCommand";
import { RegisterForChampionshipAction } from "../../actions/RegisterForChampionshipAction";
import { UnknownGuildException } from "@exceptions/guild/UnknownGuildException";
import { FAQ_CHANNEL_ID } from "@constants";

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

        const registerButton: ButtonComponentData = {
            customId: "dummy",
            type: ComponentType.Button,
            style: ButtonStyle.Primary,
            label: "Je m'inscris !"
        };
        client.actions.linkComponentToAction(registerButton, new RegisterForChampionshipAction({ }));

        const faqButton: ButtonComponentData = {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: "FAQ",
            url: `https://discord.com/channels/${interaction.guildId}/${FAQ_CHANNEL_ID}`
        };

        await interaction.reply({
            content: "## Intéressé par Freemode Arena ? Inscris-toi :arrow_heading_down:",
            components: [
                { type: ComponentType.ActionRow, components: [registerButton, faqButton] }
            ],
            ephemeral: false
        });
    },
    PermissionFlagsBits.ManageMessages
);
