/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager) { 
	var spaceClicked = drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
    if (spaceClicked != null) {
		clickSpace(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickSpace);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpace(p_solver, p_spaceIndexX, p_spaceIndexY, p_action){
	switch(p_action.id){
		case ACTION_OPEN_SPACE.id:
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,CHOCONA.YES); 
		break;
		case ACTION_CLOSE_SPACE.id:
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,CHOCONA.NO); 
		break;
		case ACTION_PASS_REGION.id:
			p_solver.passRegion(p_solver.getRegionIndex(p_spaceIndexX,p_spaceIndexY));
		break;
		case ACTION_PASS_REGION_AND_ADJACENCY.id:
			p_solver.passRegionAndAdjacents(p_solver.getRegionIndex(p_spaceIndexX,p_spaceIndexY));
		break;
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver,p_textArea){
	p_solver.quickStart();
}

undoAction = function(p_solver,p_textArea){
	p_solver.undoToLastHypothesis();
}

multiPassAction = function(p_solver) {
	p_solver.multiPass();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called by common save and load !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
	const loadedItem = stringToWallAndNumbersPuzzle(p_loadedString);
	p_solver.construct(loadedItem.grid,loadedItem.gridNumber);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
}

