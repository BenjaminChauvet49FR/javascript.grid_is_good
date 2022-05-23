function drawing(p_context, p_drawer, p_coloursSet, p_solver, p_purificator, p_extraIndications) {
	p_drawer.drawFenceArray(p_context, p_solver.xLength, p_solver.yLength, getFenceRightClosure(p_solver.answerFencesGrid), getFenceDownClosure(p_solver.answerFencesGrid)); 
	p_drawer.drawTextInsideStandardCoorsList(p_context, drawNumberClosure(p_solver, p_coloursSet), p_solver.numericCoordinatesList, FONTS.ARIAL);
	p_drawer.drawTextInsideStandardCoorsList(p_context, drawNumberClosure(p_solver, p_coloursSet), p_solver.questionCoordinatesList, FONTS.ARIAL);
	
	if (p_purificator.isActive) {
		// Purify mode
		var itemsPur = [DrawableColour(p_coloursSet.purification), DrawableText(p_coloursSet.purification, "?", FONTS.ARIAL)]; 
		function selectionSolverAndPurificator(x, y) {
			switch(p_purificator.getPurificatorSpaceIfDifferent(x, y)) {
				case null : return 0; // Remember : 'null' is when the new value is null !
				case "?" : return 1;
				default : return -1; // The value EQUAL_TO_SOLVER.
			}
		}
		p_drawer.drawSpaceContentsCoorsList(p_context, itemsPur, selectionSolverAndPurificator, p_purificator.items);		
	} else {
		if (p_extraIndications.checkBoxPossibilities.checked) {
			p_drawer.drawTextInsideStandard2DimensionsLittle(p_context, drawPossibilitiesClosure(p_solver, p_coloursSet), FONTS.ARIAL, p_solver.xLength, p_solver.yLength);
		}
	}
}

drawNumberClosure = function(p_solver, p_coloursSet) {
	return function(p_x, p_y) {
		return new DrawSpaceValue(p_solver.getFixedNumber(p_x, p_y), p_coloursSet.numberWrite); 
	}
}

drawPossibilitiesClosure = function(p_solver, p_coloursSet) {
	return function(p_x, p_y) {
		var mayBeNull = p_solver.getRemainingPossibilities(p_x, p_y);
		if (mayBeNull == null) {
			return null;
		}
		return new DrawSpaceValue(p_solver.getRemainingPossibilities(p_x, p_y), p_coloursSet.cluesWrite);
	}
}