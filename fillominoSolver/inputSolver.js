/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager) {
	var clicked = p_drawer.getClickWallR(event, p_canvas, p_solver.xLength, p_solver.yLength);
	if (clicked != null && p_actionsManager.clickWallR.id != ACTION_NOTHING.id) {
		clickWallRAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallR);
	} else {
		clicked = p_drawer.getClickWallD(event, p_canvas, p_solver.xLength, p_solver.yLength);
		if (clicked != null && p_actionsManager.clickWallR.id != ACTION_NOTHING.id) {
			clickWallDAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallD);
		} else {
			clicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
			clickSpaceAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickSpace);
		}
	}
}

/**
You successfully clicked on a region space (coordinates in parameter) or a wall. Then, what ? 
*/

function clickWallDAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action) {
	switch(p_action.id){
		case ACTION_OPEN_FENCE.id:
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.OPEN); 
		break;
		case ACTION_CLOSE_FENCE.id:
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.CLOSED); 
		break;
	}
}

function clickWallRAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action) {
	switch(p_action.id) {
		case ACTION_OPEN_FENCE.id:
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.OPEN); 
		break;
		case ACTION_CLOSE_FENCE.id:
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, FENCE_STATE.CLOSED); 
		break;
	}
}

function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action) {
	if (p_action.id == ACTION_PASS_AROUND_SPACE.id) { // Note : this diamond space can truly be improved (in fact the solving can be)
		var value = prompt("Force de la passe ?", 1);
		value = parseInt(value, 10);
		if ((value != NaN) && (value >= 0)) { // No maximum. Hey !
			p_solver.emitPassSpace(p_spaceIndexX, p_spaceIndexY, value); 
		}
	}
	if (p_action.id == ACTION_ENTER_NUMBER.id) {
		if (!p_solver.isFixed(p_spaceIndexX, p_spaceIndexY)) {
			var value = prompt("Entrer valeur", 1);
			value = parseInt(value, 10);
			if ((value != NaN) && (value > 0)) { // Maximum defined in solver
				p_solver.emitHypothesisNumber(p_spaceIndexX, p_spaceIndexY, value); 
			}
		}
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

multipassAction = function(p_solver) {
	p_solver.makeMultiPass();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
	const loadedItem = stringToNumbersOnlyPuzzle(p_loadedString);
	p_solver.construct(loadedItem.numberArray);
	p_drawer.adaptCanvasDimensions(p_canvas,{xLength : p_solver.xLength , yLength : p_solver.yLength});
}
