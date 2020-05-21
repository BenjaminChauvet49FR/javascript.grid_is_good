clickWallRAction = function (p_editorCore, p_x, p_y, p_modes) {
    p_editorCore.switchWallR(p_x, p_y);
}

clickWallDAction = function (p_editorCore, p_x, p_y, p_modes) {
    p_editorCore.switchWallD(p_x, p_y);
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

function getLocalStorageName(p_detachedName) {
    return "grid_is_good_" + p_detachedName;
}

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