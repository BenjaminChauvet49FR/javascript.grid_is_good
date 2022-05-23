drawInsideSpaces = function(p_context, p_drawer, p_colours, p_solver) {

	function getSpaceMethod (x, y) {
		if (p_solver.hasGateH(x, y)) {
			return 0;
		}
		if (p_solver.hasGateV(x, y)) {
			return 1;
		}
		if (p_solver.isBanned(x, y)) {
			return 2;
		}
		if (p_solver.isStartPoint(x, y)) {
			return 3;
		}
		return -1;
	}
	
	// getDrawedGateNumberMethod and not getGateNumberMethod because spaces with X should not have labels
	function getDrawedGateNumberMethod(x, y) {
		number = p_solver.getNumberGate(x, y);
		if (number != null && p_solver.getLinkSpace(x, y) != LOOP_STATE.CLOSED) { 
			return {writeColour : p_colours.labelWrite, backgroundColour : p_solver.hasFixedNumber(x, y) ? p_colours.labelBgFixed : p_colours.labelBgNotFixed, value : number};
		} else {
			return null;
		}
	}
	
	const shapes = [DrawableHorizDots(p_colours.dotsGate, 4), DrawableVertDots(p_colours.dotsGate, 4), DrawableColour(p_colours.blockedSpace), DrawableCircle(p_colours.startOut, p_colours.startIn)]; 
	p_drawer.drawSolverLinkInsideSpaces(p_context, p_colours, p_solver); 
	p_drawer.drawSuraromuGrid(p_context, getSpaceMethod, shapes, getDrawedGateNumberMethod, p_solver.xLength, p_solver.yLength);
}