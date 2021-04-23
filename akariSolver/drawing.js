/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver) {
	
	function getSpaceBackground(p_x, p_y) { // Wall or lit space
		const val = p_solver.getFixedSpace(p_x, p_y);
		if (val != null) {
			return 0;
		} else if (p_solver.isLighted(p_x, p_y)) {
			return 1;
		}
		return -1;
	}
	
	// For empty spaces. (TODO : possible combination with number drawing ?)
	function getEmptySpaceElement(p_x, p_y) { // Cross or bulb
		if (p_solver.getFixedSpace(p_x, p_y) != null) {
			return -1;
		}
		const answer = p_solver.getAnswer(p_x, p_y);
		if (answer == FILLING.YES) {
			return 0;
		} else if (!p_solver.isLighted(p_x, p_y) && (answer == FILLING.NO)) {
			return 1;
		}
		return -1;
	}
	
	drawNumberClosure = function(p_solver, p_colourSet) {
		return function(p_x, p_y) {
			supposedNumber = p_solver.getFixedSpace(p_x, p_y);
			if (supposedNumber != null && supposedNumber != NOT_FORCED) {
				return new DrawSpaceValue(supposedNumber, p_colourSet.numberWrite);
			}
			return null;
		}
	} 
	
	const spacesBG = [DrawableColor(p_colourSet.wallSpace), DrawableColor(p_colourSet.litSpace)];
	const shapesFG = [DrawableCircle(p_colourSet.line, p_colourSet.lightbulb), DrawableLittleX(p_colourSet.line)];
	p_drawer.drawSpaceContents(p_context, spacesBG, getSpaceBackground, p_solver.xLength, p_solver.yLength);
	p_drawer.drawSpaceContents(p_context, shapesFG, getEmptySpaceElement, p_solver.xLength, p_solver.yLength);
	p_drawer.drawNumbersInsideStandard(p_context, drawNumberClosure(p_solver, p_colourSet), p_solver.xLength, p_solver.yLength);

	
}

