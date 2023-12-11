import { EmbeddedModel, RequiredProp } from "@decorators/database";

@EmbeddedModel()
export class MatchMap {
    @RequiredProp({ type: String })
    public name!: string;

    @RequiredProp({ type: String })
    public url!: string;

    constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
    }
}
