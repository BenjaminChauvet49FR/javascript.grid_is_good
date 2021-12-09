function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver) {
	p_drawer.drawDotsGrid(p_context, p_solver.xLength, p_solver.yLength, 
		function(p_x, p_y) {
			if (p_solver.getLinkRBlocked(p_x, p_y)) {return p_colourSet.blockedLink} 
			else return linkToColour(p_solver.getLinkRight(p_x, p_y), p_colourSet)
		},
		function(p_x, p_y) {
			if (p_solver.getLinkDBlocked(p_x, p_y)) {return p_colourSet.blockedLink} 
			else return linkToColour(p_solver.getLinkDown(p_x, p_y), p_colourSet)
		},
		function() {return p_colourSet.openLink}, 
		function() {return DOTS_SIZE.MEDIUM}
	)
}

function linkToColour(p_link, p_colourSet) {
	switch (p_link) {
		case LOOP_STATE.LINKED : return p_colourSet.openLink; break;
		case LOOP_STATE.CLOSED : return p_colourSet.closedLink; break;
		default : return p_colourSet.undecidedLink; break;
	}
}