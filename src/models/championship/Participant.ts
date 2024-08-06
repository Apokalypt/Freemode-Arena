import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { getModelForClass, DocumentType, Prop } from "@typegoose/typegoose";
import { DiscordChannel } from "@models/championship/DiscordChannel";
import { Model, RequiredProp } from "@decorators/database";
import { DATABASE_COLLECTIONS, DATABASE_MODELS, Platforms, PLATFORMS_VALUES } from "@enums";
import { DEFAULT_USER_LEVEL } from "@constants";

@Model(DATABASE_COLLECTIONS.PARTICIPANTS, DATABASE_MODELS.PARTICIPANTS)
export class Participant extends TimeStamps {
    @RequiredProp({ type: String })
    public _id!: string; // Discord ID

    @RequiredProp({ type: String, enum: PLATFORMS_VALUES })
    public platform!: Platforms;

    @RequiredProp({ type: Number, validate: (value: number) => value === 0 || value === 1 || value === 2, default: DEFAULT_USER_LEVEL })
    public level!: 0 | 1 | 2; // User estimation level
    public get levelStr(): string {
        switch (this.level) {
            case 0:
                return "DÉBUTANT 🔵";
            case 1:
                return "INTERMÉDIAIRE 🟡";
            case 2:
                return "PRO 🔴";
        }
    }

    // Required property but the information is not available when creating the document
    @Prop({ type: DiscordChannel })
    public support?: DiscordChannel;

    @RequiredProp({ type: String })
    public displayName!: string;
}

export const ParticipantModel = getModelForClass(Participant);
export type ParticipantDocument = DocumentType<Participant>;
