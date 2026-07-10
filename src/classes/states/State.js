export default class State {
    constructor(stateManager, context) {
        this.stateManager = stateManager;
        this.context = context;
    }

    enter() {}
    update() {}
    draw(ctx) {}
    exit() {}
}
