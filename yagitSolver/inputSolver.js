/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager) {
	var clicked = p_drawer.getClickKnotRD(event, p_canvas, p_solver.xLength, p_solver.yLength);
	if (clicked != null && p_actionsManager.clickCorner.id != ACTION_NOTHING.id) {
		clickCornerAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickCorner);
		return;
	} 
	clicked = p_drawer.getClickWallR(event, p_canvas, p_solver.xLength, p_solver.yLength);
	if (clicked != null && p_actionsManager.clickWallR.id != ACTION_NOTHING.id) {
		clickWallRAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallR);
		return;
	} else {
		clicked = p_drawer.getClickWallD(event, p_canvas, p_solver.xLength, p_solver.yLength);
		if (clicked != null && p_actionsManager.clickWallD.id != ACTION_NOTHING.id) {
			clickWallDAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallD);
			return;
		}
	} 
	clicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
	if (clicked != null) {
		clickSpace(p_solver, clicked.x, clicked.y, p_actionsManager.clickSpace);
		return;
	}
}

/**
You successfully clicked on a region space (coordinates in parameter) or a wall. Then, what ? 
*/

function clickWallDAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action) {
	switch(p_action.id) {
		case ACTION_OPEN_FENCE.id :
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.OPEN); 
		break;
		case ACTION_CLOSE_FENCE.id :
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.CLOSED); 
		break;
	}
}

function clickWallRAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action) {
	switch(p_action.id) {
		case ACTION_OPEN_FENCE.id :
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.OPEN); 
		break;
		case ACTION_CLOSE_FENCE.id :
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.CLOSED); 
		break;
	}
}

function clickSpace(p_solver, p_x, p_y, p_action) {
	switch(p_action.id) {
		case ACTION_PASS_AROUND_SPACE.id :
			p_solver.emitPassAroundSpace(p_x, p_y); 
		break;
	}
}

function clickCornerAction(p_solver, p_cornerRDX, p_cornerRDY, p_action) {
	switch(p_action.id) {
		case ACTION_PASS_AROUND_KNOT.id :
			p_solver.emitPassNodeRD(p_cornerRDX, p_cornerRDY); 
		break;
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver) {
	p_solver.makeQuickStart();
}

undoAction = function(p_solver) {
	p_solver.undo();
}

multipassAction = function (p_solver){
	p_solver.makeMultiPass();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
	var loadedItem = stringToYagitPuzzle(p_loadedString);
	p_solver.construct(loadedItem.symbolArray, loadedItem.knotsArray);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength : p_solver.xLength , yLength : p_solver.yLength});
}