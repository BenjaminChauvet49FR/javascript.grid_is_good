function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver) {

	// Loop draw
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_colourSet, p_solver, p_solver.gridWall);

	function selectionRegion(p_index) {
		const forcedValue = p_solver.expectedNumberInRegion(p_index);
		if (forcedValue == NOT_FORCED) {
			return null;
		} else {
			const space = p_solver.getSpaceCoordinates(p_index, 0); 
			const colour = (p_solver.getLinkSpace(space.x, space.y) == LOOP_STATE.CLOSED) ? p_colourSet.writeRegionNumberContrast : p_colourSet.writeRegionNumber
			return new DrawRegionArgument(space.x, space.y, forcedValue, colour) ;
		}
	}

	p_drawer.drawRegionValues(p_context, selectionRegion, p_solver.regions.length, "Arial");
}