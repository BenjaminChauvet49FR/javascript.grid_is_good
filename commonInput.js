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
p_editorCore refers as well to an editorCore or a solver
 */

//--------------------

//TODO à déplacer à l'endroit pus approprié peut-être ?
const PUZZLES_KIND = {
	HEYAWAKE_LIKE : {id:2},
	MASYU_LIKE : {id:3},
	STAR_BATTLE : {id:101,squareGrid : true},
	GRAND_TOUR : {id:102}
}

//--------------------

function clickCanvas(event, p_canvas, p_drawer, p_editorCore, p_modes) {
    var wallOK = false;
    var indexWallR = p_drawer.getClickWallR(event, p_canvas, p_editorCore);
    var indexWallD = p_drawer.getClickWallD(event, p_canvas, p_editorCore);
    var indexAroundWallR = p_drawer.getClickAroundWallR(event, p_canvas, p_editorCore);
    var indexAroundWallD = p_drawer.getClickAroundWallD(event, p_canvas, p_editorCore);
    if (indexWallR != null && (typeof(clickWallRAction) == 'function')) {
        clickWallRAction(p_editorCore, indexWallR.x, indexWallR.y, p_modes);
        wallOK = true;
    }
    if (indexAroundWallR != null && (typeof(clickAroundWallRAction) == 'function')) {
        clickAroundWallRAction(p_editorCore, indexAroundWallR.x, indexAroundWallR.y, p_modes);
        wallOK = true;
    }
    if (indexWallD != null && (typeof(clickWallDAction) == 'function')) {
        clickWallDAction(p_editorCore, indexWallD.x, indexWallD.y, p_modes);
        wallOK = true;
    }
    if (indexAroundWallD != null && (typeof(clickAroundWallDAction) == 'function')) {
        clickAroundWallDAction(p_editorCore, indexAroundWallD.x, indexAroundWallD.y, p_modes);
        wallOK = true;
    }
    if (wallOK) {
        return;
    }
    var indexSpaces = p_drawer.getClickSpace(event, p_canvas, p_editorCore.getXLength(), p_editorCore.getYLength());
    if (indexSpaces != null && (typeof(clickSpaceAction) == 'function')) {
        clickSpaceAction(p_editorCore, indexSpaces.x, indexSpaces.y, p_modes);
    }
}

//--------------------

/** Saves a walled grid into local storage
p_editorCore : the Global item
p_detachedName : the detached name (without the prefix) to store into local storage
 */
saveAction = function (p_editorCore, p_detachedName, p_kindId, p_externalOptions) {
    var localStorageName = getLocalStorageName(p_detachedName);
    var letsSave = true;
    if (localStorage.hasOwnProperty(localStorageName)) {
        if (!confirm("Le stockage local a déjà une propriété nommée '" + localStorageName + "'. L'écraser ?")) {
            letsSave = false;
        }
    }
    if (letsSave) {
		var puzzleToSave = "";
		if (p_kindId == PUZZLES_KIND.STAR_BATTLE.id){
			puzzleToSave = starBattlePuzzleToString(p_editorCore.getWallArray(),p_externalOptions.numberStars);
		} else if (p_kindId == PUZZLES_KIND.MASYU_LIKE.id) {
			puzzleToSave = commonPuzzleToString(null,null,p_editorCore.get(GRID_ID.PEARL));
		} else {
			p_editorCore.alignToRegions(GRID_ID.NUMBER_REGION);
			puzzleToSave = commonPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.NUMBER_REGION),null);
		}
        localStorage.setItem(localStorageName, puzzleToSave);
    }
}

loadAction = function (p_canvas, p_drawer, p_editorCore, p_detachedName, p_kindId, p_fieldsToUpdate) {
    var localStorageName = getLocalStorageName(p_detachedName);
    if (localStorage.hasOwnProperty(localStorageName)) {
        if (confirm("Charger le puzzle " + localStorageName + " ?")) {
			var loadedItem = null;
			//NB : reinitialization is supposed to be contained in setupFromWallArray
            if (p_kindId == PUZZLES_KIND.STAR_BATTLE.id){
				loadedItem = stringToStarBattlePuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.grid);			
			} else if (p_kindId == PUZZLES_KIND.MASYU_LIKE.id){
				loadedItem = stringToPuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.grid);			
				p_editorCore.addGrid(GRID_ID.PEARL,loadedItem.gridSymbol); 
			} else {
				loadedItem = stringToWallAndNumbersPuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.grid);			
				p_editorCore.addGrid(GRID_ID.NUMBER_REGION,loadedItem.gridNumber); 
			}
            adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore); 
            updateFieldsAfterLoad(p_fieldsToUpdate, loadedItem);
        }
    } else {
        alert("Le stockage local n'a pas de propriété nommée '" + localStorageName + "'.");
    }
}

//--------------------

/**
Adapts canvas to global grid
p_canvas : the canvas to adapt
p_pix : the Pix item to calculate coordinates
p_editorCore : the Global item the canvas should be adapted to
 */
function adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore) {
    p_drawer.adaptCanvasDimensions(p_canvas, {
        xLength: p_editorCore.getXLength(),
        yLength: p_editorCore.getYLength()
    });
}

//--------------------
/**
Transform the grid
 */

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

//--------------------
/**
Actions that don't require creating new actions
 */
function putActionElementClick(p_idElement, p_eventFunction) {
    document.getElementById(p_idElement).addEventListener('click', p_eventFunction);
}

function viewPuzzleList(p_puzzleName) {
    var string = "";
    var listToSort = [];
    var baseString = "grid_is_good_" + p_puzzleName; //TODO ce changement...
    for (var i = 0, len = localStorage.length; i < len; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(baseString)) {
            listToSort.push(parseInt(key.substring(baseString.length)));
        }
    }
    console.log(listToSort);
    listToSort = listToSort.sort(function (a, b) {
        return a - b;
    });
    var conditionalComma = "";
    for (var i = 0; i < listToSort.length; i++) {
        string += (conditionalComma + listToSort[i]);
        conditionalComma = ",";
    }
    alert(string);
}


function actionBuildWallsAroundSelection(p_editorCore) {
	p_editorCore.buildWallsAroundSelection();
}

function actionUnselectAll(p_editorCore) {
	p_editorCore.unselectAll();
}