export default class Character {
    getCollisionRect(x = this.x, y = this.y) {
        return { x, y, width: 0, height: 0 };
    }

    rectsOverlap(x1, y1, width1, height1, x2, y2, width2, height2) {
        return x1 < x2 + width2 && x1 + width1 > x2 && y1 < y2 + height2 && y1 + height1 > y2;
    }

    isPositionSafe(x, y, world, targetRect = null) {
        const rect = this.getCollisionRect(x, y);
        const withinBounds = rect.x >= 0 &&
            rect.y >= 0 &&
            rect.x + rect.width <= (world?.SCREEN_WIDTH ?? 0) &&
            rect.y + rect.height <= (world?.SCREEN_HEIGHT ?? 0);

        if (!withinBounds) {
            return false;
        }

        if (world && typeof world.isPositionBlocked === 'function' && world.isPositionBlocked(rect.x, rect.y, rect.width, rect.height)) {
            return false;
        }

        if (targetRect && this.rectsOverlap(rect.x, rect.y, rect.width, rect.height, targetRect.x, targetRect.y, targetRect.width, targetRect.height)) {
            return false;
        }

        return true;
    }

    findSafePositionNearTarget(target, world, minDistance = 70) {
        if (!target) {
            return null;
        }

        const targetRect = typeof target.getCollisionRect === 'function'
            ? target.getCollisionRect()
            : { x: target.x, y: target.y, width: 0, height: 0 };

        const targetCenterX = targetRect.x + targetRect.width / 2;
        const targetCenterY = targetRect.y + targetRect.height / 2;
        const rect = this.getCollisionRect();
        const collisionCenterOffsetX = rect.x - this.x;
        const collisionCenterOffsetY = rect.y - this.y;

        const currentX = this.x + collisionCenterOffsetX + rect.width / 2;
        const currentY = this.y + collisionCenterOffsetY + rect.height / 2;
        const dx = targetCenterX - currentX;
        const dy = targetCenterY - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        const preferredDistance = Math.max(minDistance, 60);
        const candidateOffsets = [
            { x: nx * preferredDistance, y: ny * preferredDistance },
            { x: nx * (preferredDistance + 16), y: ny * (preferredDistance + 16) },
            { x: nx * (preferredDistance + 32), y: ny * (preferredDistance + 32) },
            { x: 0, y: 0 }
        ];

        const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];

        for (const offset of candidateOffsets) {
            const baseX = targetCenterX - offset.x;
            const baseY = targetCenterY - offset.y;
            const baseCandidateX = baseX - collisionCenterOffsetX - rect.width / 2;
            const baseCandidateY = baseY - collisionCenterOffsetY - rect.height / 2;

            if (this.isPositionSafe(baseCandidateX, baseCandidateY, world, targetRect)) {
                return { x: baseCandidateX, y: baseCandidateY };
            }

            for (const angle of angles) {
                const rotatedX = offset.x * Math.cos(angle) - offset.y * Math.sin(angle);
                const rotatedY = offset.x * Math.sin(angle) + offset.y * Math.cos(angle);
                const candidateCenterX = targetCenterX - rotatedX;
                const candidateCenterY = targetCenterY - rotatedY;
                const candidateX = candidateCenterX - collisionCenterOffsetX - rect.width / 2;
                const candidateY = candidateCenterY - collisionCenterOffsetY - rect.height / 2;

                if (this.isPositionSafe(candidateX, candidateY, world, targetRect)) {
                    return { x: candidateX, y: candidateY };
                }
            }
        }

        return null;
    }
}   