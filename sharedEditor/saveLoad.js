function commonPuzzleToString(p_wallArray,p_numbersArray){
	return wallArrayToString(p_wallArray)+" "+arrayToString(p_numbersArray,0);
}

function stringToCommonPuzzle(p_string){
	var stringArray = p_string.split(' ');
	var wallGridAnswer = tokensToWallArray(stringArray.slice(0,3));
	var xLength = stringArray[0];
	var yLength = stringArray[1];
	var numberGrid = null;
	if (stringArray.length > 3) {
	    numberGrid = tokensToArray(stringArray.slice(3), xLength, yLength, 0);
	}
	return {grid:wallGridAnswer,gridNumber:numberGrid};
}

/**
Returns the space that matches a char in unparsing function ('0123' => sides down-right = open/closed)
p_char : the desired char
*/
function charToSpace(p_char){
	switch(p_char){
		case('0'): return {state:WALLGRID.OPEN,wallD:WALLGRID.OPEN,wallR:WALLGRID.OPEN};break;
		case('1'): return {state:WALLGRID.OPEN,wallD:WALLGRID.OPEN,wallR:WALLGRID.CLOSED};break;
		case('2'): return {state:WALLGRID.OPEN,wallD:WALLGRID.CLOSED,wallR:WALLGRID.OPEN};break;
		case('3'): return {state:WALLGRID.OPEN,wallD:WALLGRID.CLOSED,wallR:WALLGRID.CLOSED};break;
		default : return {state:WALLGRID.CLOSED,wallD:WALLGRID.OPEN,wallR:WALLGRID.OPEN};break;
	}
}

/**
Returns a name to store into / load from local storage
*/
function getLocalStorageName(p_name){
	return "grid_is_good_"+p_name;
}