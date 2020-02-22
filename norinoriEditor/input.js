// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas

function clickWallRAction(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchWallR(p_x, p_y);
}
function clickWallDAction(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchWallD(p_x, p_y);
}
function clickSpaceAction(p_editorCore,p_x, p_y, p_modes){
	mode = p_modes.clickSpace;
	if (mode.id == MODE_SELECTION.id){
		p_editorCore.selectSpace(p_x,p_y);
	} else if (mode.id == MODE_ERASE.id){
		p_editorCore.clearWallsAround(p_x,p_y);
	} else {
		p_editorCore.switchState(p_x,p_y);
	}
}

function puzzleToString(p_editorCore,p_externalOptions){
	return norinoriPuzzleToString(p_editorCore.wallGrid);
}

function getLocalStorageName(p_detachedName){
	return "grid_is_good_"+p_detachedName;
}

function stringToPuzzle(p_string){
	return stringToNorinoriPuzzle(p_string);
}

function updateFieldsAfterLoad(p_fieldsToUpdate, p_loadedItem){
	p_fieldsToUpdate.xLengthField.value = p_loadedItem.grid[0].length;
	p_fieldsToUpdate.yLengthField.value = p_loadedItem.grid.length;
}

//------------------------------

/** 
Read the region grid as it is
p_editorCore : the global item
*/
function readRegionGrid(p_editorCore){
	p_editorCore.updateRegionGrid();
}

/**
Restarts the grid and the canvas to new dimensions
p_canvas : the canvas to adapt
p_pix : the Pix item
p_editorCore : the Global item
p_xLength : horizontal dimension
p_yLength : vertical dimension
*/
function restartAction(p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength){
	if (confirm("Redémarrer la grille ?")){
		p_editorCore.restartGrid(p_xLength,p_yLength);
		adaptCanvasAndGrid(p_canvas, p_drawer,p_editorCore);	
	}
}

function resizeAction(p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength){
	if (confirm("Redimensionner la grille ?")){
		p_editorCore.resizeGrid(p_xLength,p_yLength);
		adaptCanvasAndGrid(p_canvas, p_drawer,p_editorCore);	
	}
}

//------------------------------

/**
Selection deal
*/

function actionBuildWallsAroundSelection(p_editorCore) {
	p_editorCore.buildWallsAroundSelection();
}

function actionUnselectAll(p_editorCore) {
	p_editorCore.unselectAll();
}