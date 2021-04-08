/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionManager) {
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
    if (spaceClicked != null){
		clickSpaceAction(p_solver, spaceClicked.x, spaceClicked.y, p_actionManager.clickSpace);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action){
	switch(p_action.id){
		case ACTION_FILL_SPACE.id:
			autoLogInput("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+FILLING.YES);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.YES); 
		break;
		case ACTION_PUT_NO_FILL.id:
			autoLogInput("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+FILLING.NO);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.NO); 
		break;		
		case ACTION_PASS_REGION.id:
			var indexRegion = p_solver.getRegion(p_spaceIndexX,p_spaceIndexY);
			autoLogInput("PASSING REGION : "+indexRegion+" (Restent : "+p_solver.getOsRemainRegion(indexRegion)+" "+p_solver.getXsRemainRegion(indexRegion)+")");
			p_solver.emitPassRegion(indexRegion);
		break;
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver,p_textArea){
	p_solver.quickStart();
}

undoAction = function(p_solver,p_textArea){
	p_solver.undo();
}

multiPassAction = function (p_solver,p_textArea){
	p_solver.makeMultiPass();
}


solveAction = function (p_solver,p_textArea) {
	//p_solver.generalSolve();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called by common save and load !
*/
loadPuzzle = function(p_canvas,p_drawer,p_solver, p_loadedString){
	var loadedItem = stringToWallsOnlyPuzzle(p_loadedString);
	p_solver.construct(loadedItem.wallArray);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
}