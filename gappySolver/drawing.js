/**
Draws what's inside spaces
*/
function drawInsideSpaces(p_context, p_drawer, p_colors, p_solver) {
	var items = [DrawableImage("img_star", 0, 0, 64, 64), DrawableX(p_colors.emptySquare)];
	indexSelectionFunction = function(x, y) {
		switch(p_solver.getAnswer(x, y)) {
			case STAR.YES : return 0;
			case STAR.NO : return 1;
			default : return -1;
		}
	}
	p_drawer.drawSpaceContents(p_context, items, indexSelectionFunction, p_solver.xyLength, p_solver.xyLength);
}