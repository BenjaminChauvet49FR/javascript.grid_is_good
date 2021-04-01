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
			p_editorCore.clear(GRID_ID.DIGIT_X_SPACE, p_x, p_y);
			p_editorCore.clear(GRID_ID.NUMBER_SPACE, p_x, p_y);
			p_editorCore.clear(GRID_ID.NUMBER_PEARL, p_x, p_y);
			p_editorCore.clear(GRID_ID.YAJILIN_LIKE, p_x, p_y);
		break;
		case (MODE_SELECTION_RECTANGLE.id) :
		    p_editorCore.selectRectangleMechanism(p_x, p_y);
		break;
		case (MODE_SYMBOLS_PROMPT.id) :
			var defaultToken = "";
			var descriptionPrompt = "";
			var gridId = "";
			var chainInPrompt = "";
			var validityTokenMethod = null;
			var parameters = {};
			if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_SPACE)) {
				descriptionPrompt = "Entrer valeur numérique >= 0";
				defaultToken = "1";
				gridId = GRID_ID.NUMBER_SPACE;
				validityTokenMethod = validityTokenNumber;
				parameters = {emptySpaceChar : "<", isMonoChar : false, isNumeric : true};
			} else if (p_editorCore.isVisibleGrid(GRID_ID.DIGIT_X_SPACE)) {
				descriptionPrompt = "Entrer un chiffre entre 0 et 4 ou X";
				defaultToken = "1";
				gridId = GRID_ID.DIGIT_X_SPACE;
				validityTokenMethod = validityNumberRangeOrSymbolClosure(0, 4, ["X"]);
				parameters = {emptySpaceChar : " ", isMonoChar : true, isNumeric : false};
			} else if (p_editorCore.isVisibleGrid(GRID_ID.NUMBER_REGION)) {
				descriptionPrompt = "Entrer valeur numérique >= 0";
				defaultToken = "1";
				gridId = GRID_ID.NUMBER_REGION;
				validityTokenMethod = validityTokenNumber;
				parameters = {emptySpaceChar : "<", isMonoChar : false, isNumeric : true};
				p_editorCore.insertChain("Entrer valeur numérique >= 0", GRID_ID.NUMBER_REGION, "1", validityTokenNumber, {emptySpaceChar : "<", isMonoChar : false, isNumeric : true}, p_x, p_y);
			} else if (p_editorCore.isVisibleGrid(GRID_ID.PEARL)) {
				descriptionPrompt = "Entrer suite de perles (B|W)";
				defaultToken = "W";
				gridId = GRID_ID.PEARL;
				validityTokenMethod = validityTokenPearl;
				parameters = {emptySpaceChar : " ", isMonoChar : true};
			} else if (p_editorCore.isVisibleGrid(GRID_ID.YAJILIN_LIKE)) {
				descriptionPrompt = "Entrer suite d'indices à la Yajilin (L|U|R|D)(nombre) ou X";
				defaultToken = "L1";
				gridId = GRID_ID.YAJILIN_LIKE;
				validityTokenMethod = validityTokenYajilin;
				parameters = {emptySpaceChar : "<", isMonoChar : false};
			}
			var defaultVal = p_editorCore.getPromptValue();
			if ((!defaultVal && (defaultVal != "0")) || (defaultVal == null) || (defaultVal == "")) {
				defaultVal = defaultToken;
			}
			optionalChain = (!parameters.isMonoChar) ? "(Penser à séparer les indices des caractères "+parameters.emptySpaceChar+" par des espaces) " : "";
			var clueChain = prompt(descriptionPrompt + " ou " + parameters.emptySpaceChar + " pour case vide "+optionalChain+":", defaultVal);
			p_editorCore.insertChain(gridId, clueChain, validityTokenMethod, parameters, p_x, p_y);
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
// Validity tokens

validityTokenNumber = function(p_clue) {
	return (!isNaN(p_clue));
}

validityNumberRangeOrSymbolClosure = function(p_min, p_max, p_symbol) {
	return function(p_clue) {
		if (!isNaN(p_clue)) {
			const number = parseInt(p_clue, 10);//p_clue == "X" || 
			return (p_min <= number) && (p_max >= number);
		} else {
			for (var i = 0; i < p_symbol.length ; i++) {
				if (p_clue == p_symbol[i]) {
					return true;
				}
			}
			return false;
		}
	}
}

validityTokenPearl = function(p_clue) {
	return (p_clue == "B") || (p_clue == "W");
}

validityTokenYajilin = function(p_clue) {
	const charClue = p_clue.charAt(0);
	if (charClue == 'X') {
		return true;
	}
	if (charClue == 'L' || charClue == 'U' || charClue == 'R' || charClue == 'D') {
		return ((p_clue.length > 1) && !isNaN(p_clue.substring(1)));
	}
	return false;
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
		Object.keys(GRID_ID).forEach(id => {
			editorCore.addCleanGrid(id, p_xLength, p_yLength); //  See GRID_ID in EditorCore
		});
		p_editorCore.addCleanGrid(GRID_ID.DIGIT_X_SPACE, p_xLength, p_yLength);
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
		adaptCanvasAndGrid(p_canvas, p_drawer, p_editorCore);	
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

function actionMoveSelection(p_editorCore, p_xValue, p_yValue) {
	actionMoveCopySelection(p_editorCore, p_xValue, p_yValue, true, "Déplacer", " ainsi ?");
}

function actionCopySelection(p_editorCore, p_xValue, p_yValue) {
	actionMoveCopySelection(p_editorCore, p_xValue, p_yValue, false, "Copier", "vers la destination ?");
}

function actionMoveCopySelection(p_editorCore, p_xValue, p_yValue, p_mode, p_verb, p_part2) {
	const number = p_editorCore.countSpacesSelection();
	if (number > 0 && (p_xValue != 0 || p_yValue != 0)) {
		const confirmString1 = p_verb + number + " case"+ (number > 1 ? "s" : "") + p_part2 + " ainsi ?";
		const confirmString2 = (p_xValue != 0) ? ("\n -> " + Math.abs(p_xValue)+" vers la " + (p_xValue > 0 ? "droite" : "gauche")) : "";
		const confirmString3 = (p_yValue != 0) ? ("\n -> " + Math.abs(p_yValue)+" vers le " + (p_yValue > 0 ? "bas" : "haut")) : "";
		if (confirm(confirmString1 + confirmString2 + confirmString3)) {
			p_editorCore.moveCopySelection(p_xValue, p_yValue, p_mode);
		}
	} else {
		alert("Aucune case sélectionnée ou aucun déplacement.");
	}
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

// TODO : potentially create a constant for "grid_is_good".
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
	WALLS_ONLY : {id : 1},
	REGIONS_NUMERICAL_INDICATIONS : {id:2},
	NUMBERS_ONLY : {id:3},
	CURVING_ROAD : {id:4},
	MASYU : {id:5},
	REGIONS_NUMBERS : {id:6},
	NUMBERS_X_ONLY : {id:7},
	YAJILIN_LIKE : {id:8},
	STAR_BATTLE : {id:1001, squareGrid : true},
	GRAND_TOUR : {id:99102},
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
        var puzzleToSaveString = "";
		p_editorCore.cleanRedundantWalls();
		
        if (p_kindId == PUZZLES_KIND.STAR_BATTLE.id) {
            puzzleToSaveString = starBattlePuzzleToString(p_editorCore.getWallArray(), p_externalOptions.numberStars);
        } else if (p_kindId == PUZZLES_KIND.MASYU.id) {
            puzzleToSaveString = limitedSymbolsWalllessPuzzleToString(p_editorCore.getArray(GRID_ID.PEARL), [SYMBOL_ID.WHITE, SYMBOL_ID.BLACK]);
        } else if (p_kindId == PUZZLES_KIND.CURVING_ROAD.id) {
            puzzleToSaveString = limitedSymbolsWalllessPuzzleToString(p_editorCore.getArray(GRID_ID.PEARL), [SYMBOL_ID.WHITE]);
		} else if (p_kindId == PUZZLES_KIND.NUMBERS_ONLY.id) {
            puzzleToSaveString = numbersOnlyPuzzleToString(p_editorCore.getArray(GRID_ID.NUMBER_SPACE));
        } else if (p_kindId == PUZZLES_KIND.NUMBERS_X_ONLY.id) {
            puzzleToSaveString = puzzleNumbersSymbolsToString(p_editorCore.getArray(GRID_ID.DIGIT_X_SPACE), ["X"]);
        } else if (p_kindId == PUZZLES_KIND.YAJILIN_LIKE.id) {
            puzzleToSaveString = arrowNumberCombinationsPuzzleToString(p_editorCore.getArray(GRID_ID.YAJILIN_LIKE));
        } else if (p_kindId == PUZZLES_KIND.REGIONS_NUMBERS.id) {
			puzzleToSaveString = wallsNumbersPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.NUMBER_SPACE));
		} else if (p_kindId == PUZZLES_KIND.REGIONS_NUMERICAL_INDICATIONS.id) {
			p_editorCore.alignToRegions(GRID_ID.NUMBER_REGION);
			puzzleToSaveString = regionsNumericIndicationsPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.NUMBER_REGION));
        } else {
			puzzleToSaveString = wallsOnlyPuzzleToString(p_editorCore.getWallArray());
		}
        localStorage.setItem(localStorageName, puzzleToSaveString);
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
				p_editorCore.setupFromWallArray(loadedItem.wallArray);			
			} 
			else if (p_kindId == PUZZLES_KIND.MASYU.id){
				loadedItem = stringToLimitedSymbolsWalllessPuzzle(localStorage.getItem(localStorageName), [SYMBOL_ID.WHITE, SYMBOL_ID.BLACK]);
				const gridPearl = loadedItem.symbolArray;
				loadedItem.wallArray = generateWallArray(gridPearl[0].length, gridPearl.length); // ".wallGrid" property added to suit the updateFieldsAfterLoad method .
				p_editorCore.setupFromWallArray(loadedItem.wallArray);
				p_editorCore.addGrid(GRID_ID.PEARL, gridPearl); 
			} 
			else if (p_kindId == PUZZLES_KIND.CURVING_ROAD.id){
				loadedItem = stringToLimitedSymbolsWalllessPuzzle(localStorage.getItem(localStorageName), [SYMBOL_ID.WHITE]);
				const gridPearl = loadedItem.symbolArray;
				loadedItem.wallArray = generateWallArray(gridPearl[0].length, gridPearl.length); // ".wallGrid" property added to suit the updateFieldsAfterLoad method .
				p_editorCore.setupFromWallArray(loadedItem.wallArray);
				p_editorCore.addGrid(GRID_ID.PEARL, gridPearl); 
			} 
			else if (p_kindId == PUZZLES_KIND.NUMBERS_ONLY.id){
				loadedItem = stringToNumbersOnlyPuzzle(localStorage.getItem(localStorageName));
				const gridNumber = loadedItem.numberArray;
				loadedItem.wallArray = generateWallArray(gridNumber[0].length, gridNumber.length); 
				p_editorCore.setupFromWallArray(loadedItem.wallArray);
				p_editorCore.addGrid(GRID_ID.NUMBER_SPACE, gridNumber); 
			} 
			else if (p_kindId == PUZZLES_KIND.NUMBERS_X_ONLY.id){
				loadedItem = stringToNumbersSymbolsPuzzle(localStorage.getItem(localStorageName), ["X"]);
				const gridNumber = loadedItem.numbersSymbolsArray;
				loadedItem.wallArray = generateWallArray(gridNumber[0].length, gridNumber.length); 
				p_editorCore.setupFromWallArray(loadedItem.wallArray);
				p_editorCore.addGrid(GRID_ID.DIGIT_X_SPACE, gridNumber); 
			} 
			else if (p_kindId == PUZZLES_KIND.YAJILIN_LIKE.id) {
				loadedItem = stringToArrowNumberCombinationsPuzzle(localStorage.getItem(localStorageName));
				const values = loadedItem.combinationsArray;
				loadedItem.wallArray = generateWallArray(values[0].length, values.length); 
				p_editorCore.setupFromWallArray(loadedItem.wallArray);			
				p_editorCore.addGrid(GRID_ID.YAJILIN_LIKE, values);
			} 
			else if (p_kindId == PUZZLES_KIND.REGIONS_NUMBERS.id) {
				loadedItem = stringToWallsNumbersPuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.wallArray);			
				p_editorCore.addGrid(GRID_ID.NUMBER_SPACE,loadedItem.numberArray); 
			} 
			else if (p_kindId == PUZZLES_KIND.REGIONS_NUMERICAL_INDICATIONS.id) {
				loadedItem = stringToRegionsNumericIndicationsPuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.wallArray);
				regionIndicArray = getRegionIndicArray(loadedItem);			; 
				p_editorCore.addGrid(GRID_ID.NUMBER_REGION, regionIndicArray);
			}
			else {
				loadedItem = stringToWallsOnlyPuzzle(localStorage.getItem(localStorageName));
				p_editorCore.setupFromWallArray(loadedItem.wallArray);
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
    p_fieldsToUpdate.xLengthField.value = p_loadedItem.wallArray[0].length;
    p_fieldsToUpdate.yLengthField.value = p_loadedItem.wallArray.length;
	if (p_loadedItem.starNumber) {
		p_fieldsToUpdate.numberStarsField.value = p_loadedItem.starNumber;
	}
}

//How to use the change of a combobox. Credits : https://www.scriptol.fr/html5/combobox.php
function comboChange(p_thelist, p_editorCore) {
    var idx = p_thelist.selectedIndex;
    var content = p_thelist.options[idx].innerHTML;
	// Default options
	p_editorCore.setWallsOn();
	// Specific options
    switch (content) {
		case 'CurvingRoad' : 
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.CURVING_ROAD.id;
			p_editorCore.setVisibleGrids([GRID_ID.PEARL]);
			break;
		case 'Masyu':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.MASYU.id;
			p_editorCore.setVisibleGrids([GRID_ID.PEARL]);
			break;
		case 'Koburin': case 'Usotatami':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.NUMBERS_ONLY.id;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_SPACE]);
			break;
		case 'Chocona': case 'CountryRoad': case 'Heyawake': case 'Shimaguni' :
			saveLoadModeId = PUZZLES_KIND.REGIONS_NUMERICAL_INDICATIONS.id;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_REGION]);
			break;
		case 'Hakyuu':
			saveLoadModeId = PUZZLES_KIND.REGIONS_NUMBERS.id;
			p_editorCore.setVisibleGrids([GRID_ID.NUMBER_SPACE]);
			break;
		case 'SternenSchlacht':
			saveLoadModeId = PUZZLES_KIND.STAR_BATTLE.id;
			p_editorCore.maskAllGrids();
			break;
		case 'Shugaku':
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.NUMBERS_X_ONLY.id;
			p_editorCore.setVisibleGrids([GRID_ID.DIGIT_X_SPACE]);
			break;
		case 'Yajilin': // Can also include Yajisan-Kazusan
			p_editorCore.setWallsOff();
			saveLoadModeId = PUZZLES_KIND.YAJILIN_LIKE.id;
			p_editorCore.setVisibleGrids([GRID_ID.YAJILIN_LIKE]);
			break;
		default: // norinori, lits, entryExit... no numbers, only regions
			saveLoadModeId = PUZZLES_KIND.WALLS_ONLY.id;
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

// Utilitary method to get from an item with wallarray and regionIndications (list of {index, value} items) a number array
function getRegionIndicArray(p_loadedItem) {
	const regionArray = WallGrid_data(p_loadedItem.wallArray).toRegionGrid(); // This supposes toRegionGrid() returns a double-entry array of region numbers ordered by "first spaces in lexical order" in lexical order.
	var regionIndicArray = [];
	var nextIndex = (p_loadedItem.indications.length > 0 ? p_loadedItem.indications[0].index : -1);
	var indicIndex = 0;
	for(var iy = 0 ; iy < regionArray.length ; iy++) {
		regionIndicArray.push([]);
		for(var ix = 0 ; ix < regionArray[0].length; ix++) {
			if ((nextIndex == regionArray[iy][ix]) && nextIndex != -1) {
				regionIndicArray[iy].push(parseInt(p_loadedItem.indications[indicIndex].value, 10));
				indicIndex++;
				if (indicIndex != p_loadedItem.indications.length) {
					nextIndex = p_loadedItem.indications[indicIndex].index;
				} else {
					nextIndex = -1;
				}
			} else {
				regionIndicArray[iy].push(null);
			}
		}
	}
	return regionIndicArray;
}

// --------------------

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