/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_color, p_solver){
	var items = [DrawableColor(p_color.filledSquare),DrawableX(p_color.emptySquare)];
	function selectionItem(x,y){
		if  (p_solver.getRegion(x,y) != WALLGRID.OUT_OF_REGIONS){ // Should this condition be missed... (see star battle)
			if(p_solver.getAnswer(x,y) == FILLING.YES){
				return 0;
			}
			if(p_solver.getAnswer(x,y) == FILLING.NO){
				return 1;
			}
		}
		return -1;
	}
	p_drawer.drawSpaceContents(p_context, items, selectionItem, p_solver.xLength, p_solver.yLength);
	
}

