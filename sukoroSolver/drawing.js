/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver, p_purificator) {
	function selectionSpace(p_x, p_y) {
		// Note : no space background before quick start because of the design of the solver !
		
		const opening = p_solver.methodsSetDeductions.adjacencyMethod(p_x, p_y);
	    if (opening == ADJACENCY.YES) {
			if (p_solver.isBlocked(p_x, p_y)) {
				return 0;
			} else {				
				return 1;
			}
		} 
		if (opening == ADJACENCY.NO) {
			if (p_solver.isXSurroundedByNonX(p_x, p_y)) {
				return 3;				
			} else {				
				return 2;
			}
		}
		return -1;
	}
	
	function selectionOpening(p_x, p_y) {
		return p_solver.methodsSetDeductions.adjacencyMethod(p_x, p_y) == ADJACENCY.YES ? 0 : -1;
	}
	
	const colours = [DrawableColor(p_colourSet.openSpaceFixed), DrawableColor(p_colourSet.openSpaceNotFixed), DrawableX(p_colourSet.closedNearX), DrawableX(p_colourSet.closedFarX)];
	
	p_drawer.drawSpaceContents2Dimensions(p_context, colours, selectionSpace, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selectionOpening, 0, p_solver.xLength, p_solver.yLength);
	p_drawer.drawNumbersInsideStandard2Dimensions(p_context, drawNumberClosure(p_solver, p_colourSet), FONTS.ARIAL, p_solver.xLength, p_solver.yLength);
	
	if (p_purificator.isActive) {
		// Purify mode
		var itemsPur = [DrawableColor(p_colourSet.purification)]; 
		function selectionSolverAndPurificator(x, y) {
			switch(p_purificator.getPurificatorSpaceIfDifferent(x, y)) {
				case null : return 0; // Remember : 'null' is when the new value is null !
				default : return -1; // The value EQUAL_TO_SOLVER.
			}
		}
		p_drawer.drawSpaceContentsCoorsList(p_context, itemsPur, selectionSolverAndPurificator, p_purificator.items);		
	}
	
}

drawNumberClosure = function(p_solver, p_colourSet) {
	return function(p_x, p_y) {
		var supposedNumber = p_solver.getFixedNumber(p_x, p_y);
		if (supposedNumber != null && supposedNumber >= 1 && supposedNumber <= 4) {
			return new DrawSpaceValue(supposedNumber, p_colourSet.numberWriteFixed);
		} else {
			supposedNumber = p_solver.getNotFixedNumber(p_x, p_y);
			if (supposedNumber != null && supposedNumber >= 1 && supposedNumber <= 4) {
				return new DrawSpaceValue(supposedNumber, p_colourSet.numberWriteNotFixed);
			}
		}
		return null;
	}
}