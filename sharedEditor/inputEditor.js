function clickCanvas(event, p_canvas, p_drawer, p_editorCore, p_modes) {
    var doneClicking = false;
	const p_xLength = p_editorCore.getXLength();
	const p_yLength = p_editorCore.getYLength();
	if (p_editorCore.hasWalls()) {
		var indexWallR = p_drawer.getClickWallR(event, p_canvas, p_xLength, p_yLength);
		var indexWallD = p_drawer.getClickWallD(event, p_canvas, p_xLength, p_yLength);
		if (indexWallR != null) {
			p_editorCore.switchWallR(indexWallR.x, indexWallR.y);
			doneClicking = true;
		}
		if (indexWallD != null) {
			p_editorCore.switchWallD(indexWallD.x, indexWallD.y);
			doneClicking = true;
		}
	}
	if (p_editorCore.hasPathGrid()) {
		var indexAroundWallR = p_drawer.getClickAroundWallR(event, p_canvas, p_xLength, p_yLength);
		var indexAroundWallD = p_drawer.getClickAroundWallD(event, p_canvas, p_xLength, p_yLength);
		if (indexAroundWallR != null) {
			p_editorCore.switchWallR(indexAroundWallR.x, indexAroundWallR.y);
			doneClicking = true;
		}
	  
		if (indexAroundWallD != null && (typeof(clickAroundWallDAction) == 'function')) {
			p_editorCore.switchWallD(indexAroundWallD.x, indexAroundWallD.y);
			doneClicking = true;
		}
	}
    if (doneClicking) {
        return;
    }
    var indexSpaces = p_drawer.getClickSpace(event, p_canvas, p_xLength, p_yLength);
    if (indexSpaces != null) {
        clickSpaceAction(p_editorCore, indexSpaces.x, indexSpaces.y, p_modes);
    }
}

clickSpaceAction = function (p_editorCore, p_x, p_y, p_modes) {
    mode = p_modes.clickSpace;
	switch (mode.id) {
		case (MODE_SELECTION.id) :
		    p_editorCore.switchSelectedSpace(p_x, p_y);
		break;
		case (MODE_ERASE.id) :
		    p_editorCore.clearWallsAround(p_x, p_y);
			p_editorCore.clear(GRID_ID.NUMBER_REGION, p_x, p_y);
		break;
		case (MODE_SELECTION_RECTANGLE.id) :
		    p_editorCore.selectRectangleMechanism(p_x, p_y);
		break;
		case (MODE_NUMBER.id) :
			if (p_editorCore.get(GRID_ID.NUMBER_REGION, p_x, p_y) != p_editorCore.getInputNumber()) {
				p_editorCore.set(GRID_ID.NUMBER_REGION, p_x, p_y, p_editorCore.getInputNumber());
			} else {
				p_editorCore.clear(GRID_ID.NUMBER_REGION, p_x, p_y);
			}
		break;	
		case (MODE_PEARL_ABSTRACT.id) :
			if (p_editorCore.get(GRID_ID.PEARL, p_x, p_y) != p_editorCore.getInputSymbol()) {
				p_editorCore.set(GRID_ID.PEARL, p_x, p_y, p_editorCore.getInputSymbol());
			} else {
				p_editorCore.clear(GRID_ID.PEARL, p_x, p_y);
			}
		break;
		default :
			p_editorCore.switchState(p_x,p_y);
	}
}

//------------------------

function stringToPuzzle(p_string) {
    return stringToWallAndNumbersPuzzle(p_string);
}

function updateFieldsAfterLoad(p_fieldsToUpdate, p_loadedItem) {
    p_fieldsToUpdate.xLengthField.value = p_loadedItem.grid[0].length;
    p_fieldsToUpdate.yLengthField.value = p_loadedItem.grid.length;
	if (p_loadedItem.starNumber) {
		p_fieldsToUpdate.numberStarsField.value = p_loadedItem.starNumber;
	}
}

/**
Restarts the grid and the canvas to new dimensions
p_canvas : the canvas to adapt
p_pix : the Pix item
p_editorCore : the Global item
p_xLength : horizontal dimension
p_yLength : vertical dimension
 */
restartAction = function (p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength) {
    if (confirm("Redémarrer la grille ?")) {
        p_editorCore.restartGrid(p_xLength, p_yLength);
		p_editorCore.addCleanGrid(GRID_ID.NUMBER_REGION, p_xLength, p_yLength);
		p_editorCore.addCleanGrid(GRID_ID.PEARL, p_xLength, p_yLength);
        adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);
    }
}

//------------------------

function rotateCWAction(p_canvas, p_drawer, p_editorCore) {
    transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.ROTATE_CW);
}

function rotateUTurnAction(p_canvas, p_drawer, p_editorCore) {
    transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.ROTATE_UTURN);
}

function rotateCCWAction(p_canvas, p_drawer, p_editorCore) {
    transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.ROTATE_CCW);
}

function mirrorHorizontalAction(p_canvas, p_drawer, p_editorCore) {
    transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.MIRROR_HORIZONTAL);
}

function mirrorVerticalAction(p_canvas, p_drawer, p_editorCore) {
	transformGrid(p_canvas, p_drawer, p_editorCore, GRID_TRANSFORMATION.MIRROR_VERTICAL);
}

function transformGrid(p_canvas,p_drawer,p_editorCore, p_transformation) {
	p_editorCore.transformGrid(p_transformation);
    adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);
}

function resizeAction(p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength) {
	if (!p_yLength) {
		p_yLength = p_xLength;
	}
	if (confirm("Redimensionner la grille ?")) {
		p_editorCore.transformGrid(GRID_TRANSFORMATION.RESIZE, p_xLength, p_yLength);
		adaptCanvasAndGrid(p_canvas, p_drawer,p_editorCore);	
	}
}

//------------------------

function actionUnselectAll(p_editorCore) {
	p_editorCore.unselectAll();
}

function actionBuildWallsAroundSelection(p_editorCore) {
	p_editorCore.buildWallsAroundSelection();
}