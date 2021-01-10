/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_components,p_solver,p_actionsManager) { 
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

undoAction = function(p_solver,p_textArea){
	p_solver.undoToLastHypothesis();
	//p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

discardDeductionsAction = function(p_solver,p_textArea){
	p_solver.discardDeductions();
	//p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
TODO doc
*/
loadAction = function(p_canvas,p_drawer,p_solver,p_name){
	var loadedItem = stringToWallAndNumbersPuzzle(localStorage.getItem("grid_is_good_"+p_name));
	p_solver.construct(loadedItem.grid,loadedItem.gridNumber);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
}

