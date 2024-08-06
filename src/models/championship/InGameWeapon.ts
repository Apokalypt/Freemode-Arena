import { EmbeddedModel, RequiredProp } from "@decorators/database";

@EmbeddedModel()
export class InGameWeapon {
    @RequiredProp({ type: String })
    public category!: string;
    @RequiredProp({ type: String })
    public name!: string;
    @RequiredProp({ type: Number })
    public cost!: number;

    constructor(category: string, name: string, cost: number) {
        this.category = category;
        this.name = name;
        this.cost = cost;
    }


    toString(): string {
        return `[**${this.cost} jeton(s)**] ${this.category} - ${this.name}`;
    }
}
