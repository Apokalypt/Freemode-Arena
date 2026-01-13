import { Prop, PropType } from "@typegoose/typegoose";
import { InGameWeapon } from "@models/championship/InGameWeapon";
import { MatchService } from "@services/MatchService";
import { EmbeddedModel, RequiredProp } from "@decorators/database";
import { BASE_TOKENS_COUNT, EMOJI_GREEN_CHECK, TOKENS_GROUP_METHOD } from "@constants";

@EmbeddedModel()
export class MatchPlayerWeapons {
    @RequiredProp({ type: Number, default: BASE_TOKENS_COUNT })
    public budget!: number;
    @RequiredProp({ type: InGameWeapon, default: [] }, PropType.ARRAY)
    public selection!: InGameWeapon[];

    @Prop({ type: Date, default: null })
    public validatedAt!: Date | null;


    public globalSelectionCost(): number {
        return this.selection.reduce( (cost, weapon) => cost + weapon.cost, 0);
    }
    public categorySelectionCost(category: string): number {
        return this.selection
            .filter( weapon => weapon.category === category )
            .reduce( (cost, weapon) => cost + weapon.cost, 0);
    }

    public selectionIsUpdatable(): boolean {
        return this.validatedAt == null;
    }

    public hasReachedBudgetSelection(): boolean {
        if (TOKENS_GROUP_METHOD === "global") {
            return this.globalSelectionCost() === this.budget;
        } else {
            const categories = MatchService.instance.getWeaponsCategories();
            return categories.every( category => {
                return this.categorySelectionCost(category.name) === this.budget;
            });
        }
    }

    public stringifyStatus() {
        if (this.validatedAt == null) {
            return ":hourglass: - Non Validée";
        } else {
            return `${EMOJI_GREEN_CHECK} - Validée`;
        }
    }
    public stringifySelection() {
        if (this.selection.length === 0) {
            return "*Aucune arme sélectionnée pour le moment*\n";
        } else {
            const INDENT = "\u200b ".repeat(5);
            const SMALL_INDENT = "\u200b ".repeat(2);

            const categories = MatchService.instance.getWeaponsCategories();
            const shouldShowTokens = categories.some(category => {
                return category.weapons.some( weapon => weapon.value !== 1 );
            });

            if (TOKENS_GROUP_METHOD === "global") {
                return this.selection.map( weapon => `${INDENT} • ${weapon.toString(true, shouldShowTokens)}` )
                    .join('\n') + "\n";
            } else {
                let result = "";
                for (const category of categories) {
                    result += `### ${SMALL_INDENT} ${category.name}`;
                    if (shouldShowTokens) {
                        result += ` - ${this.categorySelectionCost(category.name)} / ${this.budget} jeton(s)`;
                    } else {
                        result += ` - ${this.categorySelectionCost(category.name)} / ${this.budget} arme(s)`;
                    }
                    result += "\n";

                    const weaponsInCategory = this.selection.filter( w => w.category === category.name );
                    if (weaponsInCategory.length === 0) {
                        result += `${INDENT}*Aucune arme sélectionnée dans cette catégorie*\n`;
                    } else {
                        result += weaponsInCategory.map( weapon => `${INDENT} • ${weapon.toString(false, shouldShowTokens)}` )
                            .join('\n') + "\n";
                    }
                }
                return result;
            }
        }
    }
}
