/**
Draw the grid on-screen on p_context, with p_editorCore informations, with this.pix and coloursSet information for pixels and colours
*/
Drawer.prototype.drawEditableGrid = function (p_context, p_editorCore) {
	const xLength = p_editorCore.getXLength();
	const yLength = p_editorCore.getYLength();
	if (p_editorCore.hasVisibleEdges()) {
		if (p_editorCore.hasWalls()) {
			this.drawWallGrid(p_context, p_editorCore.wallGrid, xLength, yLength);
		} else {
			this.drawEmptyGrid(p_context, xLength, yLength);
		}
	} else {
		if (p_editorCore.holdsLinks()) { // Note : move this away ?
			this.drawDotsGrid(p_context, xLength, yLength, 
			function(x, y) {return p_editorCore.getLinkR(x, y) == LINKGRID.NOT_LINKED ? COLOURS.EDITOR_CLOSED_LINK_DOTS : COLOURS.EDITOR_LINKED_LINK_DOTS},
			function(x, y) {return p_editorCore.getLinkD(x, y) == LINKGRID.NOT_LINKED ? COLOURS.EDITOR_CLOSED_LINK_DOTS : COLOURS.EDITOR_LINKED_LINK_DOTS},
			function(x, y) {return COLOURS.EDITOR_VAGUE_NODE},
			function() {return DOTS_SIZE.MEDIUM});
		} else {			
			this.drawDotsGridSimple(p_context, xLength+1, yLength+1, COLOURS.LINKED_LINK_DOTS);
		}
	}

	const selection1st = !this.shouldDrawStrokedSelectionAfter(p_editorCore);

	// Selection (part 1)
	if (selection1st) {
		for (var iy = 0; iy < yLength; iy++) {
			for (var ix = 0; ix < xLength; ix++) {
				if (p_editorCore.getSelection(ix, iy) == SELECTED.YES) {
					this.fillInnerSpace(p_context, COLOURS.SELECTED_SPACE, ix, iy);
				}
			}
		}
		const sc = p_editorCore.getSelectedSpaceForRectangle();
		if (sc != null) {
			this.fillInnerSpace(p_context, COLOURS.SELECTED_CORNER_SPACE, sc.x, sc.y);
		}
	}
	
	// Which grids and margins are to be drawn ?
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_REGION)) {
		this.drawStringsLittleInCorner(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_REGION));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.DIGIT_X_SPACE)) {
		this.drawStringsGrid(p_context, p_editorCore.getGrid(GRID_ID.DIGIT_X_SPACE)); // TODO : add some actual crosses ? Letter X looks fine to me.
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.DIGIT_QUESTION_SPACE)) {
		this.drawStringsGrid(p_context, p_editorCore.getGrid(GRID_ID.DIGIT_QUESTION_SPACE));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_X_SPACE)) {
		this.drawStringsGrid(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_X_SPACE)); // See TODO above
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
		this.drawKnotsInRD(p_context, p_editorCore.getGrid(GRID_ID.KNOTS), COLOURS.KNOT_INNER, COLOURS.KNOT_BORDER);
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_SPACE)) {
		this.drawStringsGrid(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_SPACE));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.YAJILIN_LIKE)) {
		this.drawCombinedArrowGridIndications(p_context, p_editorCore.getGrid(GRID_ID.YAJILIN_LIKE));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.YAJILIN_BLACK_WHITE)) {
		this.drawCombinedArrowGridIndicationsBlackWhite(p_context, p_editorCore.getGrid(GRID_ID.YAJILIN_BLACK_WHITE));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_BLACK_WHITE)) {
		this.drawNumbersBlackWhiteGrid(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_BLACK_WHITE), FONTS.ARIAL);
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.OX)) {
		this.drawStringsGrid(p_context, p_editorCore.getGrid(GRID_ID.OX));
	}
	if (p_editorCore.isVisibleGrid(GRID_ID.SURAROMU)) {
		this.drawSuraromuEditorGrid(p_context, p_editorCore.getGrid(GRID_ID.SURAROMU));
	}	
	if (p_editorCore.getMarginInfoId() == MARGIN_KIND.NUMBERS_LEFT_UP.id) {
		this.drawMarginLeftUpOne(p_context, p_editorCore.margins[EDGES.LEFT], p_editorCore.margins[EDGES.UP], FONTS.ARIAL);
	}
	this.drawWildcardGrid(p_context, p_editorCore.getWildcardGrid());
	
	// Selection (part 2)
	if (!selection1st) {
		const pixStroke = Math.max(this.getPixInnerSide()/8, 2);
		for (var iy = 0; iy < yLength; iy++) {
			for (var ix = 0; ix < xLength; ix++) {
				if (p_editorCore.getSelection(ix, iy) == SELECTED.YES) {
					this.strokeInnerSpace(p_context, COLOURS.SELECTED_SPACE, ix, iy, pixStroke);
				}
			}
		}
		const sc = p_editorCore.getSelectedSpaceForRectangle();
		if (sc != null) {
			this.strokeInnerSpace(p_context, COLOURS.SELECTED_CORNER_SPACE, sc.x, sc.y, pixStroke);
		}
	}
	
}

Drawer.prototype.shouldDrawStrokedSelectionAfter = function(p_editorCore) {
	return p_editorCore.isVisibleGrid(GRID_ID.YAJILIN_BLACK_WHITE) || p_editorCore.isVisibleGrid(GRID_ID.NUMBER_BLACK_WHITE);
}

Drawer.prototype.drawStringsLittleInCorner = function (p_context, p_numberGrid) {
	this.drawOneStringPerSpace(p_context, p_numberGrid, this.getPixInnerSide() / 2, {offX : 2, offY : 2}, {alignH : "left", alignV : "top"});
}

Drawer.prototype.drawStringsGrid = function (p_context, p_numberGrid) {
	this.drawOneStringPerSpace(p_context, p_numberGrid, this.getPixInnerSide() * 4 / 5, {offX : this.getPixInnerSide()/2, offY : this.getPixInnerSide()/2}, {alignH : "center", alignV : "middle"});
}

// Note : quite different from drawTextInsideStandard2Dimensions in main drawer, although both could be made equal (still, we have a distinction between drawer in editor and drawer in solver) ; advantage here is that we read a grid
Drawer.prototype.drawOneStringPerSpace = function (p_context, p_numberGrid, p_pixSize, p_pixInnerOffset, p_textAlign) {
	const yLength = p_numberGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_numberGrid.getXLength();
		p_context.textAlign = p_textAlign.alignH;
		p_context.textBaseline = p_textAlign.alignV;
		p_context.font = p_pixSize + "px Arial"; // Note : in hard ! (but it's the editor)
		p_context.fillStyle = COLOURS.EDITOR_TEXT_WRITING;
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
	this.drawDiscGrid(p_context, p_pearlGrid, [SYMBOL_ID.WHITE, SYMBOL_ID.BLACK], [COLOURS.PEARL_OUT, COLOURS.PEARL_OUT], [COLOURS.WHITE_PEARL_IN, COLOURS.BLACK_PEARL_IN]);
}

Drawer.prototype.drawMoonsunGrid = function (p_context, p_luminariesGrid) {
	this.drawDiscGrid(p_context, p_luminariesGrid, [SYMBOL_ID.SUN, SYMBOL_ID.MOON], [COLOURS.SUN_OUT, COLOURS.MOON_OUT], [COLOURS.SUN_IN, COLOURS.MOON_IN]);
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
	const shapes = [DrawableCircle(COLOURS.HAKOIRI_EDGE, COLOURS.HAKOIRI_ROUND), DrawableSquare(COLOURS.HAKOIRI_EDGE, COLOURS.HAKOIRI_SQUARE), DrawableTriangle(COLOURS.HAKOIRI_EDGE, COLOURS.HAKOIRI_TRIANGLE)];
	this.drawSpaceContents2Dimensions(p_context, shapes, getShape, p_shapeGrid.getXLength(), p_shapeGrid.getYLength()); 
}

Drawer.prototype.drawWildcardGrid = function(p_context, p_withWildcardsGrid) {
	const yLength = p_withWildcardsGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_withWildcardsGrid.getXLength();
		setupFont(p_context, this.getPixInnerSide() * 4/5, FONTS.ARIAL, COLOURS.WILDCARD_WRITING);
		alignFontCenter(p_context);
		p_context.mix_blend_mode = "exclusion";
		var ix, iy; 
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {
				if (p_withWildcardsGrid.get(ix, iy) == WILDCARD_CHARACTER) {
					p_context.fillText(WILDCARD_CHARACTER, this.getPixCenterX(ix), this.getPixCenterY(iy));
				}
			}
		}
	}
}

Drawer.prototype.drawNumbersBlackWhiteGrid = function(p_context, p_grid, p_font) {
	writeFunction = function(p_x, p_y) { 
		const chain = p_grid.get(p_x, p_y);
		if (chain == null) {
			return null;
		}
		if (chain[0] == SYMBOL_ID.BLACK) { 
			colour1 = COLOURS.BLACK_ON_WHITE;
			colour2 = COLOURS.WHITE_ON_BLACK;
		} else {
			colour1 = COLOURS.WHITE_ON_BLACK;
			colour2 = COLOURS.BLACK_ON_WHITE;
		}
		return new DrawWriteSpaceValue( parseInt(chain.substring(1), 10), colour1, colour2);
	}
	this.drawTextInsideStandardWithBackground2Dimensions(p_context, writeFunction, p_font, p_grid.getXLength(), p_grid.getYLength());
}

Drawer.prototype.drawSuraromuEditorGrid = function(p_context, p_grid) {
	
	function getSpaceMethod (x, y) {
		chain = p_grid.get(x, y);
		if (chain != null) {			
			switch(chain.charAt(0)) {
				case "H" : return 0; break;
				case "V" : return 1; break;
				case "X" : return 2; break;
				case "S" : return 3; break;
			}
		}
		return -1;
	}
	
	function getGateNumberMethod(x, y) {
		chain = p_grid.get(x, y);
		if (chain != null && chain.length > 1) {
			return {writeColour : COLOURS.SURAROMU_LABEL_WRITE, backgroundColour : COLOURS.SURAROMU_LABEL_BG_FIXED, value : chain.substring(1)};
		} else {
			return null;
		}
	}
	
	const shapes = [DrawableHorizDots(COLOURS.SURAROMU_DOTS_GATE, 4), DrawableVertDots(COLOURS.SURAROMU_DOTS_GATE, 4), DrawableColour(COLOURS.SURAROMU_BG_BLOCKED_SPACE), DrawableCircle(COLOURS.SURAROMU_START_POINT_OUT, COLOURS.SURAROMU_START_POINT_IN)]; 
	this.drawSuraromuGrid(p_context, getSpaceMethod, shapes, getGateNumberMethod, p_grid.getXLength(), p_grid.getYLength());
}