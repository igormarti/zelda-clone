export default class InputHandler {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', e => {
            const normalizedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            this.keys[normalizedKey] = true;
            this.keys[e.key] = true;

            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', e => {
            const normalizedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            this.keys[normalizedKey] = false;
            this.keys[e.key] = false;
        });
    }
}