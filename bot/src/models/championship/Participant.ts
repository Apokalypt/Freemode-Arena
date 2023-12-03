import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { getModelForClass, DocumentType, Prop } from "@typegoose/typegoose";
import { DiscordChannel } from "@models/championship/DiscordChannel";
import { Model, RequiredProp } from "@decorators/database";
import { DATABASE_COLLECTIONS, DATABASE_MODELS } from "@enums";

@Model(DATABASE_COLLECTIONS.PARTICIPANTS, DATABASE_MODELS.PARTICIPANTS)
export class Participant extends TimeStamps {
    @RequiredProp({ type: String })
    public _id!: string; // Discord ID

    @RequiredProp({ type: Number, validate: (value: number) => value === 0 || value === 1 || value === 2, default: 0 })
    public level!: 0 | 1 | 2; // User estimation level

    // Required property but the information is not available when creating the document
    @Prop({ type: DiscordChannel })
    public support?: DiscordChannel;

    @RequiredProp({ type: String })
    public displayName!: string;
}

export const ParticipantModel = getModelForClass(Participant);
export type ParticipantDocument = DocumentType<Participant, string>;
