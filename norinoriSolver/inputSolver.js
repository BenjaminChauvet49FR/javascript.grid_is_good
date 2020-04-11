/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_components,p_solver,p_actionId) {
	var spaceClicked = drawer.getClickSpace(event,p_canvas,p_solver.xLength,p_solver.yLength);
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
/**
Tries to pass every region.
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
loadAction = function(p_canvas,p_drawer,p_solver,p_name,p_textArea){ //TODO dans le cadre d'une mutualisation des actions (loadAction, saveAction ...), transformer textArea en components... ?
	var loadedItem = tokensToWallArray(localStorage.getItem("grid_is_good_"+p_name).split(' ')); 	
	p_solver.construct(loadedItem);
	adaptCanvasAndGrid(p_canvas,p_drawer,p_solver);
	p_textArea.innerHTML = ""; //TODO manage true/false
}

undoAction = function(p_solver,p_textArea){
	p_solver.massUndo();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

quickStartAction = function(p_solver,p_textArea){
	p_solver.quickStart();
	p_textArea.innerHTML = p_solver.happenedEventsToString(false); //TODO manage true/false
}

function adaptCanvasAndGrid(p_canvas, p_drawer,p_solver){
	//Respects dimension of 800x512
	//TODO Constants can be written somewhere else !
	p_drawer.pix.sideSpace = Math.min(32,Math.min(Math.floor(800/p_solver.xLength),Math.floor(512/p_solver.yLength)));
	p_drawer.pix.borderSpace = Math.max(1,Math.floor(p_drawer.pix.sideSpace/10));
	p_drawer.setMarginGrid(0,0,0,0);
	//TODO should be factorized with other editors !
	p_canvas.width = p_solver.xLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.left+p_drawer.pix.marginGrid.right;
	p_canvas.height = p_solver.yLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.up+p_drawer.pix.marginGrid.down;
}

