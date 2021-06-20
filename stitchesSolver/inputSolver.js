const marginInfo = new MarginInfo(1, 1);

/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas, p_drawer, p_solver, p_actionsManager) { //TODO rename this as an action ? But what about loadAction ? //TODO modifier la fonction qui a ce nom dans les autres solveurs.
	var spaceClicked = p_drawer.getClickWallR(event, p_canvas, p_solver.xLength, p_solver.yLength);
    if (spaceClicked != null) {
		clickWallRAction(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickWallR);
	} else {
		clicked = p_drawer.getClickWallD(event, p_canvas, p_solver.xLength, p_solver.yLength);
		if (clicked != null) {
			clickWallDAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickWallD);
		} else {
			clicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
			if (clicked != null) {
				clickSpaceAction(p_solver, clicked.x, clicked.y, p_actionsManager.clickSpace);
			}
		}
	}
	var indexMargin = p_drawer.getClickMargin(event, p_canvas, p_solver.xLength, p_solver.yLength, marginInfo.getLeftLength(), marginInfo.getUpLength());
	if (indexMargin != null) {
		clickMarginAction(p_solver, indexMargin.edge, indexMargin.index);
	}
}

function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action) {
	switch(p_action.id) {
		case ACTION_PUT_STITCH.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, SPACE_STATE.BUTTON);
		break;
		case ACTION_PUT_NO_FILL.id:
			p_solver.emitHypothesisSpace(p_spaceIndexX, p_spaceIndexY, SPACE_STATE.EMPTY);
		break;
		case ACTION_PASS_ROW.id:
			p_solver.emitPassRow(p_spaceIndexY);
		break;
		case ACTION_PASS_COLUMN.id:
			p_solver.emitPassColumn(p_spaceIndexX);
		break;
	}
}

function clickWallDAction(p_solver,p_spaceIndexX,p_spaceIndexY,p_action) {
	switch(p_action.id) {
		case ACTION_BIND_STITCHES.id:
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, LINK_STATE.LINKED); 
		break;
		case ACTION_NOT_BIND_STITCHES.id:
			p_solver.emitHypothesisDown(p_spaceIndexX, p_spaceIndexY, LINK_STATE.CLOSED); 
		break;
		case ACTION_PASS_BORDER.id: 
			p_solver.emitPassBorderDown(p_spaceIndexX, p_spaceIndexY);
		break;
	}
}

function clickWallRAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action) {
	switch(p_action.id) {
		case ACTION_BIND_STITCHES.id:
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, LINK_STATE.LINKED); 
		break;
		case ACTION_NOT_BIND_STITCHES.id:
			p_solver.emitHypothesisRight(p_spaceIndexX, p_spaceIndexY, LINK_STATE.CLOSED); 
		break;
		case ACTION_PASS_BORDER.id: 
			p_solver.emitPassBorderRight(p_spaceIndexX, p_spaceIndexY);
		break;
	}
}

function clickMarginAction(p_solver, p_edge, p_index) {
	switch(p_edge) {
		case EDGES.LEFT : p_solver.emitPassRow(p_index);
		case EDGES.UP : p_solver.emitPassColumn(p_index);
	}
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver) {
	p_solver.quickStart();
}

undoAction = function(p_solver) {
	p_solver.undo();
}

multiPassAction = function (p_solver) {
	p_solver.makeMultiPass(); // note : "make" in order to differ from "multiPass" which is reserved to general solver
}

/*solveAction = function (p_solver,p_textArea){
	p_solver.generalSolve();
}*/

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzle = function(p_canvas,p_drawer,p_solver, p_loadedString){
	var loadedItem = stringToRegionsMarginOneLeftUpNumbersPuzzle(p_loadedString);
	p_solver.construct(loadedItem.wallArray, loadedItem.marginLeft, loadedItem.marginUp);
	p_drawer.adaptCanvasDimensions(p_canvas, {xLength : p_solver.xLength, yLength : p_solver.yLength, margin : marginInfo});
}