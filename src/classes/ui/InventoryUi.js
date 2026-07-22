export default class InventoryUi {
    constructor(inventoryState, screenWidth, screenHeight) {
        this.state = inventoryState;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        this.width = 560;
        this.height = 380;
        this.x = (this.screenWidth - this.width) / 2;
        this.y = (this.screenHeight - this.height) / 2;

        this.slotSize = 60;
        this.slotSpacing = 12;
        this.gridStartX = this.x + 30;
        this.gridStartY = this.y + 80;
    }

    draw(ctx) {
        if (!this.state.active) return;

        ctx.save();

        // 1. Fundo Escurecido
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

        // 2. Janela Principal
        const gradientBox = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradientBox.addColorStop(0, "rgba(30, 36, 48, 0.96)");
        gradientBox.addColorStop(1, "rgba(16, 20, 28, 0.98)");
        ctx.fillStyle = gradientBox;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 2;
        this._drawRoundedRect(ctx, this.x, this.y, this.width, this.height, 16, true, true);

        ctx.textAlign = "left";

        // 3. Textos do Topo
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px Arial";
        ctx.fillText("INVENTÁRIO", this.x + 30, this.y + 42);

        ctx.fillStyle = "#8a99ad";
        ctx.font = "12px Arial";
        ctx.fillText("[W,A,S,D] Mover  •  [Enter/E] Opções  •  [I] Fechar", this.x + 30, this.y + 60);

        // 4. Renderização dos Slots
        for (let i = 0; i < this.state.maxSlots; i++) {
            const row = Math.floor(i / this.state.columns);
            const col = i % this.state.columns;

            const slotX = this.gridStartX + col * (this.slotSize + this.slotSpacing);
            const slotY = this.gridStartY + row * (this.slotSize + this.slotSpacing);

            const isSelected = (i === this.state.selectedIndex);
            const isWeaponSlot = (i < this.state.inventory.slotsWeapons);
            const content = this.state.getSlotContent(i);

            // Verifica se este item/arma é a arma equipada
            const isEquipped = this.state.isWeaponEquipped(content);

            // Definição de Cores e Estilos de Borda
            if (isEquipped) {
                // Borda AMARELA para arma atualmente equipada
                ctx.fillStyle = "rgba(255, 204, 0, 0.15)";
                ctx.strokeStyle = "#ffcc00";
                ctx.lineWidth = 2;
            } else if (isSelected) {
                // Borda AZUL para seleção normal
                ctx.fillStyle = "rgba(77, 144, 255, 0.2)";
                ctx.strokeStyle = "#4d90ff";
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
                ctx.strokeStyle = isWeaponSlot ? "rgba(77, 144, 255, 0.25)" : "rgba(255, 255, 255, 0.08)";
                ctx.lineWidth = 1;
            }

            this._drawRoundedRect(ctx, slotX, slotY, this.slotSize, this.slotSize, 8, true, true);

            if (isWeaponSlot && !content) {
                ctx.fillStyle = "rgba(77, 144, 255, 0.2)";
                ctx.font = "10px Arial";
                ctx.textAlign = "center";
                ctx.fillText("WPN", slotX + this.slotSize / 2, slotY + this.slotSize / 2 + 4);
                ctx.textAlign = "left";
            }

            if (content) {
                if (content.sprite && content.sprite.complete) {
                    ctx.drawImage(content.sprite, slotX + 6, slotY + 6, this.slotSize - 12, this.slotSize - 12);
                } else {
                    ctx.fillStyle = content.color || "#00ff00";
                    this._drawRoundedRect(ctx, slotX + 15, slotY + 15, this.slotSize - 30, this.slotSize - 30, 4, true, false);
                }
            }
        }

        // 5. Card Lateral de Detalhes
        const infoX = this.x + 320;
        const infoY = this.gridStartY;
        const infoW = 210;
        const infoH = 276;

        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        this._drawRoundedRect(ctx, infoX, infoY, infoW, infoH, 12, true, true);

        const selected = this.state.getSelectedItem();
        ctx.textAlign = "left";

        if (selected) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 15px Arial";
            ctx.fillText(selected.name, infoX + 15, infoY + 30);

            const isWeapon = this.state.selectedIndex < this.state.inventory.slotsWeapons;
            const isEquipped = this.state.isWeaponEquipped(selected);

            ctx.fillStyle = isEquipped ? "#ffcc00" : (isWeapon ? "#4d90ff" : "#ff9500");
            ctx.font = "bold 10px Arial";
            ctx.fillText(isEquipped ? "EQUIPADA" : (isWeapon ? "ARMA" : "ITEM"), infoX + 15, infoY + 48);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.beginPath();
            ctx.moveTo(infoX + 15, infoY + 60);
            ctx.lineTo(infoX + infoW - 15, infoY + 60);
            ctx.stroke();

            ctx.fillStyle = "#a2b4cc";
            ctx.font = "13px Arial";
            const description = selected.description || `ID: ${selected.id}\nNenhum detalhe adicional.`;
            this._wrapText(ctx, description, infoX + 15, infoY + 82, infoW - 30, 18);
        } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Selecione um slot", infoX + infoW / 2, infoY + infoH / 2);
            ctx.textAlign = "left";
        }

        // 6. Menu Popup de Opções
        if (this.state.contextMenuOpen && selected) {
            this._drawContextMenu(ctx);
        }

        ctx.restore();
    }

    _drawContextMenu(ctx) {
        const i = this.state.selectedIndex;
        const row = Math.floor(i / this.state.columns);
        const col = i % this.state.columns;

        let menuX = this.gridStartX + col * (this.slotSize + this.slotSpacing) + 20;
        let menuY = this.gridStartY + row * (this.slotSize + this.slotSpacing) + 20;

        const options = this.state.getContextMenuOptions();
        const menuWidth = 120;
        const itemHeight = 32;
        const menuHeight = options.length * itemHeight + 10;

        if (menuX + menuWidth > this.x + this.width) menuX -= menuWidth;
        if (menuY + menuHeight > this.y + this.height) menuY -= menuHeight;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this._drawRoundedRect(ctx, menuX + 4, menuY + 4, menuWidth, menuHeight, 8, true, false);

        ctx.fillStyle = "#1e2430";
        ctx.strokeStyle = "#4d90ff";
        ctx.lineWidth = 1.5;
        this._drawRoundedRect(ctx, menuX, menuY, menuWidth, menuHeight, 8, true, true);

        options.forEach((opt, idx) => {
            const optY = menuY + 5 + idx * itemHeight;
            const isHovered = (idx === this.state.contextMenuIndex);

            if (isHovered) {
                ctx.fillStyle = "rgba(77, 144, 255, 0.3)";
                this._drawRoundedRect(ctx, menuX + 4, optY, menuWidth - 8, itemHeight, 4, true, false);
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 13px Arial";
            } else {
                ctx.fillStyle = "#a2b4cc";
                ctx.font = "13px Arial";
            }

            ctx.textAlign = "center";
            ctx.fillText(opt, menuX + menuWidth / 2, optY + 20);
        });

        ctx.textAlign = "left";
    }

    _drawRoundedRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height - radius);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }
}