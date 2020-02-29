/**
Functions to create :

clickWallRAction : what happens when a very precise part of the canvas is clicked on ?
clickWallDAction : same
clickSpaceAction : same
getLocalStorageName : Returns a name to store into / load from local storage
puzzleToString : Transforms the puzzle contained in an EditorCore into a string (so it will be stored)
stringToPuzzle : Loads a puzzle from a string
updateFieldsAfterLoad : update fields after puzzle is loaded
*/

//--------------------

function clickCanvas(event,p_canvas,p_drawer,p_editorCore,p_modes){
	var wallOK = false;
	var indexWallR = p_drawer.getClickWallR(event,p_canvas,p_editorCore);
	var indexWallD = p_drawer.getClickWallD(event,p_canvas,p_editorCore);
	if (indexWallR != null){
		clickWallRAction(p_editorCore,indexWallR.x, indexWallR.y, p_modes);
		wallOK = true;
	}
	if (indexWallD != null){
		clickWallDAction(p_editorCore,indexWallD.x, indexWallD.y, p_modes);
		wallOK = true;
	}
	if (wallOK){
		return;
	}
	var indexSpaces = p_drawer.getClickSpace(event,p_canvas,p_editorCore);
	if (indexSpaces != null){
		clickSpaceAction(p_editorCore,indexSpaces.x, indexSpaces.y, p_modes);
	}
}

//--------------------

/** Saves a walled grid into local storage 
p_editorCore : the Global item
p_detachedName : the detached name (without the prefix) to store into local storage
*/
saveAction = function(p_editorCore,p_detachedName,p_externalOptions) {
	var localStorageName = getLocalStorageName(p_detachedName);
	var letsSave = true;
	if (localStorage.hasOwnProperty(localStorageName)){
		if (!confirm("Le stockage local a déjà une propriété nommée '"+localStorageName+"'. L'écraser ?")){
			letsSave = false;
		}
	}
	if(letsSave){
		localStorage.setItem(localStorageName, puzzleToString(p_editorCore,p_externalOptions));
	}
}

loadAction = function(p_canvas,p_drawer,p_editorCore,p_detachedName,p_fieldsToUpdate){
	var localStorageName = getLocalStorageName(p_detachedName);
	if (localStorage.hasOwnProperty(localStorageName)){
		if (confirm("Charger le puzzle "+localStorageName+" ?")){
			var loadedItem = stringToPuzzle(localStorage.getItem(localStorageName));
			p_editorCore.setupFromWallArray(loadedItem.grid); //TODO maybe this will have to be revisited because we are forcing "answer" to have a grid value.
			if (p_editorCore.hasNumberGrid()){
				p_editorCore.setupNumberGrid(loadedItem.gridNumber); //TODO same as this
			}
			p_editorCore.setupFromWallArray(loadedItem.grid); 
			adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);	//Oh and this canvas, too...
			updateFieldsAfterLoad(p_fieldsToUpdate,loadedItem);
		}
	} else{
		alert("Le stockage local n'a pas de propriété nommée '"+localStorageName+"'.");
	}
}

//--------------------

/**
Adapts canvas to global grid
p_canvas : the canvas to adapt
p_pix : the Pix item to calculate coordinates
p_editorCore : the Global item the canvas should be adapted to
*/
function adaptCanvasAndGrid(p_canvas, p_drawer,p_editorCore){
	//Respects dimension of 800x512
	//TODO Constants can be written somewhere else !
	p_drawer.pix.sideSpace = Math.min(32,Math.min(Math.floor(800/p_editorCore.getXLength()),Math.floor(512/p_editorCore.getYLength())));
	p_drawer.pix.borderSpace = Math.max(1,Math.floor(p_drawer.pix.sideSpace/10));
	p_canvas.width = p_editorCore.getXLength()*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.left+p_drawer.pix.marginGrid.right;
	p_canvas.height = p_editorCore.getYLength()*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.up+p_drawer.pix.marginGrid.down;
	if(p_canvas.width > p_canvas.height){
		p_canvas.height = p_canvas.width;
	}
	else{
		p_canvas.width = p_canvas.height;
	}
}

//--------------------
/**
Transform the grid
*/

function rotateCWAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.rotateCWGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

function rotateUTurnAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.rotateUTurnGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

function rotateCCWAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.rotateCCWGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

function mirrorHorizontalAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.mirrorHorizontalGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

function mirrorVerticalAction(p_canvas,p_drawer,p_editorCore){
	p_editorCore.mirrorVerticalGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_editorCore);
}

//--------------------
/**
Put action (todo todo...)
*/