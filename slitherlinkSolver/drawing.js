function draw(p_context, p_drawer, p_colourSet, p_solver) {
	
	p_drawer.drawDotsGrid(p_context, p_solver.xLength, p_solver.yLength, 
		function(p_x, p_y) {return linkToColour(p_solver.getLinkRight(p_x, p_y), p_colourSet)},
		function(p_x, p_y) {return linkToColour(p_solver.getLinkDown(p_x, p_y), p_colourSet)},
		function(p_xN, p_yN) {
			switch (p_solver.getLinkSpace(p_xN, p_yN)) {
				case LOOP_STATE.CLOSED : return p_colourSet.closedLink; break;
				case LOOP_STATE.LINKED : return p_colourSet.openNode; break;
				default : return p_colourSet.undecidedLink; break;
			}
		}, 
		function() {return DOTS_SIZE.MEDIUM})
	p_drawer.drawNumbersInsideStandard(p_context, drawNumberClosure(p_solver, p_colourSet), p_solver.xLength-1, p_solver.yLength-1);
}

drawNumberClosure = function(p_solver, p_colourSet) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getNumberInMesh(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_colourSet.numberWrite);
		}
		return null;
	}
}

function linkToColour(p_link, p_colourSet) {
	switch (p_link) {
		case LOOP_STATE.LINKED : return p_colourSet.openLink; break;
		case LOOP_STATE.CLOSED : return p_colourSet.closedLink; break;
		default : return p_colourSet.undecidedLink; break;
	}
}