/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver, p_purificator) {
	function selectionOpening(p_x, p_y) {
		const opening = p_solver.methodsSetDeductions.adjacencyMethod(p_x, p_y);
	    if (opening == ADJACENCY.YES) {
			return 0;
		} 
		if (opening == ADJACENCY.NO) {
			if (p_solver.isXSurroundedByNonX(p_x, p_y)) {
				return 2;				
			} else {				
				return 1;
			}
		}
		return -1;
	}
	
	const colours = [DrawableColor(p_colourSet.openSquare), DrawableX(p_colourSet.closedNearX), DrawableX(p_colourSet.closedFarX)];
	
	p_drawer.drawSpaceContents(p_context, colours, selectionOpening, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selectionOpening, 0, p_solver.xLength, p_solver.yLength);
	p_drawer.drawNumbersInsideStandard(p_context, drawNumberClosure(p_solver, p_colourSet), p_solver.xLength, p_solver.yLength);
	
	if (p_purificator.isActive) {
		// Purify mode
		var itemsPur = [DrawableColor(p_colourSet.purification)]; 
		function selectionSolverAndPurificator(x, y) {
			switch(p_purificator.getPurificatorSpaceIfDifferent(x, y)) {
				case null : return 0; // Remember : 'null' is when the new value is null !
				default : return -1; // The value EQUAL_TO_SOLVER.
			}
		}
		p_drawer.drawSpaceContents(p_context, itemsPur, selectionSolverAndPurificator, p_solver.xLength, p_solver.yLength);		
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