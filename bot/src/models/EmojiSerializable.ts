export class EmojiSerializable {
    public readonly animated?: boolean;
    public readonly name: string;
    public readonly id?: string;

    constructor(animated: boolean | undefined, name: string, id: string | undefined) {
        this.animated = animated;
        this.name = name;
        this.id = id;
    }


    public toString(): string {
        return `<${this.animated ? "a" : ""}:${this.name}:${this.id}>`;
    }
}
