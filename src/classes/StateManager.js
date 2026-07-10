export default class StateManager {
    constructor(context) {
        this.context = context;
        this.currentState = null;
    }

    changeState(NewStateClass) {
        if (this.currentState?.exit) {
            this.currentState.exit();
        }

        this.currentState = new NewStateClass(this, this.context);
        this.currentState.enter();
    }

    update() {
        this.currentState?.update();
    }

    draw(ctx) {
        this.currentState?.draw(ctx);
    }

    getCurrentState() {
        return this.currentState.constructor.name;
    }
}
