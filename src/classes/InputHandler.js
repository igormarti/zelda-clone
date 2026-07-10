export default class InputHandler {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', e => { 
            this.keys[e.key] = true;
            // Previne comportamento padrão para teclas especiais
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', e => { 
            this.keys[e.key] = false;
        });
    }
}