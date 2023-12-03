import { EmbeddedModel, RequiredProp } from "@decorators/database";
import { Prop, PropType } from "@typegoose/typegoose";

@EmbeddedModel()
export class MatchPlayerWeapons {
    @RequiredProp({ type: Number, default: 10 })
    public budget!: number;
    @RequiredProp({ type: String, default: [] }, PropType.ARRAY)
    public selection!: string[];

    @Prop({ type: Date, default: null })
    public validatedAt!: Date | null;
}
