/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colourSet, p_solver) {	
	p_drawer.drawFenceArray(p_context, p_solver.xLength, p_solver.yLength, getFenceRightDominoDrawingClosure(p_solver), getFenceDownDominoDrawingClosure(p_solver)); 

	function selectionOpening(p_x, p_y) {
		if (p_solver.isClosedDraw(p_x, p_y)) {
			return 0;
		} else if (p_solver.isOpenDraw(p_x, p_y)) {
			return 1;
		}
		return -1;
	}
	
	// C/P on koburin's drawing.
	var fixedSpace;
	p_context.fillStyle = p_colourSet.numberWrite;
	setupFont(p_context, p_drawer.getPixInnerSide(), "Arial");
	alignFontCenter(p_context);
	for(var iy=0; iy < p_solver.yLength ; iy++) {
		for(var ix=0; ix < p_solver.xLength ; ix++) {
			fixedSpace = p_solver.getFixedSpace(ix, iy);
			if (fixedSpace == SPACE_CROSS) {
				p_drawer.drawCrossX(p_context, ix, iy, new DrawableX(p_colourSet.numberWrite));
			} else if (fixedSpace != null) {
				p_context.fillText(fixedSpace, p_drawer.getPixCenterX(ix), p_drawer.getPixCenterY(iy));
			}
		}
	}
	
	const colours = [DrawableColor(p_colourSet.closedSquare), DrawableColor(p_colourSet.openSquare)];
	p_drawer.drawSpaceContents(p_context, colours, selectionOpening, p_solver.xLength, p_solver.yLength);
	shapes = [DrawableCircle(p_colourSet.shape, "#ffffff"), DrawableSquare(p_colourSet.shape, "#ffffff")];
	p_drawer.drawSpaceContents(p_context, shapes, getShapeClosure(p_solver), p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selectionOpening, 1, p_solver.xLength, p_solver.yLength);
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