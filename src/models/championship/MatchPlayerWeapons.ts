import { Prop, PropType } from "@typegoose/typegoose";
import { InGameWeapon } from "@models/championship/InGameWeapon";
import { EmbeddedModel, RequiredProp } from "@decorators/database";
import { BASE_TOKENS_COUNT } from "@constants";

@EmbeddedModel()
export class MatchPlayerWeapons {
    @RequiredProp({ type: Number, default: BASE_TOKENS_COUNT })
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
            return ":hourglass: - Non Validée";
        } else {
            return "<a:green_check_circle:1182354698804666378> - Validée";
        }
    }
    public stringifySelection() {
        if (this.selection.length === 0) {
            return "*Aucune arme sélectionnée pour le moment*\n";
        } else {
            const INDENT = "\u200b ".repeat(5);

            return this.selection.map( weapon => `${INDENT} • ${weapon.toString()}` )
                .join('\n') + "\n";
        }
    }
}
