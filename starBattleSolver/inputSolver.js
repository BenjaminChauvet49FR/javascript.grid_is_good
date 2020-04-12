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
//p_textArea

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_actionId){
	switch(p_actionId){
		case ACTION_PUT_STAR.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+SYMBOL.STAR);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,SYMBOL.STAR); 
		break;
		case ACTION_PUT_NO_STAR.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+SYMBOL.NO_STAR);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,SYMBOL.NO_STAR); 
		break;		
		case ACTION_PASS_ROW.id:
			p_solver.passRow(p_spaceIndexY);
		break;
		case ACTION_PASS_COLUMN.id:
			p_solver.passColumn(p_spaceIndexX);
		break;
		case ACTION_PASS_REGION.id:
			p_solver.passRegion(p_solver.getRegion(p_spaceIndexX,p_spaceIndexY));
		break;
	}
}

//--------------------------
/**
Tries to pass everything : rows, regions, columns.
*/
multiPassAction = function (p_solver,p_components){
	p_solver.multiPass();
	p_components.textArea.innerHTML = p_solver.happenedEventsToString(p_components.checkBox.checked)
}

solveAction = function (p_solver,p_components){
	p_solver.generalSolve();
	p_components.textArea.innerHTML = p_solver.happenedEventsToString(p_components.checkBox.checked)
}

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
TODO doc
*/
loadAction = function(p_canvas,p_drawer,p_solver,p_name,p_components){  //TODO adapt loadAction to starSpan in other solvers
	var loadedItem = stringToStarBattlePuzzle(localStorage.getItem("grid_is_good_"+p_name));
	p_solver.construct(loadedItem.grid,loadedItem.starNumber);
	p_drawer.adaptCanvasDimensions(p_canvas,{xyLength:p_solver.xyLength});
	p_components.starSpan.innerHTML = loadedItem.starNumber;
	p_components.textArea.innerHTML = ""; //TODO manage true/false
}

undoAction = function(p_solver,p_components){
	p_solver.undoToLastHypothesis();
	p_components.textArea.innerHTML = p_solver.happenedEventsToString(p_components.checkBox.checked)
}