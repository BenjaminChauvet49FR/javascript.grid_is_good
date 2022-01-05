function drawInsideSpaces(p_context, p_drawer, p_colours, p_solver) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_colours, p_solver, p_solver.gridWall); 
	p_drawer.drawDiscGrid(p_context, p_solver.gridLuminaries, [SYMBOL_ID.SUN, SYMBOL_ID.MOON], [p_colours.sunOut, p_colours.moonOut], [p_colours.sunIn, p_colours.moonIn]);	
	// Now, draw the Xs OVER the discs
	const items = [DrawableX(p_colours.noLinkState)];
	indexSelectionFunction = function(ix, iy) {
		if (p_solver.getLinkSpace(ix, iy) == LOOP_STATE.CLOSED && !p_solver.isBanned(ix,iy)) { // C/P from loop drawing
			return 0;
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, items, indexSelectionFunction, p_solver.xLength, p_solver.yLength); 
}