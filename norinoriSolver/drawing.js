/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver){
	var items = [DrawableColour(p_coloursSet.filledSpace), DrawableX(p_coloursSet.emptySpace)];
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
	p_drawer.drawSpaceContents2Dimensions(p_context, items, selectionItem, p_solver.xLength, p_solver.yLength);
	
}

