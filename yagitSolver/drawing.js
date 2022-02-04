function yagitGetFenceRightClosure(p_solver) {
	return function(p_x, p_y) {
		return p_solver.getFenceRightState(p_x, p_y);
	}
}

function yagitGetFenceDownClosure(p_solver) {
	return function(p_x, p_y) {
		return p_solver.getFenceDownState(p_x, p_y);
	}
}



function drawing(p_context, p_drawer, p_coloursSet, p_solver, p_extra) {
	function getAreaIndex(p_x, p_y) {
		switch (p_solver.getArea(p_x, p_y)) {
			case YAGIT_SHAPE.ROUND : return 0; break;
			case YAGIT_SHAPE.SQUARE : return 1; break;
			default : return (p_extra.checkBoxColorDeadEnds.checked && p_solver.deadEndsArray[p_y][p_x]) ? 2 : -1; break;
		}
	}
	
	function getAreaIndexCBF(p_x, p_y) {
		if (p_solver.yagitShapesGrid.get(p_x, p_y) == null) {			
			switch (p_solver.getArea(p_x, p_y)) {
				case YAGIT_SHAPE.ROUND : return 0; break;
				case YAGIT_SHAPE.SQUARE : return 1; break;
			}
		}
		return -1;
	}
	
	const background = [DrawableColor(p_coloursSet.circleArea), DrawableColor(p_coloursSet.squareArea), DrawableColor(p_coloursSet.deadEndArea)];
	p_drawer.drawFenceArrayGhostPillars(p_context, p_solver.xLength, p_solver.yLength, yagitGetFenceRightClosure(p_solver), yagitGetFenceDownClosure(p_solver)); 	
	p_drawer.drawSpaceContents2Dimensions(p_context, background, getAreaIndex, p_solver.xLength, p_solver.yLength);
	if (p_extra.checkBoxColourblindFriendly.checked) {
		const spacesFG = [DrawableLittleCircleUpperRight(p_coloursSet.colourBlind), DrawableLittleSquareUpperRight(p_coloursSet.colourBlind)];
		p_drawer.drawSpaceContentsUpperRightCorner(p_context, spacesFG, getAreaIndexCBF, p_solver.xLength, p_solver.yLength);
	}
	p_drawer.drawYagitGrid(p_context, p_solver.yagitShapesGrid);
	p_drawer.drawKnotsInRD(p_context, p_solver.yagitKnotsGrid, COLOURS.KNOT_INNER, COLOURS.KNOT_BORDER);
}