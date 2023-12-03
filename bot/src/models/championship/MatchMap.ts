import { EmbeddedModel, RequiredProp } from "@decorators/database";

@EmbeddedModel()
export class MatchMap {
    @RequiredProp({ type: String })
    public name!: string;

    @RequiredProp({ type: String })
    public url!: string;
}
