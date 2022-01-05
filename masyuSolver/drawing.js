function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver, p_purificator) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_coloursSet, p_solver); 
	function getPearl (x, y) { 
		if (p_solver.getPearl(x, y) == PEARL.WHITE) {
			return 0;
		} else if (p_solver.getPearl(x, y) == PEARL.BLACK) {
			return 1;
		}
		return -1;
	}
	p_drawer.drawSpaceContentsCoorsList(p_context, 
	[DrawableCircle(p_coloursSet.circleOut, p_coloursSet.circleWhiteIn), 
	DrawableCircle(p_coloursSet.circleOut, p_coloursSet.circleBlackIn)], 
	getPearl, p_solver.pearlSpacesList);  // Note : no thickness taken into account
	
	
	if (p_purificator.isActive) {
		// Purify mode
		var itemsPur = [DrawableColor(p_coloursSet.purification)]; 
		function selectionSolverAndPurificator(x, y) {
			switch(p_purificator.getPurificatorSpaceIfDifferent(x, y)) {
				case null : return 0; // Remember : 'null' is when the new value is null !
				default : return -1; // The value EQUAL_TO_SOLVER.
			}
		}
		p_drawer.drawSpaceContentsCoorsList(p_context, itemsPur, selectionSolverAndPurificator, p_purificator.items);	
	}
}