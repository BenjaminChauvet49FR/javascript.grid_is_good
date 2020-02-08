/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_textArea,p_global,p_actionId) { //TODO rename this action ? Yeah, but what about loadAction ?
    var rect = p_canvas.getBoundingClientRect();
    var pixMouseXInGrid = event.clientX - p_drawer.pix.marginGrid.left - rect.left;
    var pixMouseYInGrid = event.clientY - p_drawer.pix.marginGrid.up - rect.top;
	var spaceIndexX = Math.floor(pixMouseXInGrid/p_drawer.pix.sideSpace); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseYInGrid/p_drawer.pix.sideSpace); //same - TODO maybe this should go to the Pix item ?
    if ((spaceIndexX >= 0) && (spaceIndexY >= 0) && (spaceIndexY < global.yLength) && (spaceIndexX < global.xLength)){
		clickSpaceAction(p_global,spaceIndexX,spaceIndexY,p_actionId);
		p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO manage true/false
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_global,p_spaceIndexX,p_spaceIndexY,p_actionId){
	switch(p_actionId){
		case ACTION_FILL_SPACE.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+FILLING.YES);
			p_global.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.YES); 
		break;
		case ACTION_PUT_NO_FILL.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+FILLING.NO);
			p_global.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.NO); 
		break;		
		case ACTION_PASS_REGION.id:
			//p_global.passRegion(p_global.getRegion(p_spaceIndexX,p_spaceIndexY));
		break;
	}
}

//--------------------------
/**
Tries to pass everything : rows, regions, columns.
*/
multiPassAction = function (p_global,p_textArea){
	p_global.multiPass();
	p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO manage true/false
	//TODO also manage the rewriting of the events.
}

solveAction = function (p_global,p_textArea){
	p_global.generalSolve();
	p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO see above
}

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
TODO doc
*/
loadAction = function(p_canvas,p_drawer,p_textArea,p_global,p_name){
	var loadedItem = stringToNorinoriPuzzle(localStorage.getItem("grid_is_good_"+p_name));
	p_global.loadGrid(loadedItem.grid);
	p_global.loadIntelligence(loadedItem.starNumber);
	adaptCanvas(p_canvas,p_drawer,p_global);
	p_textArea.innerHTML = ""; //TODO manage true/false
}

undoAction = function(p_global,p_textArea){
	p_global.massUndo();
	p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO manage true/false
}

function adaptCanvas(p_canvas, p_drawer,p_global){
	p_canvas.width = p_global.xLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.left+p_drawer.pix.marginGrid.right;
	p_canvas.height = p_global.yLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.up+p_drawer.pix.marginGrid.down;
}