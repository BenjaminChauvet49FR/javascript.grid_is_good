const STAR_BATTLE_INPUT = {
	NOT_SELECTED : 0,
	CORNER_SELECTED : 1,
	SELECTED : 2
}

/**
 When you click on the canvas
*/
function clickCanvas(event, p_canvas, p_drawer, p_solver, p_actionsManager, p_selectionSet) { 
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xyLength, p_solver.xyLength);
    if (spaceClicked != null) {
		clickSpaceAction(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickSpace, p_selectionSet);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action, p_selectionSet) {
	switch(p_action.id) {
		case ACTION_PUT_STAR.id:
			autoLogInput("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+STAR.YES);
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, STAR.YES); 
		break;
		case ACTION_PUT_NO_STAR.id :
			autoLogInput("HYPOTHESIS : " + p_spaceIndexX + " " + p_spaceIndexY + " " + STAR.NO);
			p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, STAR.NO); 
		break;		
		case ACTION_PASS_ROW.id :
			p_solver.emitPassRow(p_spaceIndexY);
		break;
		case ACTION_PASS_COLUMN.id :
			p_solver.emitPassColumn(p_spaceIndexX);
		break;
		case ACTION_PASS_REGION.id :
			p_solver.emitPassRegion(p_solver.getRegion(p_spaceIndexX, p_spaceIndexY));
		break;
		case ACTION_SELECTION.id : 
			applySelection(p_spaceIndexX, p_spaceIndexY, p_selectionSet);
		break;
	}
}

// Custom pass space selection
applySelection = function(p_x, p_y, p_selectionSet) {
	if (p_selectionSet.selectedCornerSpace == null) {		
		p_selectionSet.previousStateSelectedCornerSpace = p_selectionSet.array[p_y][p_x];
		p_selectionSet.array[p_y][p_x] = STAR_BATTLE_INPUT.CORNER_SELECTED;
		p_selectionSet.selectedCornerSpace = {x : p_x, y : p_y}
		return;
	} else {
		var x = p_selectionSet.selectedCornerSpace.x;
		var y = p_selectionSet.selectedCornerSpace.y;
		p_selectionSet.selectedCornerSpace = null;
		if (x == p_x && y == p_y) {
			if (p_selectionSet.previousStateSelectedCornerSpace == STAR_BATTLE_INPUT.SELECTED) {
				p_selectionSet.array[p_y][p_x] = STAR_BATTLE_INPUT.NOT_SELECTED;
			} else {
				p_selectionSet.array[p_y][p_x] = STAR_BATTLE_INPUT.SELECTED;
			}
		} else {
			const xMin = Math.min(p_x, x);
			const xMax = Math.max(p_x, x);
			const yMin = Math.min(p_y, y);
			const yMax = Math.max(p_y, y);
			for (y = yMin ; y <= yMax ; y++) {
				for (x = xMin ; x <= xMax ; x++) {
					p_selectionSet.array[y][x] = STAR_BATTLE_INPUT.SELECTED;
				}
			} 
		}
	}
}

restartSelectedSpaces = function(p_selectionSet, p_xLength, p_yLength) {
	p_selectionSet.array = generateValueArray(p_xLength, p_yLength, STAR_BATTLE_INPUT.NOT_SELECTED);
	p_selectionSet.selectedSpace = null;
}

//--------------------------
// Game action buttons

undoAction = function(p_solver) {
	p_solver.undo();
}

multiPassAction = function (p_solver) {
	p_solver.makeMultiPass();
}

quickStartAction = function (p_solver) {
	p_solver.quickStart();
}

solveAction = function (p_solver) {
	//p_solver.generalSolve();
}

selectionPassAction = function(p_solver, p_selectedSet) {
	var list = [];
	for (var iy = 0 ; iy < p_solver.xyLength ; iy++) {
		for (var ix = 0 ; ix < p_solver.xyLength ; ix++) {
			if (p_selectedSet.array[iy][ix] != STAR_BATTLE_INPUT.NOT_SELECTED) {
				list.push({x : ix, y : iy});
			}
		}
	}
	p_solver.passSelectedSpaces(list);
	restartSelectedSpaces(p_selectedSet, p_solver.xyLength, p_solver.xyLength);
}

unselectAction = function(p_solver, p_selectedSet) {
	restartSelectedSpaces(p_selectedSet, p_solver.xyLength, p_solver.xyLength);
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called by common save and load !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString) {
    const loadedItem = stringToStarBattlePuzzle(p_loadedString);
	p_solver.construct(loadedItem.wallArray, loadedItem.starNumber);
	p_drawer.adaptCanvasDimensions(p_canvas, {xyLength : p_solver.xyLength});
}