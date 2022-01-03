/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_purificator, p_actionsManagersSet) { 
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
    if (spaceClicked != null) {
		clickSpaceAction(p_solver, p_purificator, spaceClicked.x, spaceClicked.y, p_actionsManagersSet.getActiveActionsManager().clickSpace);
	}
}

/**
You successfully clicked on a space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver, p_purificator, p_spaceIndexX, p_spaceIndexY, p_action) {
	switch(p_action.id) {
		case ACTION_OPEN_SPACE.id:
			if (p_solver.isAutomaticMode()) {
				p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, ADJACENCY.YES); 
			} else {
				p_solver.emitMove(p_spaceIndexX, p_spaceIndexY, ADJACENCY.YES);
			}				
		break;
		case ACTION_CLOSE_SPACE.id:
			if (p_solver.isAutomaticMode()) {
				p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, ADJACENCY.NO); 
			} else {
				p_solver.emitMove(p_spaceIndexX, p_spaceIndexY, ADJACENCY.NO);
			}	 
		break;
		case ACTION_PASS_STRIP.id:
			p_solver.passStripFromSpace(p_spaceIndexX, p_spaceIndexY);				
		break;
		case ACTION_PURIFY_SPACE.id : 
			p_purificator.purify(p_spaceIndexX, p_spaceIndexY);
		break;
		case ACTION_UNPURIFY_SPACE.id : 
			p_purificator.unpurify(p_spaceIndexX, p_spaceIndexY);
		break;
		case ACTION_NEUTRALIZE_SPACE.id:
			p_solver.emitMove(p_spaceIndexX, p_spaceIndexY, ADJACENCY.UNDECIDED);
		break;
	}
}

//--------------------------
// Interaction action buttons

startAction = function(p_purificator, p_solver) { 
	p_purificator.desactivate();
	p_solver.construct(p_purificator.recreateNewData());
	p_solver.setAutomaticMode(true);
}

startActionManual = function(p_purificator, p_solver) { 
	p_purificator.desactivate();
	p_solver.construct(p_purificator.recreateNewData());
	p_solver.setAutomaticMode(false);
	p_solver.constructManual();
}

toPurificationModeAction = function(p_purificator, p_solver) {
	p_purificator.activate();
	p_solver.construct(p_purificator.recreateOriginalData());
}

//

quickStartAction = function(p_solver) {
	p_solver.makeQuickStart();
}

undoAction = function(p_solver) {
	p_solver.undo();
}

multipassAction = function (p_solver) {
	p_solver.makeMultiPass();
}

solveAction = function (p_solver) {
	p_solver.makeResolution();
}

// 

undoPurificationAction = function(p_purificator) {
	p_purificator.undo();
}

findMinimalPuzzles = function(p_purificator, p_solver) {
	p_purificator.findMinimalPuzzlesSymbolArray(p_solver, 
		function(p_symbolArrayFromPur, p_extradata) {p_solver.construct(p_symbolArrayFromPur)}, 
		p_purificator.recreateNewData(), {});
}

//--------------------------
// Puzzle management buttons

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzleCOMPLETE = function(p_canvas, p_drawer, p_items, p_loadedString) {
	const loadedItem = stringToArrowNumberCombinationsPuzzle(p_loadedString);
	p_items.purificator.construct(loadedItem.combinationsArray);
	p_items.solver.construct(loadedItem.combinationsArray);
	p_drawer.adaptCanvasDimensions(p_canvas, {xLength : p_items.solver.xLength, yLength : p_items.solver.yLength});
}

/** String to save the purified data.  
Also called from outside, and the same method as in editor save.*/
purifiedPuzzleToString = function(p_purificator) {
	return arrowNumberCombinationsPuzzleToString(p_purificator.recreateNewData());
}