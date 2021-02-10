// Clicks on the canvas 

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
	/*if (p_editorCore.hasPathGrid()) { // TODO gérer les clics pour quand la grille sera en mode "affichage édition de sommets"
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
	}*/
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
			p_editorCore.clear(GRID_ID.NUMBER_SPACE, p_x, p_y);
			p_editorCore.clear(GRID_ID.NUMBER_PEARL, p_x, p_y);
		break;
		case (MODE_SELECTION_RECTANGLE.id) :
		    p_editorCore.selectRectangleMechanism(p_x, p_y);
		break;
		case (MODE_NUMBER_REGION.id) :
			manageValueInSpaceGrid(p_x, p_y, GRID_ID.NUMBER_REGION, p_editorCore, p_editorCore.getInputNumber());
		break;
		case (MODE_NUMBER_SPACE.id) :
			manageValueInSpaceGrid(p_x, p_y, GRID_ID.NUMBER_SPACE, p_editorCore, p_editorCore.getInputNumber());
		break;			
		case (MODE_PEARL_ABSTRACT.id) :
			manageValueInSpaceGrid(p_x, p_y, GRID_ID.PEARL, p_editorCore, p_editorCore.getInputSymbol());
		break;
		case (MODE_ARROW_COMBINED.id) :	
			var clue = prompt("Entrer indice Yajilin (L|U|R|D)(nombre)", "L1");
		break;
		default :
			p_editorCore.switchState(p_x,p_y);
	}
}

// Manages a value in a space in a grid : sets the space to the value, unless it already has it in which cas it gets cleared.
// p_value may depend on p_editorCore.
function manageValueInSpaceGrid(p_x, p_y, p_gridId, p_editorCore, p_value) {
	if (p_editorCore.get(p_gridId, p_x, p_y) != p_value) {
		p_editorCore.set(p_gridId, p_x, p_y, p_value);
	} else {
		p_editorCore.clear(p_gridId, p_x, p_y);
	}
}

//------------------------
// Things to be done when puzzle is restarted

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
		p_editorCore.addCleanGrid(GRID_ID.NUMBER_SPACE, p_xLength, p_yLength);
		p_editorCore.addCleanGrid(GRID_ID.PEARL, p_xLength, p_yLength);
        adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);
    }
}

//------------------------
// Transformation actions

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
// Things to be done when the "space mode" is changed (put a number / some symbol, change state...)

function applyChangesForSpaceMode(p_editorCore) {
	actionUnselectAll(p_editorCore);
}

//------------------------
// Selections actions

function actionUnselectAll(p_editorCore) {
	p_editorCore.unselectAll();
}

function actionBuildWallsAroundSelection(p_editorCore) {
	p_editorCore.buildWallsAroundSelection();
}

//------------------------
// Name management actions

removeAction = function (p_detachedName) {
	var localStorageName = getLocalStorageName(p_detachedName);
    if (localStorage.hasOwnProperty(localStorageName)) {
        if (confirm("Supprimer la propriété '" + localStorageName + "' du stockage local ?")) {
            localStorage.removeItem(localStorageName);
        }
    } else {
		alertMissingPuzzle(localStorageName);
	}
}

// TODO : will local storage properties always be prefixed by grid_is_good ?
renameAction = function (p_fieldValue) { 
	var localStorageName = getLocalStorageName(p_fieldValue.value);
    if (localStorage.hasOwnProperty(localStorageName)) {
        const newDetachedName = prompt("Renommer la propriété "+ localStorageName+" (nom préfixé par 'grid_is_good_') : ", p_fieldValue.value);
		if (newDetachedName != null) {
			const localStorageName2 = getLocalStorageName(newDetachedName);
			if (localStorageName2 == "" || localStorage.hasOwnProperty(localStorageName2)) {
				alert("Nom "+localStorageName2+" invalide ou déjà pris.");
			} else {
				localStorage.setItem(localStorageName2, localStorage.getItem(localStorageName));
				localStorage.removeItem(localStorageName);
				p_fieldValue.value = newDetachedName;
			}
		}
    } else {
		alertMissingPuzzle(localStorageName);
	}
}

//------------------------
// Saving and loading

const PUZZLES_KIND = {
	HEYAWAKE_LIKE : {id:2},
	MASYU_LIKE : {id:3},
	STAR_BATTLE : {id:101, squareGrid : true},
	GRAND_TOUR : {id:102},
	NURIKABE_LIKE : {id:4},
	YAJILIN_LIKE : {id:5},
	HAKYUU_LIKE : {id:6}
}

/** 
Saves a walled grid into local storage
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
		if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_REGION)) {
			p_editorCore.alignToRegions(GRID_ID.NUMBER_REGION);
		}
		p_editorCore.cleanRedundantWalls();
		
        if (p_kindId == PUZZLES_KIND.STAR_BATTLE.id) {
            puzzleToSave = starBattlePuzzleToString(p_editorCore.getWallArray(), p_externalOptions.numberStars);
        } else if (p_kindId == PUZZLES_KIND.MASYU_LIKE.id) {
            const grid = p_editorCore.getArray(GRID_ID.PEARL);
            puzzleToSave = commonPuzzleEmptyWallsToString(p_editorCore.getXLength(), p_editorCore.getYLength(), p_editorCore.getArray(GRID_ID.PEARL), [SYMBOL_ID.WHITE, SYMBOL_ID.BLACK]);
        } else if (p_kindId == PUZZLES_KIND.NURIKABE_LIKE.id) {
            const grid = p_editorCore.getArray(GRID_ID.NUMBER_SPACE);
            puzzleToSave = arrayToStringSpaces(p_editorCore.getArray(GRID_ID.NUMBER_SPACE), true);
        } else if (p_kindId == PUZZLES_KIND.YAJILIN_LIKE.id) {
            alert("551551 Saving To be done ...");
			//const grid = p_editorCore.getArray(GRID_ID.NUMBER_SPACE);
            //puzzleToSave = arrayToStringRows(p_editorCore.getArray(GRID_ID.YAJILIN), true);
        } else if (p_kindId == PUZZLES_KIND.HAKYUU_LIKE.id) {
			puzzleToSave = commonPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.NUMBER_SPACE), null);
		} else {
            puzzleToSave = commonPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.NUMBER_REGION), null);
        }
        localStorage.setItem(localStorageName, puzzleToSave);
    }
}

/**
Loads the desired grid from the local storage
p_detachedName is the detached name
*/
editorLoadAction = function (p_canvas, p_drawer, p_editorCore, p_detachedName, p_kindId, p_fieldsToUpdate) {
    var localStorageName = getLocalStorageName(p_detachedName);
    if (localStorage.hasOwnProperty(localStorageName)) {
        if (confirm("Charger le puzzle " + localStorageName + " ?")) {
			var loadedItem = null;
			p_editorCore.maskAllGrids();
			//NB : reinitialization is supposed to be contained in setupFromWallArray
            if (p_kindId == PUZZLES_KIND.STAR_BATTLE.id){
				loadedItem = stringToStarBattlePuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.gridWall);			
			} else if (p_kindId == PUZZLES_KIND.MASYU_LIKE.id){
				loadedItem = stringToEmptyWallsPuzzle(localStorage.getItem(localStorageName));
				const gridPearl = loadedItem.gridSymbol;
				loadedItem.gridWall = generateWallArray(gridPearl[0].length, gridPearl.length); // ".wallGrid" property added to suit the updateFieldsAfterLoad method .
				p_editorCore.setupFromWallArray(loadedItem.gridWall);
				p_editorCore.addGrid(GRID_ID.PEARL, gridPearl); 
			} else if (p_kindId == PUZZLES_KIND.NURIKABE_LIKE.id){
				loadedItem = stringToNurikabePuzzle(localStorage.getItem(localStorageName));
				const gridNumber = loadedItem.gridNumber;
				loadedItem.gridWall = generateWallArray(gridNumber[0].length, gridNumber.length); 
				p_editorCore.setupFromWallArray(loadedItem.gridWall);
				p_editorCore.addGrid(GRID_ID.NUMBER_SPACE, gridNumber); 
			} else if (p_kindId == PUZZLES_KIND.YAJILIN_LIKE.id){
				/*loadedItem = stringToYajilinPuzzle(localStorage.getItem(localStorageName));
				const gridNumber = loadedItem.gridNumber;
				loadedItem.gridWall = generateWallArray(gridNumber[0].length, gridNumber.length); 
				p_editorCore.setupFromWallArray(loadedItem.gridWall);			
				p_editorCore.addGrid(GRID_ID.NUMBER_SPACE, gridNumber); */
				alert("551551 Loading To be done ...");
			} else if (p_kindId == PUZZLES_KIND.HAKYUU_LIKE.id) {
				loadedItem = stringToWallAndNumbersPuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.gridWall);			
				p_editorCore.addGrid(GRID_ID.NUMBER_SPACE,loadedItem.gridNumber); 
			} else {
				loadedItem = stringToWallAndNumbersPuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.gridWall);			
				p_editorCore.addGrid(GRID_ID.NUMBER_REGION,loadedItem.gridNumber); 
			}
            adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore); 
            updateFieldsAfterLoad(p_fieldsToUpdate, loadedItem);
        }
    } else {
        alertMissingPuzzle(localStorageName);
    }
}

function alertMissingPuzzle(p_localStorageName) {
	alert("Le stockage local n'a pas de propriété nommée '" + p_localStorageName + "'.");
}

function updateFieldsAfterLoad(p_fieldsToUpdate, p_loadedItem) {
    p_fieldsToUpdate.xLengthField.value = p_loadedItem.gridWall[0].length;
    p_fieldsToUpdate.yLengthField.value = p_loadedItem.gridWall.length;
	if (p_loadedItem.starNumber) {
		p_fieldsToUpdate.numberStarsField.value = p_loadedItem.starNumber;
	}
}

//How to use the change of a combobox. Credits : https://www.scriptol.fr/html5/combobox.php
function comboChange(p_thelist, p_editorCore) {
    var idx = p_thelist.selectedIndex;
    var content = p_thelist.options[idx].innerHTML;
    console.log(content);
	// Default options
	p_editorCore.setWallsOn();
	// Specific options
    switch (content) {
		case 'CurvingRoad' : case 'Masyu':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.MASYU_LIKE.id;
			p_editorCore.setVisibleGrids([GRID_ID.PEARL]);
			break;
		case 'Koburin':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.NURIKABE_LIKE.id;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_SPACE]);
			break;
		case 'SternenSchlacht':
			saveLoadModeId = PUZZLES_KIND.STAR_BATTLE.id;
			p_editorCore.maskAllGrids();
			break;
		case 'Chocona': case 'Heyawake': case 'Shimaguni' :
			saveLoadModeId = PUZZLES_KIND.HEYAWAKE_LIKE.id;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_REGION]);
			break;
		case 'Hakyuu':
			saveLoadModeId = PUZZLES_KIND.HAKYUU_LIKE.id;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_SPACE]);
			break;
		default: // norinori, lits, entryExit... no numbers, only regions
			saveLoadModeId = PUZZLES_KIND.HEYAWAKE_LIKE.id;
			p_editorCore.maskAllGrids();	
    } // Credits for multiple statements in cases : https://stackoverflow.com/questions/13207927/switch-statement-multiple-cases-in-javascript
	const squarePuzzle = correspondsToSquarePuzzle(saveLoadModeId); 
	if (squarePuzzle) {
		actualFieldX = fieldXY;
		actualFieldY = fieldXY; 
	} else {
		actualFieldX = fieldX;
		actualFieldY = fieldY;
	}
	fieldX.disabled = squarePuzzle;
	fieldY.disabled = squarePuzzle;
	fieldXY.disabled = !squarePuzzle;
}
