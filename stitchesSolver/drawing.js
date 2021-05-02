/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colorSet, p_solver) {
	
	function linksRight (p_x, p_y) {
		const state = p_solver.getLink(p_x, p_y, DIRECTION.RIGHT);
		if ((state == LINK_STATE.UNDECIDED) || (p_solver.isSameRegionRight(p_x, p_y))) { 
			return DRAW_PATH.UNDECIDED;
		} else {
			return (state == LINK_STATE.CLOSED ? DRAW_PATH.CLOSED : DRAW_PATH.OPEN);
		}
	}
	function linksDown (p_x, p_y) {
		const state = p_solver.getLink(p_x, p_y, DIRECTION.DOWN);
		if ((state == LINK_STATE.UNDECIDED) || (p_solver.isSameRegionDown(p_x, p_y))) { 
			return DRAW_PATH.UNDECIDED;
		} else {
			return (state == LINK_STATE.CLOSED ? DRAW_PATH.CLOSED : DRAW_PATH.OPEN);
		}
	}
	
	p_drawer.drawClosablePaths(p_context, linksRight, linksDown, p_solver.xLength, p_solver.yLength, p_colorSet.bind, p_colorSet.isolate, new alternateClosedPathDraw(p_solver.gridWall, p_colorSet.isolateRegion)); 
	
	function getStitch (p_x, p_y) {
		const state = p_solver.getSpace(p_x, p_y);
		if (state == SPACE_STATE.BUTTON) {
			return 0;
		} else if (state == SPACE_STATE.EMPTY) {
			return 1;
		} 
		return -1;
	}
	p_drawer.drawSpaceContents(p_context, [DrawableCircle(p_colorSet.openStitchOut, p_colorSet.openStitchIn), DrawableX(p_colorSet.closedSpace)], getStitch, p_solver.xLength, p_solver.yLength); 
}

