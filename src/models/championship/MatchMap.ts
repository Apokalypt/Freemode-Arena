import { EmbeddedModel, RequiredProp } from "@decorators/database";

@EmbeddedModel()
export class MatchMap {
    @RequiredProp({ type: String })
    public name!: string;

    @RequiredProp({ type: String })
    public filename!: string;

    constructor(name: string, filename: string) {
        this.name = name;
        this.filename = filename;
    }

    static fromRawData(json: any): MatchMap {
        return new MatchMap(json.name, json.filename);
    }
}
