/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_components,p_solver,p_actionManager) {
	var spaceClicked = drawer.getClickSpace(event,p_canvas,p_solver.xLength,p_solver.yLength);
    if (spaceClicked != null){
		clickSpaceAction(p_solver,spaceClicked.x,spaceClicked.y,p_actionManager.clickSpace);
		p_components.textArea.innerHTML = p_solver.happenedEventsToString(p_components.checkBox.checked);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action){
	switch(p_action.id){
		case ACTION_FILL_SPACE.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+FILLING.YES);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.YES); 
		break;
		case ACTION_PUT_NO_FILL.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+FILLING.NO);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.NO); 
		break;		
		case ACTION_PASS_REGION.id:
			var indexRegion = p_solver.getRegion(p_spaceIndexX,p_spaceIndexY);
			console.log("PASSING REGION : "+indexRegion+" (Restent : "+p_solver.getOsRemainRegion(indexRegion)+" "+p_solver.getXsRemainRegion(indexRegion)+")");
			p_solver.emitPassRegion(indexRegion);
		break;
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver,p_textArea){
	p_solver.quickStart();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

undoAction = function(p_solver,p_textArea){
	p_solver.undoToLastHypothesis();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

multiPassAction = function (p_solver,p_textArea){
	p_solver.emitMultiPass();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false//TODO also manage the rewriting of the events.
}


solveAction = function (p_solver,p_textArea) {
	//p_solver.generalSolve();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO see above
}

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
*/
loadAction = function (p_canvas, p_drawer, p_solver, p_name, p_textArea) {
    var loadedItem = tokensToWallArray(localStorage.getItem("grid_is_good_" + p_name).split(' '));
	p_solver.construct(loadedItem);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
	p_textArea.innerHTML = ""; //TODO manage true/false
}