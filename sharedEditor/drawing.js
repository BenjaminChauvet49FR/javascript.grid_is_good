const colourSet = { 
	sunOut : "#888800",
	sunIn : "#ffff88",
	moonOut : "#222222",
	moonIn : "#aa88cc",
	pearlOut : "#000000",
	pearlWhite : "#ffffff",
	pearlBlack : "#000044"
}

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
			this.drawEmptyGrid(p_context, xLength, yLength);
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
		const sc = p_editorCore.getSelectedSpaceForRectangle();
		if (sc != null) {
			p_context.fillStyle = this.editorColorSet.selectedCornerSpace;
			p_context.fillRect(this.getPixInnerXLeft(sc.x), this.getPixInnerYUp(sc.y), this.getPixInnerSide(), this.getPixInnerSide());
		}
	}
	
	// Which grids and margins are to be drawn ?
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_REGION)) {
		this.drawNumbersLittleInCorner(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_REGION));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.DIGIT_X_SPACE)) {
		this.drawNumbersGrid(p_context, p_editorCore.getGrid(GRID_ID.DIGIT_X_SPACE)); // TODO : add some actual crosses ? Letter X looks fine to me.
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_X_SPACE)) {
		this.drawNumbersGrid(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_X_SPACE)); // See TODO above
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.PEARL)) {
		this.drawPearlGrid(p_context, p_editorCore.getGrid(GRID_ID.PEARL));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.MOONSUN)) {
		this.drawMoonsunGrid(p_context, p_editorCore.getGrid(GRID_ID.MOONSUN));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.PLAYSTATION_SHAPES)) {
		this.drawPlaystationShapeGrid(p_context, p_editorCore.getGrid(GRID_ID.PLAYSTATION_SHAPES));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.YAGIT)) {
		this.drawYagitGrid(p_context, p_editorCore.getGrid(GRID_ID.YAGIT));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.TAPA)) {
		this.drawTapaGrid(p_context, p_editorCore.getGrid(GRID_ID.TAPA));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.GALAXIES)) {
		this.drawGalaxiesGrid(p_context, p_editorCore.getGrid(GRID_ID.GALAXIES));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.KNOTS)) {
		this.drawKnotsInRD(p_context, p_editorCore.getGrid(GRID_ID.KNOTS));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_SPACE)) {
		this.drawNumbersGrid(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_SPACE));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.YAJILIN_LIKE)) {
		this.drawCombinedArrowGridIndications(p_context, p_editorCore.getGrid(GRID_ID.YAJILIN_LIKE));
	}
	if (p_editorCore.getMarginInfoId() == MARGIN_KIND.NUMBERS_LEFT_UP.id) {
		this.drawMarginLeftUpOne(p_context, p_editorCore.margins[EDGES.LEFT], p_editorCore.margins[EDGES.UP]);
	}
	this.drawWildCardGrid(p_context, p_editorCore.getWildCardGrid());
}

Drawer.prototype.drawNumbersLittleInCorner = function (p_context, p_numberGrid) {
	this.drawOneNumberPerSpace(p_context, p_numberGrid, this.getPixInnerSide() / 2, {offX : 2, offY : 2}, {alignH : "left", alignV : "top"});
}

Drawer.prototype.drawNumbersGrid = function (p_context, p_numberGrid) {
	this.drawOneNumberPerSpace(p_context, p_numberGrid, this.getPixInnerSide() * 4 / 5, {offX : this.getPixInnerSide()/2, offY : this.getPixInnerSide()/2}, {alignH : "center", alignV : "middle"});
}

Drawer.prototype.drawOneNumberPerSpace = function (p_context, p_numberGrid, p_pixSize, p_pixInnerOffset, p_textAlign) {
	const yLength = p_numberGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_numberGrid.getXLength();
		p_context.textAlign = p_textAlign.alignH;
		p_context.textBaseline = p_textAlign.alignV;
		p_context.font = p_pixSize + "px Arial";
		p_context.fillStyle = "#000000";
		p_context.mix_blend_mode = "exclusion";
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
	this.drawDiscGrid(p_context, p_pearlGrid, [SYMBOL_ID.WHITE, SYMBOL_ID.BLACK], [colourSet.pearlOut, colourSet.pearlOut], [colourSet.pearlWhite, colourSet.pearlBlack]);
}

Drawer.prototype.drawMoonsunGrid = function (p_context, p_astresGrid) {
	this.drawDiscGrid(p_context, p_astresGrid, [SYMBOL_ID.SUN, SYMBOL_ID.MOON], [colourSet.sunOut, colourSet.moonOut], [colourSet.sunIn, colourSet.moonIn]);
}

Drawer.prototype.drawPlaystationShapeGrid = function (p_context, p_shapeGrid) {
	function getShape (x, y) {
		if (p_shapeGrid.get(x, y) == SYMBOL_ID.ROUND) {
			return 0;
		} else if (p_shapeGrid.get(x, y) == SYMBOL_ID.SQUARE) {
			return 1;
		} else if (p_shapeGrid.get(x, y) == SYMBOL_ID.TRIANGLE) {
			return 2;
		}
		return -1;
	}
	const shapes = [DrawableCircle("#000000", "#ff0000"), DrawableSquare("#000000", "#008800"), DrawableTriangle("#000000", "#4400ff")];
	this.drawSpaceContents(p_context, shapes, getShape, p_shapeGrid.getXLength(), p_shapeGrid.getYLength()); 
}

Drawer.prototype.drawWildCardGrid = function(p_context, p_withWildCardsGrid) {
	const yLength = p_withWildCardsGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_withWildCardsGrid.getXLength();
		setupFont(p_context, this.getPixInnerSide() * 4/5, "Arial", "#000000");
		alignFontCenter(p_context);
		p_context.mix_blend_mode = "exclusion";
		var ix, iy; 
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {
				if (p_withWildCardsGrid.get(ix, iy) == WILD_CARD_CHARACTER) {
					p_context.fillText(WILD_CARD_CHARACTER, this.getPixCenterX(ix), this.getPixCenterY(iy));
				}
			}
		}
	}
}