function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_coloursSet, p_solver); 
	p_drawer.drawFixedNumbersOrX(p_context, drawNumberClosure(p_solver), p_solver.numericCoordinatesList, p_solver.xCoordinatesList, p_coloursSet.numberWrite, p_coloursSet.numberWrite, FONTS.ARIAL);
}

drawNumberClosure = function(p_solver) {
	return function(p_x, p_y) {
		switch(p_solver.getNumber(p_x, p_y)) {
			case NOT_FORCED : return "X"; break;
			case null : return null; break;
			default : return p_solver.getNumber(p_x, p_y); break;
		}
	}
}

