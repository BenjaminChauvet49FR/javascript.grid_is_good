/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver, p_selectionSet) {
	const bgSelectionItems = [DrawableColor(p_colourSet.selectedSpace), DrawableColor(p_colourSet.selectedCornerSpace)];
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
	p_drawer.drawSpaceContents(p_context, bgSelectionItems, bgSelectionSelection, p_solver.xLength, p_solver.yLength);
	p_drawer.drawNumbersInsideStandard(p_context, drawNumberClosure(p_solver, p_colourSet), p_solver.xLength, p_solver.yLength);
}

drawNumberClosure = function(p_solver, p_colourSet) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getFixedNumber(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_colourSet.numberWriteFixed);
		} else {
			supposedNumber = p_solver.getNotFixedNumber(p_x, p_y);
			if (supposedNumber != null) {
				return new DrawSpaceValue(supposedNumber, p_colourSet.numberWriteNotFixed);
			}
		}
		return null;
	}
}

Drawer.prototype.drawSudokuFrames = function(p_context, p_solver, p_mouseCoorsItem) {
	var grid, colour;
	const basicColour = "#ff8800";
	const colours = ["#ff0000", "#00ccff", "#8800ff", "#00aa00", "#0000ff"];
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