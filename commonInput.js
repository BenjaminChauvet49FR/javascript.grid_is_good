/**
Functions to create :

For editors & solvers
clickWallRAction : what happens when a very precise part of the canvas is clicked on ?
clickWallDAction : same
clickSpaceAction : same
getLocalStorageName : Returns a name to store into / load from local storage
updateFieldsAfterLoad : update fields after puzzle is loaded

For editors
puzzleToString : Transforms the puzzle contained in an EditorCore into a string (so it will be stored)

For puzzles
stringToPuzzle : Loads a puzzle from a string
*/

/**
p_core refers as well to an editorCore or a solver
*/

//--------------------

function clickCanvas(event,p_canvas,p_drawer,p_core,p_modes){
	var wallOK = false;
	var indexWallR = p_drawer.getClickWallR(event,p_canvas,p_core);
	var indexWallD = p_drawer.getClickWallD(event,p_canvas,p_core);	
	var indexAroundWallR = p_drawer.getClickAroundWallR(event,p_canvas,p_core);
	var indexAroundWallD = p_drawer.getClickAroundWallD(event,p_canvas,p_core);
	if (indexWallR != null && (typeof(clickWallRAction) == 'function')){
		clickWallRAction(p_core,indexWallR.x, indexWallR.y, p_modes);
		wallOK = true;
	}
	if (indexAroundWallR != null && (typeof(clickAroundWallRAction) == 'function')){
		clickAroundWallRAction(p_core,indexAroundWallR.x, indexAroundWallR.y, p_modes);
		wallOK = true;
	}
	if (indexWallD != null && (typeof(clickWallDAction) == 'function')){
		clickWallDAction(p_core,indexWallD.x, indexWallD.y, p_modes);
		wallOK = true;
	}
	if (indexAroundWallD != null && (typeof(clickAroundWallDAction) == 'function')){
		clickAroundWallDAction(p_core,indexAroundWallD.x, indexAroundWallD.y, p_modes);
		wallOK = true;
	}
	if (wallOK){
		return;
	}
	var indexSpaces = p_drawer.getClickSpace(event,p_canvas,p_core);
	if (indexSpaces != null && (typeof(clickSpaceAction) == 'function')){
		clickSpaceAction(p_core,indexSpaces.x, indexSpaces.y, p_modes);
	}
}

//--------------------

/** Saves a walled grid into local storage 
p_core : the Global item
p_detachedName : the detached name (without the prefix) to store into local storage
*/
saveAction = function(p_core,p_detachedName,p_externalOptions) {
	var localStorageName = getLocalStorageName(p_detachedName);
	var letsSave = true;
	if (localStorage.hasOwnProperty(localStorageName)){
		if (!confirm("Le stockage local a déjà une propriété nommée '"+localStorageName+"'. L'écraser ?")){
			letsSave = false;
		}
	}
	if(letsSave){
		localStorage.setItem(localStorageName, puzzleToString(p_core,p_externalOptions));
	}
}

loadAction = function(p_canvas,p_drawer,p_core,p_detachedName,p_fieldsToUpdate){
	var localStorageName = getLocalStorageName(p_detachedName);
	if (localStorage.hasOwnProperty(localStorageName)){
		if (confirm("Charger le puzzle "+localStorageName+" ?")){
			var loadedItem = stringToPuzzle(localStorage.getItem(localStorageName));
			p_core.setupFromWallArray(loadedItem.grid); //TODO maybe this will have to be revisited because we are forcing "answer" to have a grid value.
			if (p_core.hasNumberGrid()){
				p_core.setupNumberGrid(loadedItem.gridNumber); //TODO same as this
			}
			p_core.setupFromWallArray(loadedItem.grid); 
			adaptCanvasAndGrid(p_canvas,p_drawer,p_core);	//Oh and this canvas, too...
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
p_core : the Global item the canvas should be adapted to
*/
function adaptCanvasAndGrid(p_canvas, p_drawer,p_core){
	//Respects dimension of 800x512
	//TODO Constants can be written somewhere else !
	p_drawer.pix.sideSpace = Math.min(32,Math.min(Math.floor(800/p_core.getXLength()),Math.floor(512/p_core.getYLength())));
	p_drawer.pix.borderSpace = Math.max(1,Math.floor(p_drawer.pix.sideSpace/10));
	p_canvas.width = p_core.getXLength()*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.left+p_drawer.pix.marginGrid.right;
	p_canvas.height = p_core.getYLength()*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.up+p_drawer.pix.marginGrid.down;
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

function rotateCWAction(p_canvas,p_drawer,p_core){
	p_core.rotateCWGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_core);
}

function rotateUTurnAction(p_canvas,p_drawer,p_core){
	p_core.rotateUTurnGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_core);
}

function rotateCCWAction(p_canvas,p_drawer,p_core){
	p_core.rotateCCWGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_core);
}

function mirrorHorizontalAction(p_canvas,p_drawer,p_core){
	p_core.mirrorHorizontalGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_core);
}

function mirrorVerticalAction(p_canvas,p_drawer,p_core){
	p_core.mirrorVerticalGrid();
	adaptCanvasAndGrid(p_canvas,p_drawer,p_core);
}

//--------------------
/**
Actions that don't require creating new actions
*/
function putActionElementClick(p_idElement,p_eventFunction){
	document.getElementById(p_idElement).addEventListener('click',p_eventFunction);
}

function viewPuzzleList(p_puzzleName){
	var string = "";
	var listToSort = [];
	var baseString = "grid_is_good_"+p_puzzleName; //TODO ce changement...
	for (var i = 0, len = localStorage.length; i < len; i++) {
        var key = localStorage.key(i);
		if (key.startsWith(baseString)){
			listToSort.push(parseInt(key.substring(baseString.length)));
		}
	}
	console.log(listToSort);
	listToSort=listToSort.sort(function(a,b){return a-b;});
	var conditionalComma = "";
	for(var i=0;i<listToSort.length;i++){
		string+=(conditionalComma+listToSort[i]);
		conditionalComma=",";
	}
	alert(string);
}