class Environment {
    constructor(developMode = false) {
        // Define false como padrão se nada for passado
        this.developMode = developMode;
    }

    isDeveloperMode() {
        return window.location.search.includes('dev=true') || this.developMode;
    }
}

export { Environment };
export default new Environment();