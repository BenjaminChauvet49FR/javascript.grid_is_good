

/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager, p_selectionSet) { 
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xyLength, p_solver.xyLength);
    if (spaceClicked != null) {
		clickSpaceAction(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickSpace, p_selectionSet);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action, p_selectionSet) {
	switch(p_action.id) {
		case ACTION_PUT_BULB.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, RAITONANBA.LIGHT); 
		break;
		case ACTION_PUT_NO_FILL.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, RAITONANBA.X); 
		break;		
		case ACTION_PUT_BLOCK.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, RAITONANBA.BLOCK);
		break;
		case ACTION_PASS_ROW_COLUMN.id :
			p_solver.emitPassRowColumn(p_spaceIndexX, p_spaceIndexY);
		break;
	}
}



//--------------------------
// Game action buttons

undoAction = function(p_solver) {
	p_solver.undo();
}

multipassAction = function (p_solver) {
	p_solver.makeMultiPass();
}

quickStartAction = function (p_solver) {
	p_solver.makeQuickStart();
}

solveAction = function (p_solver) {
	p_solver.makeResolution();
}

totalpassAction = function(p_solver) {
	p_solver.makeTotalPass();
}

selectionPassAction = function(p_solver, p_selectionSet) {
	const passing = p_solver.passSelectedSpaces(p_selectionSet.getSelectedSpacesList());
	if (passing != PASS_RESULT.HARMLESS) {
		p_selectionSet.restartSelectedSpaces();
	}
}

unselectAction = function(p_solver, p_selectionSet) {
	p_selectionSet.restartSelectedSpaces();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
	var loadedItem = stringToLimitedSymbolsWalllessPuzzle(p_loadedString, [SYMBOL_ID.X, 0, 1, 2], {isSquare : true});
	p_solver.construct(loadedItem.symbolArray);
	p_drawer.adaptCanvasDimensions(p_canvas, {xyLength : p_solver.xLength});
}