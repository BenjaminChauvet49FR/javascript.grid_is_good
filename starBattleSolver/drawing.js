/**
Draws what's inside spaces
*/
function drawInsideSpaces(p_context, p_drawer, p_colors, p_solver) {
	var items = [DrawableImage("img_star", 0, 0, 64, 64),DrawableX(p_colors.emptySquare)];
	indexSelectionFunction = function(x, y){
		if  (p_solver.getRegion(x, y) != WALLGRID.OUT_OF_REGIONS) { // Should this condition be missed the extra "no star" in banned spaces would be added.
			if(p_solver.getAnswer(x, y) == SYMBOL.STAR) {
				return 0;
			}
			if(p_solver.getAnswer(x, y) == SYMBOL.NO_STAR) {
				return 1;	
			}
		}
		return -1;
	}
	p_drawer.drawSpaceContents(p_context, items, indexSelectionFunction, p_solver.xyLength, p_solver.xyLength);
}