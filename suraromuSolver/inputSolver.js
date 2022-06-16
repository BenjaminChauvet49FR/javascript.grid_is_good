/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager) {
	var clicked = p_drawer.getClickWallR(event,p_canvas,p_solver.xLength,p_solver.yLength);
	if (clicked != null) {
		clickWallRAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallR);
	} else {
		clicked = p_drawer.getClickWallD(event,p_canvas,p_solver.xLength,p_solver.yLength);
		if (clicked != null) {
			clickWallDAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallD);
		} else {
			clicked = p_drawer.getClickSpace(event,p_canvas,p_solver.xLength,p_solver.yLength);
			if (clicked != null) {
				clickSpaceAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickSpace);
			}
		}
	}
}

/**
You successfully clicked on a region space (coordinates in parameter) or a wall. Then, what ? 
*/

function clickWallDAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action) {
	switch (p_action.id) {
		case ACTION_LINK_SPACES.id :
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.LINKED); 
		break;
		case ACTION_CLOSE_LINKS.id :
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.CLOSED); 
		break;
	}
}

function clickWallRAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action) {
	switch (p_action.id) {
		case ACTION_LINK_SPACES.id :
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.LINKED); 
		break;
		case ACTION_CLOSE_LINKS.id :
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.CLOSED); 
		break;
	}
}


function clickSpaceAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action) {
	switch (p_action.id) {
		case ACTION_INCLUDE_LOOP_SPACE.id :
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.LINKED); 
		break;
		case ACTION_EXCLUDE_LOOP_SPACE.id :
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, LOOP_STATE.CLOSED); 
		break;
		case ACTION_PASS_GATE_OR_SPACE.id :
			p_solver.passSpace(p_spaceIndexX, p_spaceIndexY);
		break;
	}
}



//--------------------------
// Game action buttons

quickStartAction = function(p_solver) {
	p_solver.makeQuickStart();
}

multipassAction = function(p_solver) {
	p_solver.makeMultipass();
}

undoAction = function(p_solver,p_textArea) {
	p_solver.undo();
}

solveAction = function (p_solver) {
	p_solver.makeResolution();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
	const loadedItem = stringToSuraromuPuzzle(p_loadedString);
	p_solver.construct(loadedItem.array);
	p_drawer.adaptCanvasDimensions(p_canvas, {xLength : p_solver.xLength, yLength : p_solver.yLength});
}	