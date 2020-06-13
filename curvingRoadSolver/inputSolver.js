/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_components,p_solver,p_actionsManager) { //TODO rename this as an action ? But what about loadAction ? //TODO modifier la fonction qui a ce nom dans les autres solveurs.
	var spaceClicked = drawer.getClickSpace(event,p_canvas,p_solver.xLength,p_solver.yLength);
    if (spaceClicked != null){
		clickSpaceAction(p_solver,spaceClicked.x,spaceClicked.y,p_actionsManager.clickSpace);
		//p_components.textArea.innerHTML = p_solver.happenedEventsToString(p_components.checkBox.checked); TODO : à gérer !
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action){
	switch(p_action.id){
		case ACTION_OPEN_SPACE.id:
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,SPACE.OPEN); 
		break;
		case ACTION_CLOSE_SPACE.id:
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,SPACE.CLOSED); 
		break;
		/*case ACTION_PASS_REGION.id:
			p_solver.passRegion(p_solver.getRegionIndex(p_spaceIndexX,p_spaceIndexY));
		break;*/
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver,p_textArea){
	p_solver.quickStart();
	//p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

undoAction = function(p_solver,p_textArea){
	p_solver.undoToLastHypothesis();
	//p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

/*multiPassAction = function (p_solver,p_textArea){
	p_solver.multiPass();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
	//TODO also manage the rewriting of the events.
}

solveAction = function (p_solver,p_textArea){
	p_solver.generalSolve();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO see above
}*/

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
TODO doc
*/
loadAction = function(p_canvas,p_drawer,p_solver,p_name){
	var loadedItem = stringToEmptyWallsPuzzle(localStorage.getItem("grid_is_good_"+p_name));
	p_solver.construct(loadedItem.grid,loadedItem.gridSymbol);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
}

