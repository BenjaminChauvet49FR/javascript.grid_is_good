/**
 When you click on the canvas
*/
function clickCanvas(event, p_canvas, p_drawer, p_solver, p_actionsManager) {
	var clicked = drawer.getClickWallR(event, p_canvas, p_solver.xLength, p_solver.yLength);
	if (clicked != null) {
		clickWallRAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallR);
	} else {
		clicked = drawer.getClickWallD(event, p_canvas, p_solver.xLength, p_solver.yLength);
		if (clicked != null) {
			clickWallDAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallD);
		} else {
			clicked = drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
			if (clicked != null) {
				//p_solver.passSpace(clicked.x, clicked.y);
				//clickSpaceAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickSpace); // Since all spaces are open, there is little interest to click on a space. Unless it is a region ?
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

//--------------------------
// Game action buttons

quickStartAction = function(p_solver){
	p_solver.quickStart();
}

undoAction = function(p_solver,p_textArea){
	p_solver.undo();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called by common save and load !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
	const loadedItem = stringToWallAndNumbersPuzzle(p_loadedString);
	p_solver.construct(loadedItem.gridWall);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength:p_solver.xLength,yLength:p_solver.yLength});
}	