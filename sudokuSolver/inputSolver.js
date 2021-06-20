/**
 When you click on the canvas
*/
function clickCanvasAction(event, p_canvas, p_drawer, p_solver, p_actionsManager, p_selectionSet) { 
	var spaceClicked = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
    if (spaceClicked != null) {
		clickSpaceAction(p_solver, spaceClicked.x, spaceClicked.y, p_actionsManager.clickSpace, p_selectionSet);
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_solver, p_spaceIndexX, p_spaceIndexY, p_action, p_selectionSet) {
	switch(p_action.id) {
		case ACTION_ENTER_NUMBER.id:
			if (!p_solver.isBlocked(p_spaceIndexX, p_spaceIndexY)) {
				var value = prompt("Entrer valeur", 1);
				value = parseInt(value, 10);
				if ((value != NaN) && (value > 0)) { // Maximum defined in solver
					p_solver.emitHypothesis(p_spaceIndexX, p_spaceIndexY, value); 
				}
			}
		break;
		/*case ACTION_PASS_REGION.id:
			p_solver.passRegion(p_solver.getRegionIndex(p_spaceIndexX,p_spaceIndexY));
		break;*/
		case ACTION_SELECTION_RECTANGLE.id : 
			p_selectionSet.triggerSpace(p_spaceIndexX, p_spaceIndexY); 
		break;
		case ACTION_PASS_GRIDS.id :
			if (p_solver.getGridIndexes(p_spaceIndexX, p_spaceIndexY).length != 0) {				
				p_solver.emitPassGrids(p_solver.getGridIndexes(p_spaceIndexX, p_spaceIndexY));
			}
		break;
	}
}

function catchMouse(event, p_canvas, p_drawer, p_solver, p_mousePositionItem) {
	p_mousePositionItem.item = p_drawer.getClickSpace(event, p_canvas, p_solver.xLength, p_solver.yLength);
}

//--------------------------
// Game action buttons

quickStartAction = function(p_solver) {
	p_solver.quickStart();
}

undoAction = function(p_solver) {
	p_solver.undo();
}

totalPassAction = function (p_solver) {
	if (confirm("Faire une passe qui porte sur toutes les cases non décidées ?")) {		
		p_solver.makeTotalPass();
	}
}

selectionPassAction = function(p_solver, p_selectionSet) {
	const passing = p_solver.emitPassSelectedSpaces(p_selectionSet.getSelectedSpacesList());
	if (passing != PASS_RESULT.HARMLESS) {
		p_selectionSet.restartSelectedSpaces();
	}
}

unselectAction = function(p_solver, p_selectionSet) {
	p_selectionSet.restartSelectedSpaces();
}

//--------------------------

/** 
Transforms a loaded string into the appropriate item (see common save and load), updates intelligence, updates canvas.
Called from outside !
*/
loadPuzzle = function(p_canvas, p_drawer, p_solver, p_loadedString, p_extraProperties) {
	const wallArray = getSudokuWallGrid(p_extraProperties.sudokuMode).array;
	const loadedItem = stringToSudokuPuzzle(p_loadedString, wallArray); // note : wall array construct here and inside the solver. Could be optimized, though it would involve a huge couplage.
	p_solver.construct(p_extraProperties.sudokuMode, loadedItem.numberArray);
	p_drawer.adaptCanvasDimensions(p_canvas, {xLength : p_solver.xLength, yLength : p_solver.yLength});
}

