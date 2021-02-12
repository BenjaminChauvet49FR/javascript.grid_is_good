/**
 When you click on the canvas
*/
function clickCanvas(event, p_canvas, p_drawer, p_solver, p_actionsManager) { 
	var spaceClicked = drawer.getClickSpace(event,p_canvas,p_solver.xLength,p_solver.yLength);
    if (spaceClicked != null){
		clickSpaceAction(p_solver,spaceClicked.x,spaceClicked.y,p_actionsManager.clickSpace);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action){
	switch(p_action.id) {
		case ACTION_OPEN_SPACE.id:
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,SPACE.OPEN); 
		break;
		case ACTION_CLOSE_SPACE.id:
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,SPACE.CLOSED); 
		break;
		case ACTION_OPEN_SPACE_FAKE.id:
			p_solver.emitArtificialDeduction(p_spaceIndexX,p_spaceIndexY,SPACE.OPEN); 
		break;
		case ACTION_CLOSE_SPACE_FAKE.id:
			p_solver.emitArtificialDeduction(p_spaceIndexX,p_spaceIndexY,SPACE.CLOSED); 
		break;
	}
}

//--------------------------
// Game action buttons

undoAction = function(p_solver) {
	p_solver.undo();
}

discardDeductionsAction = function(p_solver) {
	p_solver.discardDeductions();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called by common save and load !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
    const loadedItem = stringToWallAndNumbersPuzzle(p_loadedString);
	p_solver.construct(loadedItem.wallArray,loadedItem.numberArray);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
}
