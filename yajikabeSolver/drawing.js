/**
Draws what's inside spaces 
*/
function drawInsideSpaces(p_context, p_drawer, p_coloursSet, p_solver, p_purificator) {
	var itemsSolv = [DrawableColour(p_coloursSet.openSpace), DrawableX(p_coloursSet.closedSpace)];
	function selectionSolver(x, y) {
		if (!p_solver.isBanned(x, y)) {
			if (p_solver.getAnswer(x, y) == ADJACENCY.YES) {
				return 0;
			} else if (p_solver.getAnswer(x, y) == ADJACENCY.NO) {
				return 1;
			}
		}
		return -1;
	}
	p_drawer.drawSpaceContents2Dimensions(p_context, itemsSolv, selectionSolver, p_solver.xLength, p_solver.yLength);
	p_drawer.drawPolyomino4x5TiledMap(p_context,document.getElementById("img_map"), 16, selectionSolver, 0, p_solver.xLength, p_solver.yLength);
	
	if (p_purificator.isActive) {
		// Purify mode
		var itemsPur = [DrawableColour(p_coloursSet.purification), DrawableX(p_coloursSet.purification)]; 
		function selectionSolverAndPurificator(x, y) {
			switch(p_purificator.getPurificatorSpaceIfDifferent(x, y)) {
				case null : return 0; // Remember : 'null' is when the new value is null !
				case SYMBOL_ID.X : return 1;
				default : return -1; // The value EQUAL_TO_SOLVER.
			}
		}
		p_drawer.drawSpaceContentsCoorsList(p_context, itemsPur, selectionSolverAndPurificator, p_purificator.items);		
	}
}

