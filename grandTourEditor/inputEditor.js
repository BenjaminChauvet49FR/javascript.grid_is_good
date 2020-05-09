function clickAroundWallRAction(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchPathR(p_x, p_y);
}
function clickAroundWallDAction(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchPathD(p_x, p_y);
}

function puzzleToString(p_editorCore,p_externalOptions){
	return wallArrayToString(p_editorCore.getPaths());
}

function stringToPuzzle(p_string){
	return {grid:tokensToWallArray(p_string.split(' '))};
}

function getLocalStorageName(p_detachedName){
	return "grid_is_good_"+p_detachedName;
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
		//p_editorCore.resizeGrid(p_xLength,p_yLength); TODO Obsolète ! (cf. "mainstream" puzzles)
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