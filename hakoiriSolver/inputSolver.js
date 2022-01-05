/**
 When you click on the canvas
*/
function clickCanvasAction(event,p_canvas, p_drawer, p_solver, p_actionsManager) {
	const clicked = p_drawer.getClickSpace(event,p_canvas,p_solver.xLength,p_solver.yLength);
	if (clicked != null) {
		clickSpaceAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickSpace);
	}	
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action){
	switch(p_action.id) {
		case ACTION_OPEN_SPACE.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, SPACE_HAKOIRI.EMPTY, false); 
		break;
		case ACTION_CLOSE_SPACE.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, SPACE_HAKOIRI.EMPTY, true); 
		break;
		case ACTION_PUT_ROUND.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, SPACE_HAKOIRI.ROUND, true);  
		break;
		case ACTION_PUT_SQUARE.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, SPACE_HAKOIRI.SQUARE, true);  
		break;
		case ACTION_PUT_TRIANGLE.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, SPACE_HAKOIRI.TRIANGLE, true);  
		break;
		case ACTION_PASS_SPACE.id:
			p_solver.emitPassRegion(p_spaceIndexX, p_spaceIndexY);
		break;
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver) {
	p_solver.makeQuickStart();
}

undoAction = function(p_solver) {
	p_solver.undo();
}

multipassAction = function (p_solver) {
	p_solver.makeMultiPass(); // note : "make" in order to differ from "multiPass" which is reserved to general solver
}

formerLimitsExplorationAction = function(p_solver) {
 	p_solver.makeFormerLimitsExploration();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
	const loadedItem = stringToLimitedSymbolsWallsPuzzle(p_loadedString, [SYMBOL_ID.ROUND, SYMBOL_ID.SQUARE, SYMBOL_ID.TRIANGLE]);
	p_solver.construct(loadedItem.wallArray, loadedItem.symbolArray);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength : p_solver.xLength, yLength : p_solver.yLength});
}

