// Many elements that are used by saving and loading. Does not contain input methods, though ! (see common input or the input in the puzzles/editors directly)

// ------------------------------------------

const SYMBOL_ID = { 
    WHITE: 'W',
    BLACK: 'B'
}

/**
Returns a name to store into / load from local storage
*/
function getLocalStorageName(p_name) {
	return "grid_is_good_"+p_name;
}

// ------------------------------------------

function puzzleWallsOnlyToString(p_wallArray) {
	const streamDim = new StreamEncodingString64();
	streamDim.encode(p_wallArray[0].length);
	streamDim.encode(p_wallArray.length);
	return streamDim.getString() + " " + wallArrayToString64(p_wallArray);
}

function stringToPuzzleWallsOnly(p_string) {
	const tokens = p_string.split(" ");
	const streamDim = new StreamDecodingString64(tokens[0]);
	const xLength = streamDim.decode();
	const yLength = streamDim.decode();
	return {wallArray : string64toWallArray(tokens[1], xLength, yLength)}; // "wallArray" is necessary for updating fields in the editor, we cannot just return an array.
}

// Star battle is square and has a puzzle-related parameter.
function starBattlePuzzleToString(p_wallArray, p_numberStars) { 
	const streamParam = new StreamEncodingString64();
	streamParam.encode(p_numberStars);
	streamParam.encode(p_wallArray.length);
	return streamParam.getString() + " " + wallArrayToString64(p_wallArray);
}

function stringToStarBattlePuzzle(p_string) {
	const tokens = p_string.split(" ");
	const streamDim = new StreamDecodingString64(tokens[0]);
	const numberStars = streamDim.decode();
	const xyLength = streamDim.decode();
	return {wallArray : string64toWallArray(tokens[1], xyLength, xyLength), starNumber : numberStars}; // "wallArray" is necessary for updating fields in the editor, we cannot just return an array.
}

//Puzzle with regions indications. 1) dimensions, 2) grid, 3) indications for each region
function puzzleRegionsNumericIndicationsToString(p_wallArray, p_numbersArray) {
	const streamDim = new StreamEncodingString64();
	streamDim.encode(p_wallArray[0].length);
	streamDim.encode(p_wallArray.length);	
	const regionArray = WallGrid_data(p_wallArray).toRegionGrid(); // This assumes toRegionGrid() returns a double-entry array of region numbers ordered by "first spaces in lexical order" in lexical order.
	var regionsIndications = [];
	for(var iy = 0 ; iy < regionArray.length ; iy++) {
		for(var ix = 0 ; ix < regionArray[0].length; ix++) {
			if (regionArray[iy][ix] == regionsIndications.length) {
				regionsIndications.push(p_numbersArray[iy][ix]);
			}
		}
	}
	const streamRegion = new StreamEncodingSparseAny();
	for(var i = 0 ; i < regionsIndications.length ; i++) {
		streamRegion.encode(regionsIndications[i]);
	}
	return streamDim.getString() + " " + wallArrayToString64(p_wallArray) + " " + streamRegion.getString();
} //use example : puzzleRegionsNumericIndicationsToString(editorCore.wallGrid.array, editorCore.getGrid("NR").array)

function stringToPuzzleRegionsNumericIndications(p_string) {
	const tokens = p_string.split(" ");
	const streamDim = new StreamDecodingString64(tokens[0]);
	const xLength = streamDim.decode();
	const yLength = streamDim.decode();
	var indexRegions = [];
	const streamRegIndic = new StreamDecodingSparseAny(tokens[2]);
	var decodedValue = streamRegIndic.decode();
	var regionIndex = 0;
	while (decodedValue != END_OF_DECODING_STREAM) {
		if (decodedValue != null) {
			indexRegions.push({index : regionIndex, value : decodedValue});
		}
		regionIndex++;
		decodedValue = streamRegIndic.decode();
	} 
	return {wallArray : string64toWallArray(tokens[1], xLength, yLength), indications : indexRegions}; // "wallArray" is necessary for updating fields in the editor, we cannot just return an array.

} // Use example : stringToPuzzleRegionsNumericIndications("FF KqmqPUziHNhkBbwkl1ne463aQokwQkn10q6ckiQrjCQwIlgklnc5gQZcKdXHlzn7kmBL394 23-332--325_08_24-4_332--4_18--13")

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

function puzzleNumbersOnlyToString(p_numbersArray) {
	const streamDim = new StreamEncodingString64();
	streamDim.encode(p_numbersArray[0].length);
	streamDim.encode(p_numbersArray.length);
	const streamValues = new StreamEncodingSparseAny();
	for(var iy = 0 ; iy < p_numbersArray.length ; iy++) {
		for(var ix = 0 ; ix < p_numbersArray[0].length; ix++) {
			streamValues.encode(p_numbersArray[iy][ix]);
		}
	}
	return streamDim.getString() + " " + streamValues.getString();
}

function stringToPuzzleNumbersOnly(p_string) {
	const tokens = p_string.split(" ");
	const streamDim = new StreamDecodingString64(tokens[0]);
	const xLength = streamDim.decode();
	const yLength = streamDim.decode();
	const streamValues = new StreamDecodingSparseAny(tokens[1]);
	var answer = [];
	for(var iy = 0 ; iy < xLength ; iy++) {
		answer.push([]);
		for(var ix = 0 ; ix < xLength; ix++) {
			decode = streamValues.decode();
			if (decode != END_OF_DECODING_STREAM) {
				answer[iy].push(decode);
			}  else {
				answer[iy].push(null);
			}
		}
	}
	return {
	    numberArray : answer
	}
}

function limitedSymbolsWalllessPuzzleToString(p_symbolsArray, p_symbolsList) {
	const streamDim = new StreamEncodingString64();
	streamDim.encode(p_symbolsArray[0].length);
	streamDim.encode(p_symbolsArray.length);
	const streamValues = new StreamEncodingSparseBinary();
	var separator = "";
	var tokens = "";
	p_symbolsList.forEach(symbol => {
		for(var iy = 0 ; iy < p_symbolsArray.length ; iy++) {
			for(var ix = 0 ; ix < p_symbolsArray[0].length ; ix++) {
				streamValues.encode(p_symbolsArray[iy][ix] == symbol);
			}
		}
		tokens += separator + streamValues.getString();
		separator = "#";
	});
	return streamDim.getString() + " " + tokens;
}

function stringToLimitedSymbolsWalllessPuzzle(p_string, p_symbolsList) {
	const tokens = p_string.split(" ");
	const streamDim = new StreamDecodingString64(tokens[0]);
	const xLength = streamDim.decode();
	const yLength = streamDim.decode();
	const tokensSymbols = tokens[1].split("#");
	const answer = [];
	for(var iy = 0 ; iy < yLength ; iy++) {
		answer.push([]);
		for(var ix = 0 ; ix < xLength ; ix++) {
			answer[iy].push(null);
		}
	}
	var symbol;
	var streamPearl;
	for (var i = 0 ; i < p_symbolsList.length ; i++) {
		symbol = p_symbolsList[i];
		streamPearl = new StreamDecodingSparseBinary(tokensSymbols[i]);
		for(var iy = 0 ; iy < yLength ; iy++) {
			for(var ix = 0 ; ix < xLength ; ix++) {
				if (streamPearl.decode() == true) {
					answer[iy][ix] = symbol;
				}
			}
		}
	}
	return {symbolArray : answer};
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
Inspirated by puzzleRegionIndicationsToString - saves a spare puzzle with diverse values
*/
function puzzleLexicalSpacesToString(p_valuesArray) {
	const dimensionsString = p_valuesArray[0].length + " " + p_valuesArray.length;
	return dimensionsString + lexicalSpacesValuesToString(p_valuesArray);
}

function stringToLexicalSpacesPuzzle(p_string) { // This code will likely be moved somewhere else on the day its usage will be generalised
	const stringArray = p_string.split(' ');
	const xLength = stringArray[0];
	const yLength = stringArray[1];
	var indexToken = 2;	
	var token;
	var x = -1; // (x,y) = coordinates of "the spaces we were before putting a new non-null value". (see evolutions of x and y values below)
	var y = 0;
	var value;
	var spacesToSkip = 0;
	var array = [];
	for (var i = 0; i < yLength; i++) {
		array.push([]);
		for (var j = 0; j < xLength; j++) {
			array[i].push(null);
		}
	}
	while(indexToken < stringArray.length && stringArray[indexToken].length == 0) {
		indexToken++;
	}
	while (stringArray.length > indexToken) {
		token = stringArray[indexToken];
		if (token.charAt(0) == 'X') {
			if (token == "X") {
				spacesToSkip++;
			} else if (token == "XX") {
				spacesToSkip += 2;
			} else {
				spacesToSkip += parseInt(token.substring(1), 10);
			}
		} else {
			if (token.startsWith("xX")) {
				value = token.substring(1);
			} else {
				value = token;
			}
			x++;
			x += spacesToSkip;
			y += Math.floor(x / xLength);
			x %= xLength;
			array[y][x] = value;		
			spacesToSkip = 0;
		}
		indexToken++;
	}
	return {
	    valuesArray : array
	}
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