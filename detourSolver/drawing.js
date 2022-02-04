function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {

	const spacesFG = [DrawableLittleCircleUpperRight(p_coloursSet.turningSign), DrawableLittlePlusUpperRight(p_coloursSet.straightSign)];

	function getSpaceTurning(p_x, p_y) { 
		if (p_solver.drawIfNotFullyLinkedRegion(p_x, p_y)) {			
			const val = p_solver.getTurning(p_x, p_y);
			switch (val) {
				case TURNING.YES : return 0; break;
				case TURNING.NO : return 1; break;
				case TURNING.UNDECIDED : return -1; break;
			}
		}
	}

	p_drawer.drawSpaceContentsUpperRightCorner(p_context, spacesFG, getSpaceTurning, p_solver.xLength, p_solver.yLength);
	
	// Loop draw
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_coloursSet, p_solver, p_solver.gridWall);

	function selectionRegion(p_index) {
		const forcedValue = p_solver.expectedNumberInRegion(p_index);
		if (forcedValue == NOT_FORCED) {
			return null;
		} else {
			const space = p_solver.getSpaceCoordinates(p_index, 0);
			return new DrawRegionArgument(space.x, space.y, forcedValue, p_coloursSet.standardWrite) ;
		}
	}

	p_drawer.drawRegionIndications(p_context, selectionRegion, p_solver.regions.length, FONTS.ARIAL);
}