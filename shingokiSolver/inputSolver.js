/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager) {
	var clicked = p_drawer.getClickNode(event, p_canvas, p_solver.xLength, p_solver.yLength);
	if (clicked != null && p_actionsManager.clickDot != ACTION_NOTHING ) {
		clickNodeAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickDot);			
	} else {
		clicked = p_drawer.getClickNodeTolerant(event, p_canvas, p_solver.xLength, p_solver.yLength);
		if (clicked != null && (p_solver.getColourPearl(clicked.x, clicked.y) != null) && p_actionsManager.clickDot != ACTION_NOTHING) {
			clickNodeAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickDot);
		} else {
			clicked = p_drawer.getClickEdgeD(event, p_canvas, p_solver.xLength, p_solver.yLength);
			if (clicked != null && p_actionsManager.clickEdgeD != ACTION_NOTHING) {
				clickEdgeDAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickEdgeD);
			} else {
				clicked = p_drawer.getClickEdgeR(event, p_canvas, p_solver.xLength, p_solver.yLength);
				if (clicked != null && p_actionsManager.clickEdgeD != ACTION_NOTHING) {
					clickEdgeRAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickEdgeR);
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
	const loadedItem = stringToNumbersBWPuzzle(p_loadedString);
	p_solver.construct(loadedItem.numbersBWArray);
	p_drawer.adaptCanvasDimensions(p_canvas, {isDotted : true, xLength : p_solver.xLength, yLength : p_solver.yLength});
}	