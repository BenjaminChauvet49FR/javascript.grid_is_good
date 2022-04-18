/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager, p_selectionSet) { 
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
    if (spaceClicked != null) {
		clickSpaceAction(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickSpace, p_selectionSet);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action, p_selectionSet) {
	switch(p_action.id){
		case ACTION_OPEN_SPACE.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, ADJACENCY.YES); 
		break;
		case ACTION_CLOSE_SPACE.id :
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, ADJACENCY.NO); 
		break;
		case ACTION_PASS_REGION.id :
			p_solver.emitPassRegion(p_solver.getRegionIndex(p_spaceIndexX, p_spaceIndexY));
		break;
		case ACTION_PASS_ROW.id :
			p_solver.emitPassRow(p_spaceIndexY);
		break;
		case ACTION_PASS_COLUMN.id :
			p_solver.emitPassColumn(p_spaceIndexX);
		break;
		case ACTION_SELECTION_RECTANGLE.id : 
			p_selectionSet.triggerSpace(p_spaceIndexX, p_spaceIndexY); 
		break;
		case ACTION_SELECTION_REGION.id : 
			p_selectionSet.selectSpaceList(p_solver.getRegionSpacesFromSpace(p_spaceIndexX, p_spaceIndexY)); 
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

solveAction = function (p_solver) {
	p_solver.makeResolution();
}

formerLimitsExplorationAction = function(p_solver) {
 	p_solver.makeFormerLimitsExploration();
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
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString, p_extraInfos) {
	const loadedItem = stringToRegionsNumericIndicationsPuzzle(p_loadedString);
	p_solver.construct(loadedItem.wallArray, loadedItem.indications, p_extraInfos.isAyeHeya);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength : p_solver.xLength, yLength : p_solver.yLength});
}
