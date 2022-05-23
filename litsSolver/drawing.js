/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_colour, p_solver, p_colourblindFriendly) {
	const items = [DrawableColour(p_colour.openSpace),
				DrawableX(p_colour.closedSpace),
				DrawableColour(p_colour.LSpace), 
				DrawableColour(p_colour.ISpace), 
				DrawableColour(p_colour.TSpace), 
				DrawableColour(p_colour.SSpace),
				DrawableColour(p_colour.LSpaceLight),
				DrawableColour(p_colour.ISpaceLight),
				DrawableColour(p_colour.TSpaceLight),
				DrawableColour(p_colour.SSpaceLight)];
	const letters = [null, null, null, null, null, null, "L", "I", "T", "S"];
	
	function selectionShape(x,y) {
		if(p_solver.getAnswer(x,y) != ADJACENCY.NO) {
			const opening = (p_solver.getAnswer(x,y) == ADJACENCY.YES);
			switch (p_solver.getShape(x, y)) {
				case LITS.L : return opening ? 2 : 6;
				case LITS.I : return opening ? 3 : 7;
				case LITS.T : return opening ? 4 : 8;
				case LITS.S : return opening ? 5 : 9;
				default : return opening ? 0 : -1;
			}
		}
		else {
			return (p_solver.isBanned(x, y)) ? -1 : 1; // Don't confuse selectionShape and selectionOpening ! 
		}
	}
	function selectionOpening(x,y) {
		if (p_solver.getAnswer(x,y) == ADJACENCY.YES) {
			return 0;
		} else if (p_solver.getAnswer(x, y) == ADJACENCY.NO) {
			return 1;
		}
		return -1;
	}
	
	p_drawer.drawSpaceContents2Dimensions(p_context, items, selectionShape, p_solver.xLength, p_solver.yLength);
	if (p_colourblindFriendly) {		
		p_drawer.drawTextUpperRightCorner(p_context, letters, p_colour.colourblindWrite, selectionShape, p_solver.xLength, p_solver.yLength, FONTS.ARIAL);
	}
	p_drawer.drawPolyomino4x5TiledMap(p_context, document.getElementById("img_map"), 16, selectionOpening, 0, p_solver.xLength, p_solver.yLength);
}

