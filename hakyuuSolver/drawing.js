/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {
	p_drawer.drawNumbersInsideStandard2Dimensions(p_context, drawNumberClosure(p_solver, p_coloursSet), FONTS.ARIAL, p_solver.xLength, p_solver.yLength);
}

drawNumberClosure = function(p_solver, p_coloursSet) {
	return function(p_x, p_y) {
		supposedNumber = p_solver.getFixedNumber(p_x, p_y);
		if (supposedNumber != null) {
			return new DrawSpaceValue(supposedNumber, p_coloursSet.numberWriteFixed);
		} else {
			supposedNumber = p_solver.getNotFixedNumber(p_x, p_y);
			if (supposedNumber != null) {
				return new DrawSpaceValue(supposedNumber, p_coloursSet.numberWriteNotFixed);
			}
		}
		return null;
	}
}
