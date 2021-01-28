const SYMBOL_ID = {
    WHITE: 'W',
    BLACK: 'B',
	LEFT_COMBINED: 'l',
	UP_COMBINED: 'u',
	RIGHT_COMBINED: 'r',
	DOWN_COMBINED: 'd',
	
}

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
*/
loadAction = function(p_canvas, p_drawer, p_solver, p_name) {
	const localStorageName = "grid_is_good_" + p_name;
	const loadedString = localStorage.getItem(localStorageName);
	if (loadedString) {
		loadPuzzle(p_canvas, p_drawer, p_solver, loadedString);
	} else {
        alert("Le stockage local n'a pas de propriété nommée '" + localStorageName + "'.");
    }
}

/**
Returns a name to store into / load from local storage
*/
function getLocalStorageName(p_name) {
	return "grid_is_good_"+p_name;
}

// ------------------------------------------

// Savers and loaders
// Note : for commodity, a saver has been associated with its loader rather than having all savers together and all loaders together

function commonPuzzleToString(p_wallArray,p_numbersArray,p_symbolsArray,p_symbolsToSave) {
	var wallsString = "";
	var rowsString = "";
	var spacesString = "";
	if (p_wallArray && (p_wallArray != null)) {
		wallsString = wallArrayToString(p_wallArray);
	}
	if (p_numbersArray && (p_numbersArray != null)) {
		spacesString = arrayToStringSpaces(p_numbersArray, false);
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

/*
p_symbolsArray : grid to save
p_symbolsToSave : list of symbols that should be saved (if any, otherwise the grid is saved directly)
*/
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
Transforms a space-representation string with only its width and height before into a gridnumber 
4 4 1 2 15 =>
....
....
.{15}..
....
*/
function stringToNurikabePuzzle(p_string) {
	var stringArray = p_string.split(' ');
	var xLength = stringArray[0];
	var yLength = stringArray[1];
	var numberGrid = generateSymbolArray(xLength,yLength);
	return {
	    gridNumber : numberGrid = fillArrayWithTokensSpaces(stringArray.slice(2),numberGrid)
	}
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

