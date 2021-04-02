function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_colourSet, p_solver); 
	p_drawer.drawNumbersInsideStandard(p_context, drawNumberClosure(p_solver, p_colourSet), p_solver.xLength, p_solver.yLength);
}

drawNumberClosure = function(p_solver, p_colourSet) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getNumber(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_colourSet.numberWrite);
		}
		return null;
	}
}