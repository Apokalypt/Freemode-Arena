import type { BotClient } from "@models/BotClient";
import type { WithoutModifiers, InteractionForAction } from "@bot-types";
import { getDiscriminatorModelForClass } from "@typegoose/typegoose";
import { MessageActionRowComponentBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ThreadAutoArchiveDuration } from "discord.js";
import { DiscordChannel } from "@models/championship/DiscordChannel";
import { ParticipantDocument, ParticipantModel } from "@models/championship/Participant";
import { Action, ActionExecutionContext, ActionModel, InputAction, InputActionValidated } from "@models/action/Action";
import {IntermediateModel, RequiredProp} from "@decorators/database";
import { MatchmakingService } from "@services/MatchmakingService";
import { InvalidActionException } from "@exceptions/actions/InvalidActionException";
import { InvalidPlayerStateException } from "@exceptions/championship/InvalidPlayerStateException";
import { RegistrationRefusedException } from "@exceptions/championship/RegistrationRefusedException";
import { ACTION_CODES, DATABASE_MODELS, Platforms } from "@enums";
import {
    CHAMPIONSHIP_CHANNEL_ID, CHAMPIONSHIP_END_DATE,
    CHAMPIONSHIP_ROLE_ID, DISCUSSION_CHANNEL_ID, EMOJI_GREEN_CHECK,
    EMOJI_INFORMATION, EMOJI_SUPPORT,
    FAQ_CHANNEL_ID,
    SUPPORT_CHANNEL_ID,
    SUPPORT_ROLE_ID
} from "@constants";

type AdminRegisterForChampionshipActionProperties = WithoutModifiers<AdminRegisterForChampionshipAction>;

@IntermediateModel(DATABASE_MODELS.ACTION_ADMIN_REGISTER_CHAMPIONSHIP, { allowMixed: true })
export class AdminRegisterForChampionshipAction extends Action<"ACTION_ADMIN_REGISTER_CHAMPIONSHIP"> {
    @RequiredProp({ type: String })
    userId!: string;

    constructor(data: Partial<AdminRegisterForChampionshipActionProperties>) {
        super({ ...data, __type: "ACTION_ADMIN_REGISTER_CHAMPIONSHIP" });

        this.userId = data.userId!;
    }

    protected override _getInput(): InputRegisterForChampionshipAction {
        return { ...super._getInput(), userId: this.userId };
    }

    protected override _getContext(
        client: BotClient,
        input: InputRegisterForChampionshipAction,
        interaction: InteractionForAction<'cached'>
    ): AdminRegisterForChampionshipActionExecutionContext {
        return new AdminRegisterForChampionshipActionExecutionContext(client, AdminRegisterForChampionshipAction, input, interaction);
    }
}

type InputRegisterForChampionshipAction = InputAction<"ACTION_ADMIN_REGISTER_CHAMPIONSHIP"> & { userId?: string };
type InputRegisterForChampionshipActionValidated = InputActionValidated<"ACTION_ADMIN_REGISTER_CHAMPIONSHIP"> & { userId: string };

class AdminRegisterForChampionshipActionExecutionContext<IsValidated extends true | false = false>
    extends ActionExecutionContext<IsValidated, InputRegisterForChampionshipAction, InputRegisterForChampionshipActionValidated, "ACTION_ADMIN_REGISTER_CHAMPIONSHIP"> {

    protected override async _checkActionValidity(): Promise<InputRegisterForChampionshipActionValidated> {
        const inputValidated = await super._checkActionValidity();

        if (CHAMPIONSHIP_END_DATE.getTime() < Date.now()) {
            throw new InvalidActionException("Le championnat est terminé.");
        }

        if (!inputValidated.guildId) {
            throw new InvalidActionException("L'action doit être exécutée dans un serveur.");
        }

        if (!this.input.userId) {
            throw new InvalidActionException("L'ID utilisateur est manquant.");
        }

        return { ...inputValidated, guildId: inputValidated.guildId, userId: this.input.userId };
    }

    protected async _execute(this: AdminRegisterForChampionshipActionExecutionContext<true>): Promise<void> {
        await this._source.deferReply({ ephemeral: true });

        const guild = await super._getGuild(true);
        const channel = await guild.channels.fetch(SUPPORT_CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) {
            throw new Error("The support channel ID provided is not a text channel.");
        }

        const user = await guild.members.fetch(this.input.userId);

        const alreadyRegistered = await ParticipantModel.exists({ _id: user.id });
        if (alreadyRegistered) {
            throw new RegistrationRefusedException(`${user.id} est déjà inscrit au championnat.`, user.id);
        }

        const userPlatforms = await MatchmakingService.instance.getUserPlatforms(guild, user.id);
        if (userPlatforms.length === 0) {
            throw new InvalidPlayerStateException("L'utilisateur n'a pas sélectionné de plateforme dans <id:customize>.", user.id);
        }

        let platforms: Platforms[];
        if (userPlatforms.length === 1) {
            platforms = [userPlatforms[0]];
        } else {
            platforms = await this._askForStringSelection({
                title: "Sur quelle(s) plateforme(s) souhaitez-vous l'inscrire?",
                description: "Choisissez une ou plusieurs plateformes sur lesquelles vous souhaitez inscrire le joueur à ce championnat.",
                options: userPlatforms.map( platform => ({ label: platform, value: platform }) ),
                placeholder: "Cliquez ici pour choisir une ou plusieurs plateformes...",
                minNumberOfOptions: 1,
                maxNumberOfOptions: userPlatforms.length,
            }) as Platforms[];
        }

        // We create the document first to avoid concurrency issues and check if the user is already registered
        const raw = { _id: user.id, platforms, level: MatchmakingService.instance.getUserLevel(user.id), displayName: user.displayName };
        const participant: ParticipantDocument = await ParticipantModel.create(raw)
            .catch( error => {
                if (error.name === "MongoServerError" && error.code === 11000) {
                    throw new RegistrationRefusedException(`${user.id} est déjà inscrit au championnat.`, user.id);
                }

                throw error;
            });

        const thread = await channel.threads.create({
            type: ChannelType.PrivateThread,
            invitable: false,
            name: `${user.displayName} - ${user.id}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            reason: "Admin has manually registered a user for the championship."
        });
        participant.support = new DiscordChannel(channel.guildId, channel.id, thread.id);
        await participant.save();

        await Promise.all([
            thread.send({
                content: `# Bienvenue ${user} 🏆\n` +
                    "Si vous lisez ce message, c'est que votre candidature **a été retenue** pour participer au championnat Freemode Arena 6 !\n" +
                    "\n" +
                    `${EMOJI_INFORMATION} Ce fil de discussion vous permet de discuter **en privé** avec les organisateurs du tournoi.\n` +
                    `Le canal <#${SUPPORT_CHANNEL_ID}> permet de consulter toutes les annonces liés à l'avancement **du tournoi et des matchs**.\n` +
                    "\n" +
                    `Pour rappel, les règles du tournoi sont **explicitées** dans <#${FAQ_CHANNEL_ID}>\n` +
                    "\n" +
                    `Vous trouverez dans <#${CHAMPIONSHIP_CHANNEL_ID}> les fils de discussions qui concernent **vos matchs à vous** (pour choisir vos armes et connaitre vos adversaires)\n` +
                    "\n" +
                    `Et enfin, <#${DISCUSSION_CHANNEL_ID}> vous permet de discuter avec les autres joueurs inscrits ainsi qu'avec le staff.\n` +
                    "\n" +
                    `### ⚠️  _Si vous avez la moindre question, adressez-vous aux <@&${SUPPORT_ROLE_ID}>._`
            }),
            user.roles.add(CHAMPIONSHIP_ROLE_ID)
        ]);

        await this._answer({
            content: `${EMOJI_GREEN_CHECK} L'utilisateur ${user} a bien été inscrit au championnat!`,
            components: [
                new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents([
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${channel.guildId}/${thread.id}`)
                            .setLabel("Support")
                            .setEmoji(EMOJI_SUPPORT)
                    ])
            ],
            ephemeral: true
        });
    }
}

getDiscriminatorModelForClass(ActionModel, AdminRegisterForChampionshipAction, ACTION_CODES.ACTION_REGISTER_CHAMPIONSHIP);
