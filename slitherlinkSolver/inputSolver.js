/**
 When you click on the canvas (for passing meshes, only numbers)
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager) {
	var clicked = p_drawer.getClickNode(event, p_canvas, p_solver.xLength, p_solver.yLength);
	if (clicked != null && p_actionsManager.clickDot != ACTION_NOTHING) {
		clickNodeAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickDot);			
	} else {
		clicked = p_drawer.getClickEdgeD(event, p_canvas, p_solver.xLength, p_solver.yLength);
		if (clicked != null && p_actionsManager.clickEdgeD != ACTION_NOTHING) {
			clickEdgeDAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickEdgeD);
		} else {
			clicked = p_drawer.getClickEdgeR(event, p_canvas, p_solver.xLength, p_solver.yLength);
			if (clicked != null && p_actionsManager.clickEdgeD != ACTION_NOTHING) {
				clickEdgeRAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickEdgeR);
			} else {
				clicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
				if (clicked != null && p_actionsManager.clickSpace != ACTION_NOTHING) {
					clickMeshAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickSpace);
				}
			}
		}
	}
}

function clickEdgeDAction(p_solver, p_x, p_y, p_action) {
	switch (p_action.id) {
		case ACTION_LINK_SPACES.id :
			p_solver.emitHypothesisDown(p_x, p_y, LOOP_STATE.LINKED); 
		break;
		case ACTION_CLOSE_LINKS.id :
			p_solver.emitHypothesisDown(p_x, p_y, LOOP_STATE.CLOSED); 
		break;
	}
}

function clickEdgeRAction(p_solver, p_x, p_y, p_action) {
	switch (p_action.id) {
		case ACTION_LINK_SPACES.id :
			p_solver.emitHypothesisRight(p_x, p_y, LOOP_STATE.LINKED); 
		break;
		case ACTION_CLOSE_LINKS.id :
			p_solver.emitHypothesisRight(p_x, p_y, LOOP_STATE.CLOSED); 
		break;
	}
}


function clickNodeAction(p_solver, p_x, p_y, p_action) {
	switch(p_action.id) {
		case ACTION_INCLUDE_LOOP_SPACE.id :
			p_solver.emitHypothesisNode(p_x, p_y, LOOP_STATE.LINKED); 
		break;
		case ACTION_EXCLUDE_LOOP_SPACE.id :
			p_solver.emitHypothesisNode(p_x, p_y, LOOP_STATE.CLOSED); 
		break;
		case ACTION_PASS_SPACE.id :
			p_solver.emitPassNode(p_x, p_y);
		break;
	}
}

function clickMeshAction(p_solver, p_x, p_y, p_action) {
	switch(p_action.id) {
		case ACTION_PASS_MESH.id :
			p_solver.emitPassMesh(p_x, p_y); 
		break;
		// Maybe there will be other uses later...
	}
}



//--------------------------
// Game action buttons

quickStartAction = function(p_solver){
	p_solver.makeQuickStart();
}

multipassAction = function(p_solver){
	p_solver.makeMultipass();
}

undoAction = function(p_solver,p_textArea){
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
	const loadedItem = stringToNumbersOnlyPuzzle(p_loadedString);
	p_solver.construct(loadedItem.numberArray);
	p_drawer.adaptCanvasDimensions(p_canvas, {isDotted : true, xLength : p_solver.xLength, yLength : p_solver.yLength});
}	