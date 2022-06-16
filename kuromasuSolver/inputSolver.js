/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager) { 
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
    if (spaceClicked != null) {
		clickSpaceAction(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickSpace);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action){
	switch(p_action.id) {
		case ACTION_OPEN_SPACE.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, ADJACENCY.YES); 
		break;
		case ACTION_CLOSE_SPACE.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, ADJACENCY.NO); 
		break;
		case ACTION_PASS_SPACE.id :
			p_solver.emitPassSpace(p_spaceIndexX, p_spaceIndexY);
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
	p_solver.makeMultiPass();
}

formerLimitsExplorationAction = function(p_solver) {
 	p_solver.makeFormerLimitsExploration();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString, p_properties) {
	const loadedItem = stringToNumbersSymbolsPuzzle(p_loadedString, [SYMBOL_ID.X]);
	p_solver.construct(loadedItem.numbersSymbolsArray, p_properties.isCorral);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength : p_solver.xLength, yLength : p_solver.yLength});
}

