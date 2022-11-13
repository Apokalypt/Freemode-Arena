import { ComponentBuilder } from '@discordjs/builders';

class Component {
    constructor(component, action, ...args) {
        Object.defineProperty(this, 'component', { value: component })
        Object.defineProperty(this, 'action', { value: action })

        if (typeof this.action !== "function") {
            throw new Error('Action property must be a function')
        }
        if (!(this.component instanceof ComponentBuilder)) {
            throw new Error('Component property must be a component builder')
        }

        this.component.setCustomId(this.generateId(args))
    }

    generateId(..._args) {
        throw new Error('Method \'generateId\' must be implemented.')
    }

    async execute(client, interaction) {
        return this.action(client, interaction)
    }
}
