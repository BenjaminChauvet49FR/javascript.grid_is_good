clickAroundWallRAction = function(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchPathR(p_x, p_y);
}
clickAroundWallDAction = function(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchPathD(p_x, p_y);
}

function puzzleToString(p_editorCore,p_externalOptions){
	p_editorCore.resetNumbers();
	return GrandTourPuzzleToString(p_editorCore.getArray(),p_editorCore.getNumbers());
}

function getLocalStorageName(p_detachedName){
	return "grid_is_good_"+p_detachedName;
}

function stringToPuzzle(p_string){
	return stringToGrandTourPuzzle(p_string);
}

function updateFieldsAfterLoad(p_fieldsToUpdate, p_loadedItem){
	p_fieldsToUpdate.xLengthField.value = p_loadedItem.grid[0].length;
	p_fieldsToUpdate.yLengthField.value = p_loadedItem.grid.length;
}

//---------------

//TODO : the below method can (and should ?) be refactored...

/** 
Read the region grid as it is
p_editorCore : the editorCore item
*/
readRegionGrid = function(p_editorCore){
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
restartAction = function(p_canvas, p_drawer, p_editorCore, p_xLength, p_yLength){
	if (confirm("Redémarrer la grille ?")){
		p_editorCore.restartGrid(p_xLength,p_yLength);
		adaptCanvasAndGrid(p_canvas, p_drawer,p_editorCore);	
	}
}

function resizeAction(p_canvas, p_drawer, p_editorCore, p_xLength,p_yLength){
	if (confirm("Redimensionner la grille ?")){
		p_editorCore.resizeGrid(p_xLength,p_yLength);
		adaptCanvasAndGrid(p_canvas, p_drawer,p_editorCore);	
	}
}

//---------------

/**
Selection deal
*/

function actionBuildWallsAroundSelection(p_editorCore) {
	p_editorCore.buildWallsAroundSelection();
}

function actionUnselectAll(p_editorCore) {
	p_editorCore.unselectAll();
}