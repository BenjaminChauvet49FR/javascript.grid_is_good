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


function drawing(p_context, p_drawer, p_colourSet, p_solver, p_extra) {
	function getAreaIndex(p_x, p_y) {
		switch (p_solver.getArea(p_x, p_y)) {
			case YAGIT_SHAPE.ROUND : return 0; break;
			case YAGIT_SHAPE.SQUARE : return 1; break;
			default : return (p_extra.checkBoxColorDeadEnds.checked && p_solver.deadEndsArray[p_y][p_x]) ? 2 : -1; break;
		}
	}
	
	const background = [DrawableColor(p_colourSet.circleArea), DrawableColor(p_colourSet.squareArea), DrawableColor("#ff8888")];
	p_drawer.drawFenceArrayGhostPillars(p_context, p_solver.xLength, p_solver.yLength, yagitGetFenceRightClosure(p_solver), yagitGetFenceDownClosure(p_solver)); 	
	p_drawer.drawSpaceContents(p_context, background, getAreaIndex, p_solver.xLength, p_solver.yLength);
	p_drawer.drawYagitGrid(p_context, p_solver.yagitShapesGrid);
	p_drawer.drawKnotsInRD(p_context, p_solver.yagitKnotsGrid);
}