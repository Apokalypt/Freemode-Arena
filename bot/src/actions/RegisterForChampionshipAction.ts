import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import type { RepliableInteraction } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from "discord.js";
import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers } from "@bot-types";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import { IntermediateModel } from "@decorators/database";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { ACTION_CODES, DATABASE_MODELS } from "@enums";
import { ParticipantDocument, ParticipantModel } from "@models/championship/Participant";
import { CHAMPIONSHIP_CHANNEL_ID, CHAMPIONSHIP_ROLE_ID, SUPPORT_CHANNEL_ID, SUPPORT_ROLE_ID } from "@constants";
import { ThreadAutoArchiveDuration } from "discord-api-types/v10";
import { DiscordChannel } from "@models/championship/DiscordChannel";
import { RegistrationRefusedException } from "@exceptions/championship/RegistrationRefusedException";
import { MessageActionRowComponentBuilder } from "@discordjs/builders";

type RegisterForChampionshipActionProperties = WithoutModifiers<RegisterForChampionshipAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_REGISTER_CHAMPIONSHIP, { allowMixed: true })
export class RegisterForChampionshipAction extends Action<"ACTION_REGISTER_CHAMPIONSHIP"> {
    constructor(data: Partial<RegisterForChampionshipActionProperties>) {
        super({ ...data, __type: "ACTION_REGISTER_CHAMPIONSHIP" });
    }

    protected override _getContext(
        client: BotClient,
        input: InputRegisterForChampionshipAction,
        interaction: RepliableInteraction
    ): RegisterForChampionshipActionExecutionContext {
        return new RegisterForChampionshipActionExecutionContext(client, RegisterForChampionshipAction, input, interaction);
    }
}

type InputRegisterForChampionshipAction = InputAction<"ACTION_REGISTER_CHAMPIONSHIP"> & { };
type InputRegisterForChampionshipActionValidated = InputActionValidated<"ACTION_REGISTER_CHAMPIONSHIP"> & { };

class RegisterForChampionshipActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputRegisterForChampionshipAction, InputRegisterForChampionshipActionValidated, "ACTION_REGISTER_CHAMPIONSHIP"> {

    protected override async _checkActionValidity(): Promise<InputRegisterForChampionshipActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId };
    }

    protected async _execute(this: RegisterForChampionshipActionExecutionContext<true>): Promise<void> {
        await this._deferAnswer();

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

        const validateChoice = await this._askForBinaryChoice(
            '## :crossed_swords: Vous êtes sur le point de vous inscrire à Freemode Arena 3, Souhaitez-vous continuer votre inscription ?\n' +
            '** **\n' +
            ':info: *En continuant, vous confirmez avoir lu le fonctionnement du tournoi et vous vous engagez à participer.*'
        );
        if (!validateChoice) {
            await this._answer({
                embeds: [{
                    title: "Inscription au championnat",
                    description: "Vous avez annulé votre inscription au championnat. Si vous changez d'avis, vous pouvez réessayer.",
                    color: 0xff0000
                }],
                ephemeral: true
            });

            return;
        }

        const displayName = await this._askForText(
            "Profil - Freemode Arena 4",
            {
                title: "Pseudo à afficher sur le classement",
                required: true,
                default: user.displayName,
                maxLength: 100
            }
        );

        // We create the document first to avoid concurrency issues and check if the user is already registered
        const participant: ParticipantDocument = await ParticipantModel.create({ _id: user.id, level: 0, displayName })
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
                content: `# ${user}\n` +
                    "** **\n" +
                    ":accepter: Vous êtes maintenant inscrit à ``Freemode Arena - Saison 4``\n" +
                    "\n" +
                    `Ce salon vous permettra de communiquer avec les gérants du championnat ( <@&${SUPPORT_ROLE_ID}> ) dans le cas où vous auriez des questions ou des problèmes.\n` +
                    "\n" +
                    "## Ressources utiles\n" +
                    `- Rechercher un adversaire :rightarrow: <#${CHAMPIONSHIP_CHANNEL_ID}>\n` +
                    "- Règlement + FAQ :rightarrow: *??*"
            }),
            user.roles.add(CHAMPIONSHIP_ROLE_ID)
        ]);

        await this._answer({
            embeds: [{
                title: "Inscription au championnat validé",
                description: "Vous êtes maintenant inscrit au championnat!\n" +
                    `Vous pouvez désormais rechercher un adversaire dans le salon <#${CHAMPIONSHIP_CHANNEL_ID}>`,
                color: 0x00ff00
            }],
            components: [
                new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${channel.guildId}/${thread.id}`)
                            .setLabel("Support"),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${channel.guildId}/${CHAMPIONSHIP_CHANNEL_ID}`)
                            .setLabel("Rechercher un adversaire")
                    ])
            ],
            ephemeral: true,
        });
    }
}

getDiscriminatorModelForClass(ActionModel, RegisterForChampionshipAction, ACTION_CODES.ACTION_REGISTER_CHAMPIONSHIP);
