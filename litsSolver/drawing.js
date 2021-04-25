/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_color, p_solver) {
	var items = [DrawableColor(p_color.openSquare),
				DrawableX(p_color.closedSquare),
				DrawableColor(p_color.LSquare), 
				DrawableColor(p_color.ISquare), 
				DrawableColor(p_color.TSquare), 
				DrawableColor(p_color.SSquare),
				DrawableColor(p_color.LSquareLight),
				DrawableColor(p_color.ISquareLight),
				DrawableColor(p_color.TSquareLight),
				DrawableColor(p_color.SSquareLight)];
				
	function selectionShape(x,y){
		if(p_solver.getAnswer(x,y) != ADJACENCY.NO) {
			const opening = (p_solver.getAnswer(x,y) == ADJACENCY.YES);
			switch (p_solver.getShape(x, y)) {
				case LITS.L : return opening ? 2 : 6;
				case LITS.I : return opening ? 3 : 7;
				case LITS.T : return opening ? 4 : 8;
				case LITS.S : return opening ? 5 : 9;
				default : return opening ? 0 : -1;
			}
		}
		else {
			return (p_solver.isBanned(x, y)) ? -1 : 1; // Don't confuse selectionShape and selectionOpening ! 
		}
	}
	function selectionOpening(x,y) {
		if (p_solver.getAnswer(x,y) == ADJACENCY.YES) {
			return 0;
		} else if (p_solver.getAnswer(x, y) == ADJACENCY.NO) {
			return 1;
		}
		return -1;
	}
	
	p_drawer.drawSpaceContents(p_context, items, selectionShape, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selectionOpening, 0, p_solver.xLength, p_solver.yLength);
}

