/**
Draw the grid on-screen on p_context, with p_editorCore informations, with this.pix and p_colors information for pixels and colors
*/
Drawer.prototype.drawEditableGrid = function (p_context, p_editorCore) {
    const xLength = p_editorCore.getXLength();
    const yLength = p_editorCore.getYLength();
    if (p_editorCore.hasWallGrid()) {
        if (p_editorCore.hasWalls()) {
            this.drawWallGrid(p_context, p_editorCore.wallGrid, xLength, yLength);
        } else {
            this.drawWalllessGrid(p_context, p_editorCore.wallGrid, xLength, yLength);
        }
        // Selection
        for (var iy = 0; iy < yLength; iy++) {
            for (var ix = 0; ix < xLength; ix++) {
                if (p_editorCore.getSelection(ix, iy) == SELECTED.YES) {
                    p_context.fillStyle = this.editorColorSet.selectedSpace;
                    p_context.fillRect(this.getPixInnerXLeft(ix), this.getPixInnerYUp(iy), this.getPixInnerSide(), this.getPixInnerSide());
                }
            }
        }
    }
	
	// Which IDs are to be drawn ?
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_REGION)) {
	    this.drawNumbersLittleInCorner(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_REGION));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.PEARL)) {
		this.drawPearlGrid(p_context, p_editorCore.getGrid(GRID_ID.PEARL));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_SPACE)) {
	    this.drawNumbersGrid(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_SPACE));
	}
}

Drawer.prototype.drawNumbersLittleInCorner = function (p_context, p_numberGrid) {
	this.drawOneNumberPerSpace(p_context, p_numberGrid, this.getPixInnerSide() / 2, {offX : 2, offY : 2});
}

Drawer.prototype.drawNumbersGrid = function (p_context, p_numberGrid) {
	this.drawOneNumberPerSpace(p_context, p_numberGrid, this.getPixInnerSide() * 4 / 5, {offX : 1, offY : 1});
}

Drawer.prototype.drawOneNumberPerSpace = function (p_context, p_numberGrid, p_pixSize, p_pixInnerOffset) {
	const yLength = p_numberGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_numberGrid.getXLength();
		p_context.textAlign = 'left';
		p_context.textBaseline = 'top';
		p_context.font = p_pixSize + "px Arial";
		p_context.fillStyle = this.colors.standardWrite;
		var ix,
		iy,
		number, pixLeft, pixDown; 
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {
				number = p_numberGrid.get(ix, iy);
				if (number != null) {
					pixLeft = this.getPixInnerXLeft(ix) + p_pixInnerOffset.offX;
					pixDown = this.getPixInnerYUp(iy) + p_pixInnerOffset.offY;
					p_context.fillText(number, pixLeft, pixDown);
				}
			}
		}
	}
}

Drawer.prototype.drawPearlGrid = function (p_context, p_pearlGrid) {
	const yLength = p_pearlGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_pearlGrid.getXLength();
		p_context.fillStyle = this.colors.pearl;
		var ix,
		iy,
		pearl;
		const radius = this.getPixInnerSide()*1/3;
		p_context.fillStyle = this.colors.standardWrite; 
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {
				pearl = p_pearlGrid.get(ix, iy);
				if (pearl == SYMBOL_ID.WHITE) {
					//Crédits : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/ellipse 
					p_context.beginPath();
					p_context.ellipse(this.getPixCenterX(ix), this.getPixCenterY(iy), radius, radius, 0, 0, 2 * Math.PI);
					p_context.stroke();
				}
				if (pearl == SYMBOL_ID.BLACK) {
					p_context.beginPath();
					p_context.ellipse(this.getPixCenterX(ix), this.getPixCenterY(iy), radius, radius, 0, 0, 2 * Math.PI);
					p_context.fill();
				}
			}
		}
	}
}