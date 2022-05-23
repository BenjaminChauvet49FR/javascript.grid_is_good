function draw(p_context, p_drawer, p_coloursSet, p_solver) {
	
	p_drawer.drawDotsGrid(p_context, p_solver.xLength, p_solver.yLength, 
		function(p_x, p_y) {return linkToColour(p_solver.getLinkRight(p_x, p_y), p_coloursSet)},
		function(p_x, p_y) {return linkToColour(p_solver.getLinkDown(p_x, p_y), p_coloursSet)},
		function(p_xN, p_yN) {
			switch (p_solver.getLinkSpace(p_xN, p_yN)) {
				case LOOP_STATE.CLOSED : return p_coloursSet.closedLink; break;
				case LOOP_STATE.LINKED : return p_coloursSet.linkedNode; break;
				default : return p_coloursSet.undecidedLink; break;
			}
		}, 
		function() {return DOTS_SIZE.MEDIUM});
	p_drawer.drawNumbersInsideStandardCoorsList(p_context, drawNumberClosure(p_solver, p_coloursSet), p_solver.numericMeshCoordinatesList, FONTS.ARIAL);
}

drawNumberClosure = function(p_solver, p_coloursSet) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getNumberInMesh(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_coloursSet.numberWrite);
		}
		return null;
	}
}

function linkToColour(p_link, p_coloursSet) {
	switch (p_link) {
		case LOOP_STATE.LINKED : return p_coloursSet.linkedLink; break;
		case LOOP_STATE.CLOSED : return p_coloursSet.closedLink; break;
		default : return p_coloursSet.undecidedLink; break;
	}
}