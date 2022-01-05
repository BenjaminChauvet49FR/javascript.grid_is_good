/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver, p_purificator) {	
	p_drawer.drawFenceArray(p_context, p_solver.xLength, p_solver.yLength, getFenceRightDominoDrawingClosure(p_solver), getFenceDownDominoDrawingClosure(p_solver)); 
	p_drawer.drawFixedNumbersOrX(p_context, drawNumberOrXClosure(p_solver), p_solver.numericCoordinatesList, p_solver.xCoordinatesList, p_colourSet.numberWrite, p_colourSet.numberWrite, FONTS.ARIAL);
	
	const colours = [DrawableColor(p_colourSet.closedSpace), DrawableColor(p_colourSet.openSpace)];
	selectionOpening = selectionOpeningClosure(p_solver);
	p_drawer.drawSpaceContents2Dimensions(p_context, colours, selectionOpening, p_solver.xLength, p_solver.yLength);
	shapes = [DrawableCircle(p_colourSet.shapeOuter, p_colourSet.shapeInner), DrawableSquare(p_colourSet.shapeOuter, p_colourSet.shapeInner)];
	p_drawer.drawSpaceContents2Dimensions(p_context, shapes, getShapeClosure(p_solver), p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selectionOpening, 1, p_solver.xLength, p_solver.yLength);
	
	if (p_purificator.isActive) {
		// Purify mode
		var itemsPur = [DrawableX(p_colourSet.purification)]; 
		function selectionSolverAndPurificator(x, y) {
			switch(p_purificator.getPurificatorSpaceIfDifferent(x, y)) {
				case "X" : return 0; 
				default : return -1; // Remember : in purificator, this cannot go null in this puzzle ! (otherwise this would be another puzzle)
			}
		}
		p_drawer.drawSpaceContentsCoorsList(p_context, itemsPur, selectionSolverAndPurificator, p_purificator.items);		
	}
}

function getShapeClosure(p_solver) {
	return function(p_x, p_y) {
		if (p_solver.answerArray[p_y][p_x].block) {
			return -1;
		}
		switch( p_solver.answerArray[p_y][p_x].getValue()) {
			case SPACE_SHUGAKU.ROUND : return 0; break;
			case SPACE_SHUGAKU.SQUARE : return 1; break;
			default : return -1; break;
		}
	}
}

selectionOpeningClosure = function(p_solver) {
	return function (p_x, p_y) {
		if (p_solver.isClosedDraw(p_x, p_y)) {
			return 0;
		} else if (p_solver.isOpenDraw(p_x, p_y)) {
			return 1;
		}
		return -1;
	}
}

drawNumberOrXClosure = function(p_solver) {
	return function(p_x, p_y) {
		switch(p_solver.getFixedSpace(p_x, p_y)) {
			case SPACE_CROSS : return "X"; break;
			case null : return null; break;
			default : return p_solver.getFixedSpace(p_x, p_y); break;
		}
	}
}