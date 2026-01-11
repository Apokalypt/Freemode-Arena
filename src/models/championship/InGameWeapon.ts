import { EmbeddedModel, RequiredProp } from "@decorators/database";
import {Prop} from "@typegoose/typegoose";

@EmbeddedModel()
export class InGameWeapon {
    @Prop({ type: String })
    public category?: string;
    @RequiredProp({ type: String })
    public name!: string;
    @RequiredProp({ type: Number })
    public cost!: number;

    constructor(category: string, name: string, cost: number) {
        this.category = category;
        this.name = name;
        this.cost = cost;
    }


    toString(showCategory = true, showTokens = true): string {
        let result = "";
        if (showTokens) {
            result += `[**${this.cost} jeton(s)**] `;
        }
        if (showCategory && this.category) {
            result += `${this.category} - `;
        }
        result += this.name;
        return result;
    }
}
