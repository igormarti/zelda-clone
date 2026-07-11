export default class StaticBehavior {
    constructor(params = {}) {
        this.params = params;
    }

    enter(npc, context) {
        npc.state = 'idle';
    }

    update(npc, context) {
        return { dx: 0, dy: 0 };
    }

    exit(npc) {}
}
