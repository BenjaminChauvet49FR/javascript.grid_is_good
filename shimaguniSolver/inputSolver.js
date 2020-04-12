/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_components,p_solver,p_actionId) { //TODO rename this as an action ? But what about loadAction ? //TODO modifier la fonction qui a ce nom dans les autres solveurs.
	var spaceClicked = drawer.getClickSpace(event,p_canvas,p_solver.xyLength,p_solver.xyLength);
    if (spaceClicked != null){
		clickSpaceAction(p_solver,spaceClicked.x,spaceClicked.y,p_actionId);
		p_components.textArea.innerHTML = p_solver.happenedEventsToString(p_components.checkBox.checked);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_actionId){
	switch(p_actionId){
		case ACTION_FILL_SPACE.id:
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.YES); 
		break;
		case ACTION_PUT_NO_FILL.id:
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.NO); 
		break;
		case ACTION_PASS_REGION.id:
			p_solver.passRegion(p_solver.getRegionIndex(p_spaceIndexX,p_spaceIndexY));
		break;
	}
}

//--------------------------
/**
Tries to pass everything : rows, regions, columns.
*/
multiPassAction = function (p_solver,p_textArea){
	p_solver.multiPass();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
	//TODO also manage the rewriting of the events.
}

solveAction = function (p_solver,p_textArea){
	p_solver.generalSolve();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO see above
}

quickStartAction = function(p_solver,p_textArea){
	p_solver.quickStart();
	//p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
TODO doc
*/
loadAction = function(p_canvas,p_drawer,p_solver,p_name){
	var loadedItem = stringToShimaguniPuzzle(localStorage.getItem("grid_is_good_"+p_name));
	p_solver.construct(loadedItem.grid,loadedItem.gridNumber);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
}

undoAction = function(p_solver,p_textArea){
	p_solver.undoToLastHypothesis();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}