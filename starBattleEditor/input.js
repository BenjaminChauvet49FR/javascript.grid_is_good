
clickWallRAction = function(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchWallR(p_x, p_y);
}
clickWallDAction = function(p_editorCore,p_x, p_y, p_modes){
	p_editorCore.switchWallD(p_x, p_y);
}
clickSpaceAction = function(p_editorCore,p_x, p_y, p_modes){
	mode = p_modes.clickSpace;
	if (mode.id == MODE_SELECTION.id){
		p_editorCore.selectSpace(p_x,p_y);
	} else if (mode.id == MODE_ERASE.id){
		p_editorCore.clearWallsAround(p_x,p_y);
	} else {
		p_editorCore.switchState(p_x,p_y);
	}
}

/** Saves a walled grid into local storage 
p_editorCore : the Global item
p_detachedName : the detached name (without the prefix) to store into local storage
*/
saveAction = function(p_editorCore,p_detachedName,p_numberStars) {
	var localStorageName = getLocalStorageName(p_detachedName);
	var letsSave = true;
	if (localStorage.hasOwnProperty(localStorageName)){
		if (!confirm("Le stockage local a déjà une propriété nommée '"+localStorageName+"'. L'écraser ?")){
			letsSave = false;
		}
	}
	if(letsSave){
		localStorage.setItem(localStorageName, starBattlePuzzleToString(p_editorCore.wallGrid,p_numberStars));
	}
}

/** Loads a walled grid from local storage 
p_detachedName : the detached name (without the prefix) to load from local storage
*/
loadAction = function(p_canvas,p_drawer,p_editorCore,p_detachedName,p_sizeField,p_numberStarsField){
	var localStorageName = getLocalStorageName(p_detachedName);
	if (localStorage.hasOwnProperty(localStorageName)){
		if (confirm("Charger la grille "+localStorageName+" ?")){
			var answer = stringToStarBattlePuzzle(localStorage.getItem(localStorageName));
			p_editorCore.loadGrid(answer.grid);
			adaptCanvas(p_canvas,p_drawer,p_editorCore);	
			p_numberStarsField.value = answer.starNumber;
			p_sizeField.value = answer.grid.length;

		}
	} else{
		alert("Le stockage local n'a pas de propriété nommée '"+localStorageName+"'.");
	}
}

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

/**
Adapts canvas to editor core
p_canvas : the canvas to adapt
p_pix : the Pix item to calculate coordinates
p_editorCore : the item the canvas should be adapted to
*/
function adaptCanvasAndGrid(p_canvas, p_drawer,p_editorCore){
	p_canvas.width = p_editorCore.xLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.left+p_drawer.pix.marginGrid.right;
	p_canvas.height = p_editorCore.yLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.up+p_drawer.pix.marginGrid.down;
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