function drawInsideSpaces(p_context, p_drawer, p_colours, p_solver) {

	function selectionRegion(p_index) {
		const forcedValue = p_solver.expectedNumberInRegion(p_index);
		if (forcedValue == null) {
			return null;
		} else {
			const space = p_solver.getSpaceCoordinates(p_index, 0);
			const colour = (p_solver.getLinkSpace(space.x, space.y) == LOOP_STATE.CLOSED) ? p_colours.writeRegionNumberContrast : p_colours.writeRegionNumber
			return new DrawRegionArgument(space.x, space.y, forcedValue, colour) ;
		}
	}
	p_drawer.drawRegionValues(p_context, selectionRegion, p_solver.regions.length, "Arial");
	
}