// Note : a slight mix of Koburin drawing and LoopSolver drawing
function drawing(p_context, p_drawer, p_colourSet, p_solver) {
	// VERY ADVISED TO put methods that draw the grid in first, as they generally begin with a canvas clean.
	// I didn't bother in other solvers since the drawing of the grid was held by the "main" file.
	p_drawer.drawFenceArray(p_context, p_solver.xLength, p_solver.yLength, getFenceRightClosure(p_solver.answerFencesGrid), getFenceDownClosure(p_solver.answerFencesGrid)); 
	// p_solver.getFenceRight / getFenceDown have no power here. Closures required. 	
	p_drawer.drawNumbersInsideStandardCoorsList(p_context, drawNumberClosure(p_solver, p_colourSet), p_solver.numberSpacesList, FONTS.ARIAL); 
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