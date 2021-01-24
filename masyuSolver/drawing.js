function drawInsideSpaces(p_context, p_drawer, p_colors, p_solver) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_colors, p_solver.loopSolver); 
	function getPearl (x, y) {
		if (p_solver.getPearl(x, y) == PEARL.WHITE) {
			return 0;
		} else if (p_solver.getPearl(x, y) == PEARL.BLACK) {
			return 1;
		}
		return -1;
	}
	p_drawer.drawSpaceContents(p_context, 
	[DrawableCircle(p_colors.circleOut, "#ffffff", 1), 
	DrawableCircle(p_colors.circleOut, p_colors.circleIn, 1)], 
	getPearl, solver.xLength, solver.yLength);  //TODO thickness non prise en compte !
}