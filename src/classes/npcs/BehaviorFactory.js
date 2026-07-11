import RandomWalkBehavior from './behaviors/RandomWalkBehavior.js';
import StaticBehavior from './behaviors/StaticBehavior.js';

export default class BehaviorFactory {
    static createBehavior(type, params = {}) {
        switch (type) {
            case 'static':
                return new StaticBehavior(params);
            case 'randomWalk':
                return new RandomWalkBehavior(params);
            default:
                console.warn(`BehaviorFactory: tipo desconhecido '${type}', usando static.`);
                return new StaticBehavior(params);
        }
    }
}
