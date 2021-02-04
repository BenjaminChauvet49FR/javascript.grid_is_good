/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context,p_drawer,p_color,p_solver){
	var items = [DrawableColor(p_color.openSquare),
				DrawableX(p_color.closedSquare),
				DrawableColor(p_color.LSquare), 
				DrawableColor(p_color.ISquare), 
				DrawableColor(p_color.TSquare), 
				DrawableColor(p_color.SSquare)];
				
	function selectionShape(x,y){
		if(p_solver.getAnswer(x,y) != SPACE.CLOSED){
			switch (p_solver.getShape(x, y)) {
				case LITS.L : return 2; break;
				case LITS.I : return 3; break;
				case LITS.T : return 4; break;
				case LITS.S : return 5; break;
				default : return (p_solver.getAnswer(x,y) == SPACE.OPEN) ? 0 : -1;
			}
		}
		else {
			return 1;
		}
	}
	function selectionOpening(x,y) {
		if (p_solver.getAnswer(x,y) == SPACE.OPEN) {
			return 0;
		} else if(p_solver.getAnswer(x,y) == SPACE.CLOSED){
			return 1;
		}
		return -1;
	}
	
	p_drawer.drawSpaceContents(p_context,items,selectionShape,p_solver.xLength,p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"),16,selectionOpening,0,p_solver.xLength,p_solver.yLength);
}

