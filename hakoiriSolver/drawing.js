/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver) {	

	// The first method calls the second ! Overall, 1 = open fixed space. 0 = open space OR other open space. -1 = not an open space.
	function selectionOpeningBGColour(p_x, p_y) {
	    if (p_solver.getFixedShape(p_x, p_y) != null) { 
			return 1;
		}
		return selectionOpening(p_x, p_y);
	}
	
	function selectionOpening(p_x, p_y) {
		if (p_solver.isBanned(p_x, p_y)) {
			return -1;
		}
		if (p_solver.isOpenNotBannedDraw(p_x, p_y)) {
			return 0;
		}
		return -1;
	}
	
	const colours = [DrawableColour(p_coloursSet.openFoundSpace), DrawableColour(p_coloursSet.openFixedSpace)];
	p_drawer.drawSpaceContents2Dimensions(p_context, colours, selectionOpeningBGColour, p_solver.xLength, p_solver.yLength);
	shapes = [
	DrawableCircle(p_coloursSet.edge, p_coloursSet.circle), 
	DrawableSquare(p_coloursSet.edge, p_coloursSet.square), 
	DrawableTriangle(p_coloursSet.edge, p_coloursSet.triangle),
	DrawableCircle(null, p_coloursSet.circle), 
	DrawableSquare(null, p_coloursSet.square), 
	DrawableTriangle(null, p_coloursSet.triangle), 
	DrawableX(p_coloursSet.edge)
	];
	p_drawer.drawSpaceContents2Dimensions(p_context, shapes, getShapeClosure(p_solver), p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selectionOpening, 0, p_solver.xLength, p_solver.yLength);
}

function getShapeClosure(p_solver) {
	return function(p_x, p_y) {
		if (p_solver.isBanned(p_x, p_y)) {
			return -1;
		}
		switch( p_solver.getFixedShape(p_x, p_y)) {
			case SPACE_HAKOIRI.ROUND : return 0; break;
			case SPACE_HAKOIRI.SQUARE : return 1; break;
			case SPACE_HAKOIRI.TRIANGLE : return 2; break;
		}
		switch( p_solver.getVariableShape(p_x, p_y)) {
			case SPACE_HAKOIRI.ROUND : return 3; break;
			case SPACE_HAKOIRI.SQUARE : return 4; break;
			case SPACE_HAKOIRI.TRIANGLE : return 5; break;
			case SPACE_HAKOIRI.EMPTY : return 6; break;
			default : return -1; break;
		}
	}
}
