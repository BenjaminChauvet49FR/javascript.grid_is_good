function drawInsideSpaces(p_context, p_drawer, p_color, p_solver) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_solver.loopSolver); 
	function getPearl (x, y) {
		if (p_solver.getPearl(x, y) == PEARL.WHITE) {
			return 0;
		} else if (p_solver.getPearl(x, y) == PEARL.BLACK) {
			return 1;
		}
		return -1;
	}
	p_drawer.drawSpaceContents(p_context, 
	[DrawableCircle(p_color.circleOut, "#ffffff", 1), 
	DrawableCircle(p_color.circleOut, p_color.circleIn, 1)], 
	getPearl, solver.xLength, solver.yLength);  //TODO thickness non prise en compte !
}