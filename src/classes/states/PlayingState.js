import GameOverState from './GameOverState.js';
import PausedState from './PausedState.js';
import State from './State.js';

export default class PlayingState extends State {
    enter() {
        const roomKey = `${this.context.world.currentRoom.x},${this.context.world.currentRoom.y}`;
        if (this.context.npcManager) {
            this.context.npcManager.loadForRoom(roomKey);
        }
        this.currentRoomKey = roomKey;
    }

    update() {
        const { player, world, input, npcManager, dialogManager } = this.context;

        const isDialogActive = dialogManager?.isActive();
        if (isDialogActive) {
            dialogManager.update(input);
        } else {
            player.update(input.keys, world);
            world.update(player);
        }

        const roomKey = `${world.currentRoom.x},${world.currentRoom.y}`;
        if (npcManager) {
            if (roomKey !== this.currentRoomKey) {
                npcManager.loadForRoom(roomKey);
                this.currentRoomKey = roomKey;
            }
            npcManager.update({ input });
        }

        if (player.state === 'die') {
            this.stateManager.changeState(GameOverState);
            return;
        }

        if (input.keys['Escape']) {
            input.keys['Escape'] = false;
            this.stateManager.changeState(PausedState);
        }
    }

    draw(ctx) {
        const { world, player, spriteSheet, FRAME_SIZE, npcManager, dialogManager, canvas } = this.context;

        world.draw(ctx);

        if (npcManager) {
            npcManager.draw(ctx);
        }

        if (spriteSheet.complete) {
            player.draw(ctx, spriteSheet, FRAME_SIZE);
        }

        if (dialogManager) {
            dialogManager.draw(ctx, canvas);
        }
    }

    exit() {}
}
