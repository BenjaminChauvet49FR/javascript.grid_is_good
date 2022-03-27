
/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver, p_selectionSet) {
	
	const bgSelectionItems = [DrawableColor(p_coloursSet.selectedSpace), DrawableColor(p_coloursSet.selectedCornerSpace)];
	bgSelectionSelection = function(x, y) {
		return p_selectionSet.getDrawingSelectionIndex(x, y, 0, 1);
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, bgSelectionItems, bgSelectionSelection, p_solver.xLength, p_solver.yLength);
	
	var items = [DrawableColor(p_coloursSet.filledSpace), 
				 DrawableX(p_coloursSet.emptySpace)];
				
	function selection(x, y) {
		if (p_solver.getAnswer(x, y) == FILLING.YES) {
			return 0;
		} else if(p_solver.getAnswer(x, y) == FILLING.NO) {
			return 1;
		}
		return -1;
	}
	
		
	p_drawer.drawSpaceContents2Dimensions(p_context, items, selection, p_solver.xLength, p_solver.yLength);
	p_drawer.drawNumbersInsideStandardCoorsList(p_context, drawNumberClosure(p_solver, p_coloursSet), p_solver.numberedSpacesCoors, FONTS.ARIAL);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"),16,selection,0,p_solver.xLength,p_solver.yLength);
}

drawNumberClosure = function(p_solver, p_coloursSet) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getNumber(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_coloursSet.numberWrite);
		}
		return null;
	}
}