function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {
	p_drawer.drawDotsGrid(p_context, p_solver.xLength, p_solver.yLength, 
		function(p_x, p_y) {
			if (p_solver.getLinkRBlocked(p_x, p_y)) {return p_coloursSet.blockedLink} 
			else return linkToColour(p_solver.getLinkRight(p_x, p_y), p_coloursSet)
		},
		function(p_x, p_y) {
			if (p_solver.getLinkDBlocked(p_x, p_y)) {return p_coloursSet.blockedLink} 
			else return linkToColour(p_solver.getLinkDown(p_x, p_y), p_coloursSet)
		},
		function() {return p_coloursSet.linkedLink}, 
		function() {return DOTS_SIZE.MEDIUM}
	)
}

function linkToColour(p_link, p_coloursSet) {
	switch (p_link) {
		case LOOP_STATE.LINKED : return p_coloursSet.linkedLink; break;
		case LOOP_STATE.CLOSED : return p_coloursSet.closedLink; break;
		default : return p_coloursSet.undecidedLink; break;
	}
}