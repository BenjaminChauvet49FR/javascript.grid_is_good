/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_components,p_solver,p_actionsManager) {
	var clicked = drawer.getClickWallR(event,p_canvas,p_solver.xLength,p_solver.yLength);
	if (clicked != null){
		clickWallRAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallR);
	} else {
		clicked = drawer.getClickWallD(event,p_canvas,p_solver.xLength,p_solver.yLength);
		if (clicked != null){
			clickWallDAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallD);
		} else {
			clicked = drawer.getClickSpace(event,p_canvas,p_solver.xLength,p_solver.yLength);
			if (clicked != null){
				clickSpaceAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickSpace);
			}
		}
	}
}

/**
You successfully clicked on a region space (coordinates in parameter) or a wall. Then, what ? 
*/

function clickWallDAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action){
	switch(p_action.id){
		case ACTION_LINK_SPACES.id:
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.LINKED); 
		break;
		case ACTION_CLOSE_LINKS.id:
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.CLOSED); 
		break;
	}
}

function clickWallRAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action){
	switch(p_action.id){
		case ACTION_LINK_SPACES.id:
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.LINKED); 
		break;
		case ACTION_CLOSE_LINKS.id:
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.CLOSED); 
		break;
	}
}


function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action){
	switch(p_action.id){
		case ACTION_OPEN_SPACE.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.LINKED); 
		break;
		case ACTION_CLOSE_SPACE.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.CLOSED); 
		break;
	}
}



//--------------------------
// Game action buttons

undoAction = function(p_solver,p_textArea){
	p_solver.undoToLastHypothesis();
}

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
TODO doc
*/
loadAction = function(p_canvas,p_drawer,p_solver,p_name) {
	var loadedItem = stringToEmptyWallsPuzzle(localStorage.getItem("grid_is_good_"+p_name));
	p_solver.construct(loadedItem.gridSymbol);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
}

