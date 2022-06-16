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
		case ACTION_ENTER_NUMBER.id :
			if (!p_solver.isBlocked(p_spaceIndexX, p_spaceIndexY)) {
				var value = prompt("Entrer valeur", 1);
				value = parseInt(value, 10);
				if ((value != NaN) && (value > 0) && (value <= 4)) {
					p_solver.emitHypothesisNumber(p_spaceIndexX, p_spaceIndexY, value); 
				}
			}
		break;
		case ACTION_OPEN_SPACE.id : 
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, true);
		break;
		case ACTION_CLOSE_SPACE.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, false);
		break;
		case ACTION_PASS_SPACE.id : 
			p_solver.emitPassSpace(p_spaceIndexX, p_spaceIndexY);
		break;
		case ACTION_PURIFY_SPACE.id : 
			p_purificator.purify(p_spaceIndexX, p_spaceIndexY);
		break;
		case ACTION_UNPURIFY_SPACE.id : 
			p_purificator.unpurify(p_spaceIndexX, p_spaceIndexY);
		break;
	}
}

//--------------------------
// Game action buttons

startAction = function(p_purificator, p_solver) { 
	p_purificator.desactivate();
	p_solver.construct(p_purificator.recreateNewData());
	p_solver.setAutomaticMode(true);
}

toPurificationModeAction = function(p_purificator, p_solver) {
	p_purificator.activate();
	p_solver.construct(p_purificator.recreateOriginalData());
}

//

quickStartAction = function(p_solver) {
	p_solver.makeQuickStart();
}

multiPassAction = function(p_solver) {
	p_solver.makeMultiPass();
}

solveAction = function(p_solver) {
	p_solver.makeResolution();
}

undoAction = function(p_solver) {
	p_solver.undo();
}

//

formerLimitsExplorationAction = function(p_solver) {
 	p_solver.makeFormerLimitsExploration();
}

// 

undoPurificationAction = function(p_purificator) {
	p_purificator.undo();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzleCOMPLETE = function(p_canvas, p_drawer, p_items, p_loadedString) {
	var loadedItem = stringToNumbersSymbolsPuzzle(p_loadedString, [SYMBOL_ID.X]);
	p_items.purificator.construct(loadedItem.numbersSymbolsArray);
	p_items.solver.construct(loadedItem.numbersSymbolsArray);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength : p_items.solver.xLength, yLength : p_items.solver.yLength});
}

/** String to save the purified data.  
Also called from outside, and the same method as in editor save.*/
purifiedPuzzleToString = function(p_purificator) {
	return puzzleNumbersSymbolsToString(p_purificator.recreateNewData(), [SYMBOL_ID.X]);
}