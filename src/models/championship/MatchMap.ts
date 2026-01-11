import { EmbeddedModel, RequiredProp } from "@decorators/database";

@EmbeddedModel()
export class MatchMap {
    @RequiredProp({ type: String })
    public name!: string;

    @RequiredProp({ type: String })
    public filename!: string;

    @RequiredProp({ type: String })
    public activity!: string;

    constructor(name: string, filename: string, activity: string) {
        this.name = name;
        this.filename = filename;
        this.activity = activity;
    }

    static fromRawData(json: any): MatchMap {
        return new MatchMap(json.name, json.filename, json.activity);
    }
}
