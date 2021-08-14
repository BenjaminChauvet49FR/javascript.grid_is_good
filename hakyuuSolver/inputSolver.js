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
function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action) {
	switch(p_action.id){
		case ACTION_ENTER_NUMBER.id:
			var value = prompt("Entrer valeur", 1);
			value = parseInt(value, 10);
			if ((value != NaN) && (value > 0)) { // TODO ajouter condition maximum
				p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, value); 
			}
		break;
		case ACTION_PASS_REGION.id:
			p_solver.passRegion(p_solver.getRegionIndex(p_spaceIndexX,p_spaceIndexY));
		break;
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver) {
	p_solver.quickStart();
}

undoAction = function(p_solver) {
	p_solver.undo();
}

multipassAction = function (p_solver) {
	p_solver.makeMultiPass();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called by common save and load !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
	const loadedItem = stringToWallsNumbersPuzzle(p_loadedString);
	p_solver.construct(loadedItem.wallArray, loadedItem.numberArray);
	p_drawer.adaptCanvasDimensions(p_canvas, {xLength:p_solver.xLength, yLength:p_solver.yLength});
}

