// Many elements that are used by saving and loading. Does not contain input methods, though ! (see common input or the input in the puzzles/editors directly)

// ------------------------------------------

const SYMBOL_ID = { 
    WHITE: 'W',
    BLACK: 'B',
	ROUND: 'R',
	SQUARE: 'S',
	TRIANGLE: 'T'
}

/**
Returns a name to store into / load from local storage
*/
function getLocalStorageName(p_puzzleName, p_name) {
	return "grid_is_good_" + p_puzzleName + p_name;
}

// ------------------------------------------
// All "new" (as to beginning March 2021) puzzle save and load methods

// First, some functions used several times
function dimensionsToString(p_array) {
	const streamDim = new StreamEncodingString64();
	streamDim.encode(p_array[0].length);
	streamDim.encode(p_array.length);
	return streamDim.getString();
}

function stringToDimensions(p_string) {
	const streamDim = new StreamDecodingString64(p_string);
	const xLength = streamDim.decode();
	const yLength = streamDim.decode();
	return {xLength : xLength, yLength : yLength}
}

function monoValueToString(p_value) {
	const streamParam = new StreamEncodingString64();
	streamParam.encode(p_value); 
	return streamParam.getString();
}

function stringToMonoValue(p_string) {
	return (new StreamDecodingString64(p_string)).decode();
}

function symbolsArrayToString(p_symbolsArray, p_symbolsList) {
	var separator = "";
	var answer = "";
	const streamValues = new StreamEncodingSparseBinary();
	p_symbolsList.forEach(symbol => {
		for(var iy = 0 ; iy < p_symbolsArray.length ; iy++) {
			for(var ix = 0 ; ix < p_symbolsArray[0].length ; ix++) {
				streamValues.encode(p_symbolsArray[iy][ix] == symbol);
			}
		}
		answer += separator + streamValues.getString();
		separator = "#";
	});
	return answer;
}

function stringToSymbolsArray(p_string, p_xLength, p_yLength, p_symbolsList) {
	const tokensSymbols = p_string.split("#");
	const answer = [];
	for(var iy = 0 ; iy < p_yLength ; iy++) {
		answer.push([]);
		for(var ix = 0 ; ix < p_xLength ; ix++) {
			answer[iy].push(null);
		}
	}
	return fillArrayWithSymbols(answer, p_string, p_xLength, p_yLength, p_symbolsList);
}

function fillArrayWithSymbols(p_array, p_string, p_xLength, p_yLength, p_symbolsList) {
	var symbol;
	var streamSymbol;
	const tokensSymbols = p_string.split("#");
	for (var i = 0 ; i < p_symbolsList.length ; i++) {
		symbol = p_symbolsList[i];
		streamSymbol = new StreamDecodingSparseBinary(tokensSymbols[i]);
		for(var iy = 0 ; iy < p_yLength ; iy++) {
			for(var ix = 0 ; ix < p_xLength ; ix++) {
				if (streamSymbol.decode() == true) {
					p_array[iy][ix] = symbol;
				}
			}
		}
	}
	return p_array;
}

/**
If the array contains non-number non-null values, treat them as null
*/
function numbersArrayToString(p_numbersArray, p_numbersAreStrings) {
	return numberAndIgnoreClosedArraysToString(p_numbersArray, null, p_numbersAreStrings);
}

// Builds a number array from a string
function stringToNumberArray(p_string, p_xLength, p_yLength, p_numbersAreStrings) {
	return stringToNumberArrayWithSomeSpacesIgnored(p_string, p_xLength, p_yLength, null, p_numbersAreStrings);
}

function numberAndIgnoreClosedArraysToString(p_numbersArray, p_wallArray, p_numbersAreStrings) {
	const streamValues = new StreamEncodingSparseAny();
	for(var iy = 0 ; iy < p_numbersArray.length ; iy++) {
		for(var ix = 0 ; ix < p_numbersArray[0].length; ix++) {
			if (p_wallArray == null || p_wallArray[iy][ix].state != WALLGRID.CLOSED) {
				if (!isNaN(p_numbersArray[iy][ix])) {
					if (p_numbersAreStrings) {
						if ((p_numbersArray[iy][ix] == null) || (p_numbersArray[iy][ix] == "") || (p_numbersArray[iy][ix].charAt(0) == " ")) { // yeah, isNaN(null), isNaN("") and isNaN(" ") are false
							streamValues.encode(null); 
						} else {
							streamValues.encode(parseInt(p_numbersArray[iy][ix], 10));
						}
					} else {
						streamValues.encode(p_numbersArray[iy][ix]); // Note : maybe this habit of nullifying NaN characters will perdure, who knows ?
					}
				} else {
					streamValues.encode(null); 
				}	
			}
		}
	}
	return streamValues.getString();
}

function stringToNumberArrayWithSomeSpacesIgnored(p_string, p_xLength, p_yLength, p_wallArray, p_numbersAreStrings) {
	const streamValues = new StreamDecodingSparseAny(p_string);
	var answer = [];
	for(var iy = 0 ; iy < p_yLength ; iy++) {
		answer.push([]);
		for(var ix = 0 ; ix < p_xLength ; ix++) {
			if ((p_wallArray == null || p_wallArray[iy][ix].state != WALLGRID.CLOSED)) {
				decode = streamValues.decode();
				if ((decode != null) && (!isNaN(decode)) && decode != END_OF_DECODING_STREAM) { // Well, isNan(null) = true
					if (p_numbersAreStrings) {
						answer[iy].push(""+decode);
					} else {
						answer[iy].push(decode);
					}
				}  else {
					answer[iy].push(null);
				}
			} else {
				answer[iy].push(null);
			}
		}
	}
	return answer;
}

// Returns a string where the first and 4th arrays are reversed, while the 2nd and 3rd arrays are straight, 
// Contextually, margins of a grid are run in clockwise order starting at down-left.
// Null arrays are skipped, otherwise they are encoded according to their length (no obscure conventions with xLength or yLength)
function numericBeltToString (p_arrayLeft, p_arrayUp, p_arrayRight, p_arrayDown) {
	const streamBelt = new StreamEncodingSparseAny();
	if (p_arrayLeft != null) {
		for (var i = p_arrayLeft.length-1; i >= 0 ; i--) {
			streamBelt.encode(p_arrayLeft[i]);
		}
	}
	if (p_arrayUp != null) {
		for (var i = 0 ; i < p_arrayUp.length ; i++) {
			streamBelt.encode(p_arrayUp[i]);
		}
	}
	if (p_arrayRight != null) {
		for (var i = 0 ; i < p_arrayRight.length ; i++) {
			streamBelt.encode(p_arrayRight[i]);
		}
	}
	if (p_arrayDown != null) {
		for (var i = p_arrayDown.length-1; i >= 0 ; i--) {
			streamBelt.encode(p_arrayDown[i]);
		}
	}
	return streamBelt.getString();
}

// All arrays are top to bottom or left to right
function stringToNumericBelt (p_string, p_xLength, p_yLength, p_leftAvailable, p_upAvailable, p_rightAvailable, p_downAvailable) {
	const streamBelt = new StreamDecodingSparseAny(p_string);
	var answerLeft, answerUp, answerRight, answerDown;
	var val;
	if (p_leftAvailable) {
		answerLeft = [];
		for (var i = 0 ; i < p_yLength ; i++) {		
			val = streamBelt.decode();
			if (val == END_OF_DECODING_STREAM) { val = null; }
			answerLeft.push(val);
		}
		answerLeft.reverse(); // Credits for reversing an array : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
	} else {
		answerLeft = null;
	}
	if (p_upAvailable) {
		answerUp = [];
		for (var i = 0 ; i < p_xLength ; i++) {		
			val = streamBelt.decode();
			if (val == END_OF_DECODING_STREAM) { val = null; }
			answerUp.push(val); // TODO too bad (answerLeft.push(streamBelt.decode())) has a risk of END_OF_DECODING_STREAM... change that !
		}
	} else {
		answerUp = null;
	}
	if (p_rightAvailable) {
		answerRight = [];
		for (var i = 0 ; i < p_yLength ; i++) {		
			val = streamBelt.decode();
			if (val == END_OF_DECODING_STREAM) { val = null; }
			answerRight.push(val);
		}
	} else {
		answerRight = null;
	}
	if (p_downAvailable) {
		answerDown = [];
		for (var i = 0 ; i < p_xLength ; i++) {		
			val = streamBelt.decode();
			if (val == END_OF_DECODING_STREAM) { val = null; }
			answerDown.push(val); 
		}
		answerDown.reverse();
	} else {
		answerDown = null;
	}
	return {left : answerLeft, up : answerUp, right : answerRight, down : answerDown}
}

//----------------------------------------------------------------------------------------------------------------

// Now to the savers/loaders themselves !
function wallsOnlyPuzzleToString(p_wallArray) {
	return dimensionsToString(p_wallArray) + " " + wallArrayToString64(p_wallArray);
}

function stringToWallsOnlyPuzzle(p_string) {
	const tokens = p_string.split(" ");
	const dims = stringToDimensions(tokens[0]);
	return {wallArray : string64toWallArray(tokens[1], dims.xLength, dims.yLength)}; // "wallArray" is necessary for updating fields in the editor, we cannot just return an array.
}

//----
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

//----
//Puzzle with regions indications. 1) dimensions, 2) grid, 3) indications for each region
function regionsNumericIndicationsPuzzleToString(p_wallArray, p_numbersArray) {
	const regionArray = WallGrid_data(p_wallArray).toRegionArray(); // This assumes toRegionArray() returns a double-entry array of region numbers ordered by "first spaces in lexical order" in lexical order.
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
	return dimensionsToString(p_wallArray) + " " + wallArrayToString64(p_wallArray) + " " + streamRegion.getString();
} //use example : regionsNumericIndicationsPuzzleToString(editorCore.wallGrid.array, editorCore.getGrid("NR").array)

function stringToRegionsNumericIndicationsPuzzle(p_string) {
	const tokens = p_string.split(" ");
	const dims = stringToDimensions(tokens[0]);
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
	return {wallArray : string64toWallArray(tokens[1], dims.xLength, dims.yLength), indications : indexRegions}; // "wallArray" is necessary for updating fields in the editor, we cannot just return an array.

} // Use example : stringToRegionsNumericIndicationsPuzzle("FF KqmqPUziHNhkBbwkl1ne463aQokwQkn10q6ckiQrjCQwIlgklnc5gQZcKdXHlzn7kmBL394 23-332--325_08_24-4_332--4_18--13")

//----
// No walls, only numbers
function numbersOnlyPuzzleToString(p_numbersArray) {
	return dimensionsToString(p_numbersArray) + " " + numbersArrayToString(p_numbersArray);
}

// Building an array with only null and numbers 
function stringToNumbersOnlyPuzzle(p_string) {
	const tokens = p_string.split(" ");
	const dim = stringToDimensions(tokens[0]);
	return {
	    numberArray : stringToNumberArray(tokens[1], dim.xLength, dim.yLength)
	}
}

//----
// Wall-less and limited different symbols
function limitedSymbolsWalllessPuzzleToString(p_symbolsArray, p_symbolsList) {
	return dimensionsToString(p_symbolsArray) + " " + symbolsArrayToString(p_symbolsArray, p_symbolsList);
}

function stringToLimitedSymbolsWalllessPuzzle(p_string, p_symbolsList) {
	const tokens = p_string.split(" ");
	const dims = stringToDimensions(tokens[0]);
	return {symbolArray : stringToSymbolsArray(tokens[1], dims.xLength, dims.yLength, p_symbolsList)};
}

//----
// Numbers and symbols (potentially X). IMPORTANT : All non-null spaces are strings, including numbers !
function puzzleNumbersSymbolsToString(p_numbersSymbolsArray, p_symbolsList) {
	return dimensionsToString(p_numbersSymbolsArray) + " " + numbersArrayToString(p_numbersSymbolsArray, true) + " " + symbolsArrayToString(p_numbersSymbolsArray, p_symbolsList);
}

function stringToNumbersSymbolsPuzzle(p_string, p_symbolsList) {
	const tokens = p_string.split(" ");
	const dims = stringToDimensions(tokens[0]);
	numbersSymbolsArray = stringToNumberArray(tokens[1], dims.xLength, dims.yLength, true);
	return {numbersSymbolsArray : fillArrayWithSymbols(numbersSymbolsArray, tokens[2], dims.xLength, dims.yLength, p_symbolsList)};
}

//----
// Walls and numbers in spaces
function wallsNumbersPuzzleToString(p_wallArray, p_numbersArray) {
	return dimensionsToString(p_wallArray) + " " + wallArrayToString64(p_wallArray) + " " + numbersArrayToString(p_numbersArray);
}

function stringToWallsNumbersPuzzle(p_string) {
	const tokens = p_string.split(" ");
	const dims = stringToDimensions(tokens[0]);
	return {
		wallArray : string64toWallArray(tokens[1], dims.xLength, dims.yLength),
		numberArray : stringToNumberArray(tokens[2], dims.xLength, dims.yLength)
	};
}

//----
// Yajilin and so grids
// Grid must consist of Xs and "Ld|Ud|Rd|Dd" where d is a number

function arrowNumberCombinationsPuzzleToString(p_symbolsArray) {
	var value;
	var streamSpaces = new StreamEncodingSparseAny();
	for (var y = 0 ; y < p_symbolsArray.length ; y++) {
		for (var x = 0 ; x < p_symbolsArray[0].length ; x++) {
			mod = -1;
			if (null == p_symbolsArray[y][x]) {
				value = null;
			} else switch(p_symbolsArray[y][x].charAt(0)) {
				case "X" : value = 0; break;
				case "L" : mod = 1; break;
				case "U" : mod = 2; break;
				case "R" : mod = 3; break;
				case "D" : mod = 4; break;
				default : value = null; break;
			}
			if (mod > 0) {
				value = mod + 4 * (parseInt(p_symbolsArray[y][x].substring(1), 10));
			}
			streamSpaces.encode(value);
		}
	}
	
	return dimensionsToString(p_symbolsArray) + " " + streamSpaces.getString();
}

function stringToArrowNumberCombinationsPuzzle(p_string) {
	const tokens = p_string.split(" ");
	const dims = new stringToDimensions(tokens[0]);
	const stream = new StreamDecodingSparseAny(tokens[1]);
	var character;
	var decode;
	var array = [];
	for (var y = 0; y < dims.yLength ; y++) {
		array.push([]);
		for (var x = 0 ; x < dims.xLength ; x++) {
			decode = stream.decode();
			if (decode == null || decode == END_OF_DECODING_STREAM) {
				array[y].push(null);
			} else if (decode == 0) {
				array[y].push("X");
			} else {
				switch (decode % 4) {
					case 1 : character = "L"; break;
					case 2 : character = "U"; break;
					case 3 : character = "R"; break;
					default : character = "D"; break;
				}
				array[y].push(character + Math.floor((decode - 1)/4));
			}
		}
	}
	return {combinationsArray : array};
}

// ---------------
// Stitches puzzle

function stitchesPuzzleToString(p_wallArray, p_edgeLeft, p_edgeUp, p_numberBounds) { 
	const streamParam = new StreamEncodingString64();
	streamParam.encode(p_numberBounds);
	streamParam.encode(p_wallArray[0].length);
	streamParam.encode(p_wallArray.length);
	return streamParam.getString() + " " + wallArrayToString64(p_wallArray) + " " + numericBeltToString(p_edgeLeft, p_edgeUp);
}

function stringToStitchesPuzzle(p_string) {
	const tokens = p_string.split(" ");
	const streamParam = new StreamDecodingString64(tokens[0]);
	const numberBounds = streamParam.decode();
	const xLength = streamParam.decode();
	const yLength = streamParam.decode();
	const belt = stringToNumericBelt(tokens[2], xLength, yLength, true, true, false, false);
	return {wallArray : string64toWallArray(tokens[1], xLength, yLength), 
	boundNumber : numberBounds,
	marginLeft : belt.left,
	marginUp : belt.up}; // "wallArray" is necessary for updating fields in the editor, we cannot just return an array.
}

// ---------------
// Square puzzle with nothing but rounding indications
function marginOneLeftUpNumbersSquarePuzzleToString(p_marginLeft, p_marginUp, p_marginRight, p_marginDown) {
	return monoValueToString(p_marginLeft.length) + " " + numericBeltToString(p_marginLeft, p_marginUp);
}

function stringToMarginOneLeftUpNumbersSquarePuzzle(p_string) {
	const tokens = p_string.split(" ");
	const dim = stringToMonoValue(tokens[0]);
	const belt = stringToNumericBelt(tokens[1], dim, dim, true, true, false, false);
	return {marginLeft : belt.left,
			marginUp : belt.up};
}

// ---------------
// Tapa 

function tapaPuzzleToString(p_symbolsArray) {
	var value;
	var symbolArray;
	var streamSpaces = new StreamEncodingSparseAny();
	for (var y = 0 ; y < p_symbolsArray.length ; y++) {
		for (var x = 0 ; x < p_symbolsArray[0].length ; x++) {
			if (p_symbolsArray[y][x] == null) {
				streamSpaces.encode(null);
			} else {
				streamSpaces.encode(indexTapaCombination(p_symbolsArray[y][x]));
			}
		}
	}
	return dimensionsToString(p_symbolsArray) + " " + streamSpaces.getString();
}

function stringToTapaPuzzle(p_string) {
	const tokens = p_string.split(" ");
	const dims = new stringToDimensions(tokens[0]);
	const stream = new StreamDecodingSparseAny(tokens[1]);
	var character;
	var decode;
	var array = [];
	for (var y = 0; y < dims.yLength ; y++) {
		array.push([]);
		for (var x = 0 ; x < dims.xLength ; x++) {
			decode = stream.decode();
			if (decode == null || decode == END_OF_DECODING_STREAM) {
				array[y].push(null);
			} else {
				array[y].push(TAPA_COMBINATIONS[decode]);
			}
		}
	}
	return {combinationsArray : array};
}

// ---------------
// Sudoku

function sudokuPuzzleToString(p_numbersArray, p_wallArray) {
	return numberAndIgnoreClosedArraysToString(p_numbersArray, p_wallArray);
} 

function stringToSudokuPuzzle(p_string, p_wallArray) {
	return {
	    numberArray : stringToNumberArrayWithSomeSpacesIgnored(p_string, p_wallArray[0].length, p_wallArray.length, p_wallArray, false)
	}
}

// ----------------
// Limited symbols AND walls

function limitedSymbolsWallsPuzzleToString(p_wallArray, p_symbolsArray, p_symbolsList) {
	return wallsOnlyPuzzleToString(p_wallArray ) + " " + symbolsArrayToString(p_symbolsArray, p_symbolsList);
}

function stringToLimitedSymbolsWallsPuzzle(p_string, p_symbolsList) {
	const tokens = p_string.split(" ");
	const dims = stringToDimensions(tokens[0]);
	return {wallArray : string64toWallArray(tokens[1], dims.xLength, dims.yLength), 
			symbolArray : stringToSymbolsArray(tokens[2], dims.xLength, dims.yLength, p_symbolsList)}
}