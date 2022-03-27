/**
Draws what's inside spaces
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver, p_selectionSet) {
	const bgSelectionItems = [DrawableColor(p_coloursSet.selectedSpace), DrawableColor(p_coloursSet.selectedCornerSpace)];
	bgSelectionSelection = function(x, y) {
		if (p_solver.getRegion(x, y) == WALLGRID.OUT_OF_REGIONS) {
			return -1;
		}
		return p_selectionSet.getDrawingSelectionIndex(x, y, 0, 1);
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, bgSelectionItems, bgSelectionSelection, p_solver.xyLength, p_solver.xyLength);

	const items = [DrawableImage("img_star", 0, 0, 64, 64), DrawableX(p_coloursSet.emptySpace)];
	indexSelectionFunction = function(x, y) {
		if (p_solver.getRegion(x, y) != WALLGRID.OUT_OF_REGIONS) { // Should this condition be missed the extra "no star" in banned spaces would be added.
			if(p_solver.getAnswer(x, y) == STAR.YES) {
				return 0;
			}
			if(p_solver.getAnswer(x, y) == STAR.NO) {
				return 1;	
			}
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, items, indexSelectionFunction, p_solver.xyLength, p_solver.xyLength);
}