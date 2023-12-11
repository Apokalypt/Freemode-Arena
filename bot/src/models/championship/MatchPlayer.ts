import { isDocument, Ref } from "@typegoose/typegoose";
import { EmbeddedModel, RequiredProp } from "@decorators/database";
import { Participant } from "@models/championship/Participant";
import { MatchPlayerWeapons } from "@models/championship/MatchPlayerWeapons";

@EmbeddedModel()
export class MatchPlayer {
    @RequiredProp({ ref: () => Participant, type: String })
    public participant!: Ref<Participant, string>;
    public get participantId(): string {
        if (isDocument(this.participant)) {
            return this.participant._id;
        }

        return this.participant;
    }

    @RequiredProp({ type: MatchPlayerWeapons })
    public weapons!: MatchPlayerWeapons;
}
