function drawInsideSpaces(p_context, p_drawer, p_colours, p_solver) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_colours, p_solver, p_solver.gridWall); 
	p_drawer.drawDiscGrid(p_context, p_solver.gridAstres, [SYMBOL_ID.SUN, SYMBOL_ID.MOON], [p_colours.sunOut, p_colours.moonOut], [p_colours.sunIn, p_colours.moonIn]);	
}