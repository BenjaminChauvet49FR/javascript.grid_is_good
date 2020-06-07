const SYMBOL_ID = {
    WHITE: 'W',
    BLACK: 'B'
}

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
        if (p_kindId == PUZZLES_KIND.STAR_BATTLE.id) {
            puzzleToSave = starBattlePuzzleToString(p_editorCore.getWallArray(), p_externalOptions.numberStars);
        } else if (p_kindId == PUZZLES_KIND.MASYU_LIKE.id) {
            const grid = p_editorCore.getArray(GRID_ID.PEARL);
            puzzleToSave = commonPuzzleEmptyWallsToString(p_editorCore.getXLength(), p_editorCore.getYLength(), p_editorCore.getArray(GRID_ID.PEARL), [SYMBOL_ID.WHITE, SYMBOL_ID.BLACK]);
        } else {
            p_editorCore.alignToRegions(GRID_ID.NUMBER_REGION);
            puzzleToSave = commonPuzzleToString(p_editorCore.getWallArray(), p_editorCore.getArray(GRID_ID.NUMBER_REGION), null);
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
				loadedItem = stringToEmptyWallsPuzzle(localStorage.getItem(localStorageName));
				const gridPearl = loadedItem.gridSymbol;
				loadedItem.grid = generateWallArray(gridPearl[0].length, gridPearl.length); //TODO ".grid" ajouté par commodité puisque "updateFieldsAfterLoad" utilise cette propriété grid.
				p_editorCore.setupFromWallArray(loadedItem.grid);			
				p_editorCore.addGrid(GRID_ID.PEARL, gridPearl); 
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

// Note : for commodity, a saver has been associated with its loader rather than having all savers together and all loaders together

function commonPuzzleToString(p_wallArray,p_numbersArray,p_symbolsArray,p_symbolsToSave) {
	var wallsString = "";
	var rowsString = "";
	var spacesString = "";
	if (p_wallArray && (p_wallArray != null)) {
		wallsString = wallArrayToString(p_wallArray);
	}
	if (p_numbersArray && (p_numbersArray != null)) {
		spacesString = arrayToStringSpaces(p_numbersArray);
	}
	if (p_symbolsToSave) {
		p_symbolsToSave.forEach(symbol => {
			rowsString += symbol+" "+arrayToStringRows(p_symbolsArray,symbol);
		});
	}
	return wallsString+" "+spacesString+" "+rowsString;
}

function stringToWallAndNumbersPuzzle(p_string) {
	var stringArray = p_string.split(' ');
	// Wrapper for compatibility with previous formats
	const wallGridAnswer = tokensToWallArray(stringArray.slice(0,3));
	var xLength = stringArray[0];
	var yLength = stringArray[1];
	var numberGrid = generateSymbolArray(xLength,yLength);
	var indexToken = 3;	
	while(indexToken < stringArray.length && stringArray[indexToken].length == 0) {
		indexToken++;
	}
	if (stringArray.length > indexToken) {
		//Wrapping for compatibility with previous formats
		if (stringArray[indexToken].startsWith("Numbers")) {
			indexToken++;
		}
		numberGrid = fillArrayWithTokensSpaces(stringArray.slice(indexToken),numberGrid);
	}
	return {
	    grid: wallGridAnswer,
	    gridNumber: numberGrid
	};
}

function commonPuzzleEmptyWallsToString(p_xLength, p_yLength, p_symbolsArray, p_symbolsToSave) {
    var dimensionsString = p_xLength + " " + p_yLength + " "; //Spaces right
	var symbolsString = ""; //No spaces left/right
    var rowsString = ""; //Spaces left
    if (p_symbolsToSave) {
        p_symbolsToSave.forEach(symbol => {
			symbolsString += symbol;
            rowsString += " " + arrayToStringRows(p_symbolsArray, symbol);
        });
    }
    return dimensionsString + symbolsString + rowsString;
}

function stringToEmptyWallsPuzzle(p_string) {
	var stringArray = p_string.split(' ');
	var xLength = parseInt(stringArray[0],10);
	var yLength = parseInt(stringArray[1],10);
	var symbolsString = stringArray[2];
	var array = generateSymbolArray(xLength,yLength);
	var indexToken = 3;	
	while(indexToken < stringArray.length && stringArray[indexToken].length == 0) {
		indexToken++;
	}
	if (stringArray.length > indexToken) {
		for (var i = 0; i < symbolsString.length ; i++) {	
			filledArray = fillArrayWithTokensRows(stringArray.slice(), array, indexToken, symbolsString.charAt(i));
			array = filledArray.newArray;
			indexToken = filledArray.newIndexToken;
		}
	}
	return {
	    gridSymbol: array
	};
}

/**
Returns the string to be contained in local storage (must be rectangular and non-empty) from the SB puzzle
X-empty ; 0 sides right and down open ; 1 side right closed ; 2 side down closed ; 3 side down closed.
p_grid : the grid to be stringed
*/
function starBattlePuzzleToString(p_grid,p_starBattleNumber){
	return p_starBattleNumber+" "+wallArrayToString(p_grid,{isSquare:true});
}

/**
Returns elements for the SB puzzle (grid + number of stars)
*/
function stringToStarBattlePuzzle(p_string) {
	var stringArray = p_string.split(' ');
	// Wrapper avec les anciens puzzles qui mettaient le xy en premier. Désormais le nombre d'étoiles doit venir avant pour coller avec les méthodes de WallGrid.
	if (parseInt(stringArray[0]) > parseInt(stringArray[1])){
		var inter = stringArray[0];
		stringArray[0] = stringArray[1];
		stringArray[1] = inter;
	}
	var stars = stringArray[0];
	
	var answerGrid = tokensToWallArray(stringArray.slice(1,3),{isSquare : true});
	return {grid:answerGrid,starNumber:stars};
}

/**
Returns a name to store into / load from local storage
*/
function getLocalStorageName(p_name) {
	return "grid_is_good_"+p_name;
}