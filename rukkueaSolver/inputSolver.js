/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager, p_selectionSet) { 
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
    if (spaceClicked != null) {
		clickSpace(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickSpace, p_selectionSet);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpace(p_solver, p_spaceIndexX, p_spaceIndexY, p_action, p_selectionSet) {
	switch(p_action.id){
		case ACTION_FILL_SPACE.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, FILLING.YES); 
		break;
		case ACTION_PUT_NO_FILL.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, FILLING.NO); 
		break;
		case ACTION_PASS_ROW_COLUMN.id :
			p_solver.emitPassRowColumn(p_spaceIndexX, p_spaceIndexY);
		break;
		case ACTION_SELECTION_RECTANGLE.id : 
			p_selectionSet.triggerSpace(p_spaceIndexX, p_spaceIndexY); 
		break;
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver,p_textArea){
	p_solver.makeQuickStart();
}

undoAction = function(p_solver,p_textArea){
	p_solver.undo();
}

multipassAction = function(p_solver) {
	p_solver.makeMultiPass();
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
	const loadedItem = stringToNumbersOnlyPuzzle(p_loadedString);
	p_solver.construct(loadedItem.numberArray);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength : p_solver.xLength , yLength : p_solver.yLength});
}

