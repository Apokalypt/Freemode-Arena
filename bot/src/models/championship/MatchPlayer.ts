import { Ref } from "@typegoose/typegoose";
import { EmbeddedModel, RequiredProp } from "@decorators/database";
import { Participant } from "@models/championship/Participant";
import { MatchPlayerWeapons } from "@models/championship/MatchPlayerWeapons";

@EmbeddedModel()
export class MatchPlayer {
    @RequiredProp({ ref: () => Participant, type: String })
    public participant!: Ref<Participant, string>;

    @RequiredProp({ type: MatchPlayerWeapons })
    public weapons!: MatchPlayerWeapons;
}
