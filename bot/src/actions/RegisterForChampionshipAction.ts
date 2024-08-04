import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { MessageActionRowComponentBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ThreadAutoArchiveDuration } from "discord.js";
import { DiscordChannel } from "@models/championship/DiscordChannel";
import { ParticipantDocument, ParticipantModel } from "@models/championship/Participant";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { IntermediateModel } from "@decorators/database";
import { MatchmakingService } from "@services/MatchmakingService";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { RegistrationRefusedException } from "@exceptions/championship/RegistrationRefusedException";
import { ACTION_CODES, DATABASE_MODELS, Platforms } from "@enums";
import {
    CHAMPIONSHIP_CHANNEL_ID, CHAMPIONSHIP_END_DATE,
    CHAMPIONSHIP_ROLE_ID, EMOJI_FAQ, EMOJI_MATCHMAKING, EMOJI_RIGHT_ARROW, EMOJI_SUPPORT,
    FAQ_CHANNEL_ID,
    SUPPORT_CHANNEL_ID,
    SUPPORT_ROLE_ID
} from "@constants";

type RegisterForChampionshipActionProperties = WithoutModifiers<RegisterForChampionshipAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_REGISTER_CHAMPIONSHIP, { allowMixed: true })
export class RegisterForChampionshipAction extends Action<"ACTION_REGISTER_CHAMPIONSHIP"> {
    constructor(data: Partial<RegisterForChampionshipActionProperties>) {
        super({ ...data, __type: "ACTION_REGISTER_CHAMPIONSHIP" });
    }

    protected override _getContext(
        client: BotClient,
        input: InputRegisterForChampionshipAction,
        interaction: InteractionForAction<'cached'>
    ): RegisterForChampionshipActionExecutionContext {
        return new RegisterForChampionshipActionExecutionContext(client, RegisterForChampionshipAction, input, interaction);
    }
}

type InputRegisterForChampionshipAction = InputAction<"ACTION_REGISTER_CHAMPIONSHIP">;
type InputRegisterForChampionshipActionValidated = InputActionValidated<"ACTION_REGISTER_CHAMPIONSHIP">;

class RegisterForChampionshipActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputRegisterForChampionshipAction, InputRegisterForChampionshipActionValidated, "ACTION_REGISTER_CHAMPIONSHIP"> {

    protected override async _checkActionValidity(): Promise<InputRegisterForChampionshipActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId };
    }

    protected async _execute(this: RegisterForChampionshipActionExecutionContext<true>): Promise<void> {
        const guild = await super._getGuild(true);
        const channel = await guild.channels.fetch(SUPPORT_CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) {
            throw new Error("The support channel ID provided is not a text channel.");
        }

        const user = await super._getExecutorMember(true);

        const alreadyRegistered = await ParticipantModel.exists({ _id: user.id });
        if (alreadyRegistered) {
            throw new RegistrationRefusedException("Vous êtes déjà inscrit au championnat.");
        }

        const userPlatforms = await MatchmakingService.instance.getUserPlatforms(guild, user.id);
        if (userPlatforms.length === 0) {
            throw new InvalidPlayerStateException("Vous n'avez pas sélectionné de plateforme dans <id:customize>.")
        }

        const displayName = await this._askForText(
            "Profil - Freemode Arena 5",
            {
                title: "Pseudo à afficher sur le classement",
                required: true,
                default: user.displayName,
                maxLength: 100
            }
        );

        let platform: Platforms;
        if (userPlatforms.length === 1) {
            platform = userPlatforms[0];
        } else {
            platform = await this._askForStringSelection({
                title: "Sur quelle plateforme souhaitez-vous jouer?",
                description: "Choisissez la plateforme sur laquelle vous souhaitez jouer ce championnat.",
                options: userPlatforms.map( platform => ({ label: platform, value: platform }) ),
                placeholder: "Cliquez ici pour choisir une plateforme...",
                minNumberOfOptions: 1,
                maxNumberOfOptions: 1
            }) as Platforms;
        }

        // We create the document first to avoid concurrency issues and check if the user is already registered
        const raw = { _id: user.id, platform, level: MatchmakingService.instance.getUserLevel(user.id), displayName };
        const participant: ParticipantDocument = await ParticipantModel.create(raw)
            .catch( error => {
                if (error.name === "MongoServerError" && error.code === 11000) {
                    throw new RegistrationRefusedException("Vous êtes déjà inscrit au championnat.");
                }

                throw error;
            });

        const thread = await channel.threads.create({
            type: ChannelType.PrivateThread,
            invitable: false,
            name: `${user.displayName} - ${user.id}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            reason: "User requested to participate in the championship."
        });
        participant.support = new DiscordChannel(channel.guildId, channel.id, thread.id);
        await participant.save();

        await Promise.all([
            thread.send({
                content: `# Bonne chance ${user}\n` +
                    "** **\n" +
                    "<a:green_check_circle:1182354698804666378> Vous êtes maintenant inscrit à ``Freemode Arena - Saison 5``\n" +
                    "\n" +
                    `Ce salon vous permettra de communiquer avec les gérants du championnat ( <@&${SUPPORT_ROLE_ID}> ) dans le cas où vous auriez des questions ou des problèmes.\n` +
                    "\n" +
                    "## Ressources utiles\n" +
                    `- Rechercher un adversaire ${EMOJI_RIGHT_ARROW} <#${CHAMPIONSHIP_CHANNEL_ID}>\n` +
                    `- Règlement + FAQ ${EMOJI_RIGHT_ARROW} <#${FAQ_CHANNEL_ID}>`
            }),
            user.roles.add(CHAMPIONSHIP_ROLE_ID)
        ]);

        await this._answer({
            content: "# Vous êtes maintenant inscrit à Freemode Arena 5",
            components: [
                new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${channel.guildId}/${thread.id}`)
                            .setLabel("Support")
                            .setEmoji(EMOJI_SUPPORT),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${channel.guildId}/${CHAMPIONSHIP_CHANNEL_ID}`)
                            .setLabel("Rechercher un adversaire")
                            .setEmoji(EMOJI_MATCHMAKING),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${channel.guildId}/${FAQ_CHANNEL_ID}`)
                            .setLabel("Règlement + FAQ")
                            .setEmoji(EMOJI_FAQ)
                    ])
            ],
            ephemeral: true
        });
    }
}

getDiscriminatorModelForClass(ActionModel, RegisterForChampionshipAction, ACTION_CODES.ACTION_REGISTER_CHAMPIONSHIP);
