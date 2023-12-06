import { EmbeddedModel, RequiredProp } from "@decorators/database";

@EmbeddedModel()
export class InGameWeapon {
    @RequiredProp({ type: String })
    public name!: string;
    @RequiredProp({ type: Number })
    public cost!: number;

    constructor(name: string, cost: number) {
        this.name = name;
        this.cost = cost;
    }
}
