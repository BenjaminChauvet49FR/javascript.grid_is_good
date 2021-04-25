/**
 When you click on the canvas
*/
function clickCanvas(event, p_canvas, p_drawer, p_solver, p_actionsManager) { //TODO rename this as an action ? But what about loadAction ? //TODO modifier la fonction qui a ce nom dans les autres solveurs.
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xyLength, p_solver.xyLength);
    if (spaceClicked != null){
		clickSpaceAction(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickSpace);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action){
	switch(p_action.id){
		case ACTION_PUT_STAR.id:
			autoLogInput("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+SYMBOL.STAR);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,SYMBOL.STAR); 
		break;
		case ACTION_PUT_NO_STAR.id:
			autoLogInput("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+SYMBOL.NO_STAR);
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, SYMBOL.NO_STAR); 
		break;		
		case ACTION_PASS_ROW.id:
			p_solver.emitPassRow(p_spaceIndexY);
		break;
		case ACTION_PASS_COLUMN.id:
			p_solver.emitPassColumn(p_spaceIndexX);
		break;
		case ACTION_PASS_REGION.id:
			p_solver.emitPassRegion(p_solver.getRegion(p_spaceIndexX, p_spaceIndexY));
		break;
	}
}

//--------------------------
// Game action buttons

undoAction = function(p_solver) {
	p_solver.undo();
}

multiPassAction = function (p_solver) {
	p_solver.makeMultiPass();
}

solveAction = function (p_solver) {
	//p_solver.generalSolve();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called by common save and load !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
    const loadedItem = stringToStarBattlePuzzle(p_loadedString);
	p_solver.construct(loadedItem.wallArray, loadedItem.starNumber);
	p_drawer.adaptCanvasDimensions(p_canvas, {xyLength:p_solver.xyLength});
}	
