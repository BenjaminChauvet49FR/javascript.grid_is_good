/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {
	var items = [DrawableColor(p_coloursSet.openSpace), DrawableX(p_coloursSet.closedSpace)];
	function selection(x, y) {
		if (!p_solver.isBanned(x, y)) {
			if(p_solver.getAnswer(x, y) == ADJACENCY.YES) {
				return 0;
			} else if(p_solver.getAnswer(x, y) == ADJACENCY.NO) {
				return 1;
			}
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, items, selection, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"), 16, selection, 0, p_solver.xLength, p_solver.yLength);
	p_drawer.drawNumbersInsideStandardCoorsList(p_context, drawNumberClosure(p_solver, p_coloursSet), p_solver.rangedSpacesCoors, FONTS.ARIAL);
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
