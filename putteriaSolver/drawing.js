/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver) {
	// Note : not a problem since running the grid an additional time seems not that compilcated, not even at a 30 fps speed, but still, not optimized.
	p_drawer.drawNumbersInsideStandard2Dimensions(p_context, drawNumberOrXClosure(p_solver, p_colourSet), FONTS.ARIAL, p_solver.xLength, p_solver.yLength);
	p_drawer.drawSpaceContents2Dimensions(p_context, [DrawableX(p_colourSet.fixedColour), DrawableX(p_colourSet.notFixedColour)], drawXClosure(p_solver), p_solver.xLength, p_solver.yLength);
}

drawNumberOrXClosure = function(p_solver, p_colourSet) {
	return function(p_x, p_y) {
		var xOrNumber = p_solver.getXOrNumber(p_x, p_y);
		if (xOrNumber != null && xOrNumber != "X") {
			return new DrawSpaceValue(xOrNumber, p_solver.isFixed(p_x, p_y) ? p_colourSet.fixedColour : p_colourSet.notFixedColour);
		}
		return null;
	}
}

drawXClosure = function(p_solver) {	
	return function(x, y) {
		return (p_solver.getXOrNumber(x, y) == "X") ? (p_solver.isFixed(x, y) ? 0 : 1): -1 ; // getXOrNumber = already for draw function, so no check for "out of regions" like in Starbattle
	}
}
