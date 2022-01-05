function drawInsideSpaces(p_context, p_drawer, p_colours, p_solver) {

	function selectionRegion(p_index) {
		const forcedValue = p_solver.expectedNumberInRegion(p_index);
		if (forcedValue == null) {
			return null;
		} else {
			const space = p_solver.getSpaceCoordinates(p_index, 0);
			const colour = (p_solver.getLinkSpace(space.x, space.y) == LOOP_STATE.CLOSED) ? p_colours.reflectWrite : p_colours.standardWrite
			return new DrawRegionArgument(space.x, space.y, forcedValue, colour) ;
		}
	}
	p_drawer.drawRegionIndications(p_context, selectionRegion, p_solver.regions.length, FONTS.ARIAL);
	
}