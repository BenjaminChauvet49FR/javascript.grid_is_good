function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_coloursSet, p_solver, p_solver.gridWall); 
	p_drawer.drawDiscGrid(p_context, p_solver.gridLuminaries, [SYMBOL_ID.SUN, SYMBOL_ID.MOON], [p_coloursSet.sunOut, p_coloursSet.moonOut], [p_coloursSet.sunIn, p_coloursSet.moonIn]);	
	// Now, draw the Xs OVER the discs
	const items = [DrawableX(p_coloursSet.noLinkState)];
	indexSelectionFunction = function(ix, iy) {
		if (p_solver.getLinkSpace(ix, iy) == LOOP_STATE.CLOSED && !p_solver.isBanned(ix,iy)) { // C/P from loop drawing
			return 0;
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, items, indexSelectionFunction, p_solver.xLength, p_solver.yLength); 
}