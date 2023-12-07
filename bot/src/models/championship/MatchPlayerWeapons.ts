import { Prop, PropType } from "@typegoose/typegoose";
import { InGameWeapon } from "@models/championship/InGameWeapon";
import { EmbeddedModel, RequiredProp } from "@decorators/database";

@EmbeddedModel()
export class MatchPlayerWeapons {
    @RequiredProp({ type: Number, default: 10 })
    public budget!: number;
    @RequiredProp({ type: InGameWeapon, default: [] }, PropType.ARRAY)
    public selection!: InGameWeapon[];
    public get selectionCost(): number {
        return this.selection.reduce( (cost, weapon) => cost + weapon.cost, 0);
    }

    @Prop({ type: Date, default: null })
    public validatedAt!: Date | null;


    public selectionIsUpdatable(): boolean {
        return this.validatedAt == null;
    }

    public stringifyStatus() {
        if (this.validatedAt == null) {
            return ":hourglass: - Non Validé";
        } else {
            return ":white_check_mark: - Validé";
        }
    }
}
