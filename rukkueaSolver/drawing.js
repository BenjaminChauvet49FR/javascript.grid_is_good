
/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colours, p_solver, p_selectionSet) {
	
	const bgSelectionItems = [DrawableColor(p_colours.selectedSpace), DrawableColor(p_colours.selectedCornerSpace)];
	bgSelectionSelection = function(x, y) {
		if (p_selectionSet.array[y][x] == SPACE_SELECTION_INPUT.SELECTED) {
			return 0;
		} else if (p_selectionSet.array[y][x] == SPACE_SELECTION_INPUT.CORNER_SELECTED) {
			return 1;
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, bgSelectionItems, bgSelectionSelection, p_solver.xLength, p_solver.yLength);
	
	var items = [DrawableColor(p_colours.filledSpace), 
				 DrawableX(p_colours.emptySpace)];
				
	function selection(x, y) {
		if (p_solver.getAnswer(x, y) == FILLING.YES) {
			return 0;
		} else if(p_solver.getAnswer(x, y) == FILLING.NO) {
			return 1;
		}
		return -1;
	}
	
		
	p_drawer.drawSpaceContents2Dimensions(p_context, items, selection, p_solver.xLength, p_solver.yLength);
	p_drawer.drawNumbersInsideStandardCoorsList(p_context, drawNumberClosure(p_solver, p_colours), p_solver.numberedSpacesCoors, FONTS.ARIAL);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"),16,selection,0,p_solver.xLength,p_solver.yLength);
}

drawNumberClosure = function(p_solver, p_colours) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getNumber(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_colours.numberWrite);
		}
		return null;
	}
}