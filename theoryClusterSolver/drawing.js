/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context,p_drawer,p_color,p_solver) {
	var items = [DrawableColor(p_color.openSquare),DrawableX(p_color.closedSquare), DrawableColor("#ffee88"), DrawableColor("#8800ff")];
	function selection(x, y) {
		if(p_solver.getAnswer(x, y) == SPACE.OPEN) {
			return 0;
		} else if (p_solver.getAnswer(x, y) == SPACE.CLOSED && !p_solver.isBanned(x, y)) {
			return 1;
		} else if (p_solver.getArtificialDeduction(x, y) == SPACE.OPEN) {
			return 2;
		} else if (p_solver.getArtificialDeduction(x, y) == SPACE.CLOSED) {
			return 3;
		}  
		return -1;
	}
	function selection2(x,y) {
		if(p_solver.getAnswer(x,y) == SPACE.OPEN) {
			return 0;
		}
		return -1;
	}
	p_drawer.drawSpaceContents(p_context,items,selection,p_solver.xLength,p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"),16,selection2,0,p_solver.xLength,p_solver.yLength);
}

