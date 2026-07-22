export class TileGenerator {

    generate({
        config = {},
        collisionBox = null,
        quantity = 1
    } = {}) {

        const {
            type = 'grass',
            x = 32,
            y = 32,
            width = 32,
            height = 32,
            drawMode = 'x',
            offsetX = 0,
            offsetY = 0
        } = config;

        const createTile = (index) => {

            const tileX = drawMode === 'x'
                ? x + (width * index)
                : x;

            const tileY = drawMode === 'y'
                ?  y + (height * index)
                : y;

            return {
                type,
                x: tileX,
                y: tileY,
                width,
                height,
                collisionBox: {
                    x: collisionBox? tileX + collisionBox.x : tileX + offsetX ,
                    y: collisionBox? tileY + collisionBox.y : tileY + offsetY,
                    width: collisionBox ? collisionBox.width : width,
                    height: collisionBox ? collisionBox.height : height
                }
            };
        };

        if (quantity <= 1) {
            return createTile(0);
        }

        return Array.from({ length: quantity }, (_, index) => createTile(index));
    }
}