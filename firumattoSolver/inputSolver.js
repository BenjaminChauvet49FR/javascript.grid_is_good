/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_purificator, p_actionsManagersSet) {
	const actionsManager = p_actionsManagersSet.getActiveActionsManager();
	var clicked = p_drawer.getClickWallR(event, p_canvas, p_solver.xLength, p_solver.yLength);
	if (clicked != null && actionsManager.clickWallR.id != ACTION_NOTHING.id) {
		clickWallRAction(p_solver, clicked.x, clicked.y, actionsManager.clickWallR);
	} else {
		clicked = p_drawer.getClickWallD(event, p_canvas, p_solver.xLength, p_solver.yLength);
		if (clicked != null && actionsManager.clickWallR.id != ACTION_NOTHING.id) {
			clickWallDAction(p_solver, clicked.x, clicked.y, actionsManager.clickWallD);
		} else {
			clicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
			clickSpaceAction(p_solver, p_purificator, clicked.x, clicked.y, actionsManager.clickSpace);
		}
	}
}

/**
You successfully clicked on a region space (coordinates in parameter) or a wall. Then, what ? 
*/

function clickWallDAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action) {
	switch(p_action.id) {
		case ACTION_OPEN_FENCE.id :
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.OPEN); 
		break;
		case ACTION_CLOSE_FENCE.id :
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.CLOSED); 
		break;
	}
}

function clickWallRAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action) {
	switch(p_action.id){
		case ACTION_OPEN_FENCE.id :
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.OPEN); 
		break;
		case ACTION_CLOSE_FENCE.id :
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.CLOSED); 
		break;
	}
}

function clickSpaceAction(p_solver, p_purificator, p_spaceIndexX, p_spaceIndexY, p_action) {
	switch(p_action.id) {
		case ACTION_PASS_AROUND_SPACE.id :
			p_solver.emitPassSpace(p_spaceIndexX, p_spaceIndexY);
		break;
		case ACTION_PURIFY_SPACE.id : 
			p_purificator.purify(p_spaceIndexX, p_spaceIndexY);
		break;
		case ACTION_UNPURIFY_SPACE.id : 
			p_purificator.unpurify(p_spaceIndexX, p_spaceIndexY);
		break;
		case ACTION_NEUTRALIZE_SPACE.id :
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

multipassAction = function(p_solver) {
	p_solver.makeMultiPass();
}

solveAction = function(p_solver) {
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

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzleCOMPLETE = function(p_canvas, p_drawer, p_items, p_loadedString) {
	const loadedItem = stringToNumbersSymbolsPuzzle(p_loadedString, ["?"]);  
	p_items.purificator.construct(loadedItem.numbersSymbolsArray);
	p_items.solver.construct(loadedItem.numbersSymbolsArray);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength : p_items.solver.xLength , yLength : p_items.solver.yLength});
}

/** String to save the purified data.  
Also called from outside, and the same method as in editor save.*/
purifiedPuzzleToString = function(p_purificator) {
	return puzzleNumbersSymbolsToString(p_purificator.recreateNewData(), ["?"]);
}