clickWallRAction = function(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchWallR(p_x, p_y);
}
clickWallDAction = function(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchWallD(p_x, p_y);
}
clickSpaceAction = function(p_editorCore,p_x, p_y, p_modes){
	mode = p_modes.clickSpace;
	if (mode.id == MODE_SELECTION.id){
		p_editorCore.switchSelectedSpace(p_x,p_y);
	} else if (mode.id == MODE_ERASE.id){
		p_editorCore.clearWallsAround(p_x,p_y);
	} else {
		p_editorCore.switchState(p_x,p_y);
	}
}

function getLocalStorageName(p_detachedName){
	return "grid_is_good_"+p_detachedName;
}

function updateFieldsAfterLoad(p_fieldsToUpdate, p_loadedItem){
	p_fieldsToUpdate.numberStarsField.value = p_loadedItem.starNumber;
	p_fieldsToUpdate.sizeField.value = p_loadedItem.grid.length;
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

function resizeAction(p_canvas, p_drawer, p_editorCore, p_xyLength){
	if (confirm("Redimensionner la grille ?")){
		p_editorCore.transformGrid(GRID_TRANSFORMATION.RESIZE, p_xyLength, p_xyLength);
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