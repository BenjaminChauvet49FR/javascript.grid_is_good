/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver, p_purificator, p_selectionSet) {
	const bgSelectionItems = [DrawableColor(p_coloursSet.selectedSpace), DrawableColor(p_coloursSet.selectedCornerSpace)];
	bgSelectionSelection = function(x, y) {
		if (p_solver.getGridIndexes(x, y).length == 0) {
			return -1;
		}
		if (p_selectionSet.array[y][x] == SPACE_SELECTION_INPUT.SELECTED) {
			return 0;
		} else if (p_selectionSet.array[y][x] == SPACE_SELECTION_INPUT.CORNER_SELECTED) {
			return 1;
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, bgSelectionItems, bgSelectionSelection, p_solver.xLength, p_solver.yLength);
	p_drawer.drawNumbersInsideStandard2Dimensions(p_context, drawNumberClosure(p_solver, p_coloursSet), FONTS.ARIAL, p_solver.xLength, p_solver.yLength);
	
	if (p_purificator.isActive) {
		// Purify mode
		var itemsPur = [DrawableColor(p_coloursSet.purification)]; 
		function selectionSolverAndPurificator(x, y) {
			switch(p_purificator.getPurificatorSpaceIfDifferent(x, y)) {
				case null : return 0; // Remember : 'null' is when the new value is null !
				default : return -1; // The value EQUAL_TO_SOLVER.
			}
		}
		p_drawer.drawSpaceContentsCoorsList(p_context, itemsPur, selectionSolverAndPurificator, p_purificator.items);		
	}
	
}

drawNumberClosure = function(p_solver, p_coloursSet) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getFixedNumber(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_coloursSet.numberWriteFixed);
		} else {
			supposedNumber = p_solver.getNotFixedNumber(p_x, p_y);
			if (supposedNumber != null) {
				return new DrawSpaceValue(supposedNumber, p_coloursSet.numberWriteNotFixed);
			}
		}
		return null;
	}
}

Drawer.prototype.drawSudokuFrames = function(p_context, p_solver, p_mouseCoorsItem) {
	if (p_solver.grids.length > 1) {
		var grid, colour;
		const basicColour = COLOURS.SUDOKU_FRAME_ACTIVE;
		const colours = COLOURS.SUDOKU_FRAMES_RAINBOW;
		for (var i = 0 ; i < p_solver.grids.length ; i++) {
			grid = p_solver.grids[i];
			colour = colours[i % colours.length];
			this.drawCornersFrame(context, grid.xOrigin, grid.yOrigin, p_solver.gridLength, p_solver.gridLength, colour, false, true);
		}
		if (p_mouseCoorsItem.item != null) {
			const x = p_mouseCoorsItem.item.x;
			const y = p_mouseCoorsItem.item.y;
			if (x >= 0 && x < p_solver.xLength && y >= 0 && y < p_solver.yLength) {
				p_solver.getGridIndexes(x, y).forEach(index => {
					grid = p_solver.grids[index];
					this.drawCornersFrame(context, grid.xOrigin, grid.yOrigin, p_solver.gridLength, p_solver.gridLength, basicColour, true, false);
				});
			}
		}
	}
}