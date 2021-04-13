/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colours, p_solver) {
	var items = [DrawableColor(p_colours.openSquare), DrawableX(p_colours.closedSquare)];
	function selection(x, y) {
		if (!p_solver.isBanned(x, y)) {
			if(p_solver.getAnswer(x, y) == SPACE.OPEN) {
				return 0;
			} else if(p_solver.getAnswer(x, y) == SPACE.CLOSED) {
				return 1;
			}
		}
		return -1;
	}
	p_drawer.drawSpaceContents(p_context, items, selection, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"), 16, selection, 0, p_solver.xLength, p_solver.yLength);
}

