/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_textArea,p_solver,p_actionId) { //TODO rename this action ? Yeah, but what about loadAction ?
    var rect = p_canvas.getBoundingClientRect();
    var pixMouseXInGrid = event.clientX - p_drawer.pix.marginGrid.left - rect.left;
    var pixMouseYInGrid = event.clientY - p_drawer.pix.marginGrid.up - rect.top;
	var spaceIndexX = Math.floor(pixMouseXInGrid/p_drawer.pix.sideSpace); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseYInGrid/p_drawer.pix.sideSpace); //same - TODO maybe this should go to the Pix item ?
    if ((spaceIndexX >= 0) && (spaceIndexY >= 0) && (spaceIndexY < p_solver.xyLength) && (spaceIndexX < p_solver.xyLength)){
		clickSpaceAction(p_solver,spaceIndexX,spaceIndexY,p_actionId);
		p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_actionId){
	switch(p_actionId){
		case ACTION_PUT_STAR.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+STAR);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,STAR); 
		break;
		case ACTION_PUT_NO_STAR.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+NO_STAR);
			p_solver.emitHypothesis(p_spaceIndexX,p_spaceIndexY,NO_STAR); 
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
multiPassAction = function (p_solver,p_textArea){
	p_solver.multiPass();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
	//TODO also manage the rewriting of the events.
}

solveAction = function (p_solver,p_textArea){
	p_solver.generalSolve();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO see above
}

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
TODO doc
*/
loadAction = function(p_canvas,p_drawer,p_textArea,p_solver,p_name,p_starField){
	var loadedItem = stringToStarBattlePuzzle(localStorage.getItem("grid_is_good_"+p_name));
	p_solver.construct(loadedItem.grid,loadedItem.starNumber); //TODO A SUIVRE APRES
	adaptCanvas(p_canvas,p_drawer,p_solver);
	p_starField.innerHTML = loadedItem.starNumber;
	p_textArea.innerHTML = ""; //TODO manage true/false
}

undoAction = function(p_solver,p_textArea){
	p_solver.massUndo();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

function adaptCanvas(p_canvas, p_drawer,p_solver){
	p_canvas.width = p_solver.xyLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.left+p_drawer.pix.marginGrid.right;
	p_canvas.height = p_solver.xyLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.up+p_drawer.pix.marginGrid.down;
}