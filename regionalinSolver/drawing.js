function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {

	// Loop draw
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_coloursSet, p_solver, p_solver.gridWall);

	function selectionRegion(p_index) {
		const forcedValue = p_solver.expectedNumberInRegion(p_index);
		if (forcedValue == NOT_FORCED) {
			return null;
		} else {
			const space = p_solver.getSpaceCoordinates(p_index, 0); 
			const colour = (p_solver.getLinkSpace(space.x, space.y) == LOOP_STATE.CLOSED) ? p_coloursSet.reflectWrite : p_coloursSet.standardWrite
			return new DrawRegionArgument(space.x, space.y, forcedValue, colour) ;
		}
	}

	p_drawer.drawRegionIndications(p_context, selectionRegion, p_solver.regions.length, FONTS.ARIAL);
}