export default class AssetManager {

    constructor() {
        this.assetCache = new Map();
    }

    loadImage(path) {
        if (!this.assetCache.has(path)) {
            const image = new Image();
            image.src = path;
            this.assetCache.set(path, image);
        }
        return this.assetCache.get(path);
    }

    loadImageAsync(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = src;
        });
    }

    async loadJSON(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Falha ao carregar ${path}: ${response.statusText}`);
        }
        return response.json();
    }

    clearInstance() {
      this.assetCache.clear();
      this.assetCache = new Map();
    }
}