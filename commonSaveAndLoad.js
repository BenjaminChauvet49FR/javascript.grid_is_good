// Many elements that are used by saving and loading. Does not contain input methods, though ! (see common input or the input in the puzzles/editors directly)

// ------------------------------------------

const SYMBOL_ID = { 
    WHITE: 'W',
    BLACK: 'B',
	LEFT_COMBINED: 'l',
	UP_COMBINED: 'u',
	RIGHT_COMBINED: 'r',
	DOWN_COMBINED: 'd'
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
	    wallArray : wallGridAnswer,
	    numberArray : numberGrid
	};
}

/**
This time, a wall grid is stocked and then, an array of one indication per region is stored.
Input : p_wallArray classic ; p_numbersArray = array of already aligned numbers, p_regionArray : array of region values
String output meaning :
X : one region is skipped.
XX : two regions are skipped.
X5 : five regions are skipped.
But what if the symbol has a name starting with X ? Well, a lower x will be added before.
*/
function puzzleRegionIndicationsToString(p_wallArray, p_numbersArray) {
	const regionGrid = WallGrid_data(p_wallArray).toRegionGrid(); // This assumes toRegionGrid() returns a double-entry array of region numbers ordered by "first spaces in lexical order" in lexical order.
	var regionsIndications = [];
	for(var iy = 0 ; iy < regionGrid.length ; iy++) {
		for(var ix = 0 ; ix < regionGrid[0].length; ix++) {
			if (regionGrid[iy][ix] == regionsIndications.length) {
				regionsIndications.push(p_numbersArray[iy][ix]);
			}
		}
	}
	const wallsString = wallArrayToString(p_wallArray);
	var regionString = "";
	var skippedRegions = 0;
	var value;
	for (var i = 0; i < regionsIndications.length ; i++) {
		value = regionsIndications[i];
		if (value == null) {
			skippedRegions++;
		} else {
			if (skippedRegions == 1) {
				regionString += " X";
			} else if (skippedRegions == 2) {
				regionString += " XX";
			} else if (skippedRegions >= 3) {
				regionString += " X"+skippedRegions;
			}
			regionString += " " + ((typeof(value) == "string" && value.charAt(0) == 'X') ? ('x' + value) : value); // No parentheses to circle the whole ternary (from "(typeof"  to ": value)" ) = small cap Xs everywhere.
			skippedRegions = 0;
		}
	}
	return wallsString + regionString;
}

// Output : {wallArray : (wallarray classique), indications : [{index, value}]
function stringToPuzzleRegionsIndications(p_string) {
	var stringArray = p_string.split(' ');
	var xLength = stringArray[0];
	var yLength = stringArray[1];
	var stringArray = p_string.split(' ');
	// Wrapper for compatibility with previous formats
	const wallGridAnswer = tokensToWallArray(stringArray.slice(0,3));
	var indications = [];
	var indexToken = 3;	
	var token;
	var regionIndex = 0;
	var value;
	while(indexToken < stringArray.length && stringArray[indexToken].length == 0) {
		indexToken++;
	}
	while (stringArray.length > indexToken) {
		token = stringArray[indexToken];
		if (token.charAt(0) == 'X') {
			if (token == "X") {
				// Region skipped ! 
			} else if (token == "XX") {
				regionIndex += 1; // and not 2 (because of regionIndex increment at end)
			} else {
				regionIndex += parseInt(token.substring(1), 10) - 1;
			}
		} else {
			if (token.startsWith("xX")) {
				value = token.subString(1);
			} else {
				value = token;
			}
			indications.push({index : regionIndex, value : value});			
		}
		regionIndex++;
		indexToken++; // This is the risk with while loops. 
	}
	return {
	    wallArray : wallGridAnswer,
	    indications : indications
	}
}

// Utilitary method with the retured item right above (wallArray, indications)
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
	    symbolArray : array
	};
}

/**
Transforms a space-representation string with only its width and height before into a numberArray 
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
	    numberArray : numberGrid = fillArrayWithTokensSpaces(stringArray.slice(2),numberGrid)
	}
}

/**
Returns the string to be contained in local storage (must be rectangular and non-empty) from the SB puzzle
X-empty ; 0 sides right and down open ; 1 side right closed ; 2 side down closed ; 3 side down closed.
p_grid : the grid to be stringed
*/
function starBattlePuzzleToString(p_grid,p_starBattleNumber){
	return p_starBattleNumber+" "+wallArrayToString(p_grid, {isSquare : true});
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
	return {
		wallArray : answerGrid, 
		starNumber : stars
	};
}

