function commonPuzzleToString(p_wallArray,p_numbersArray){
	return wallArrayToString(p_wallArray)+" "+numberArrayToString(p_numbersArray,0);
}

function stringToCommonPuzzle(p_string){
	var stringArray = p_string.split(' ');
	var wallGridAnswer = tokensToWallArray(stringArray.slice(0,3));
	var xLength = stringArray[0];
	var yLength = stringArray[1];
	var numberGrid = tokensToNumberArray(stringArray.slice(3),xLength,yLength,0);
	return {grid:wallGridAnswer,gridNumber:numberGrid};
}

/**
Returns the space that matches a char in unparsing function ('0123' => sides down-right = open/closed)
p_char : the desired char
*/
function charToSpace(p_char){
	switch(p_char){
		case('0'): return {state:OPEN,wallD:OPEN,wallR:OPEN};break;
		case('1'): return {state:OPEN,wallD:OPEN,wallR:CLOSED};break;
		case('2'): return {state:OPEN,wallD:CLOSED,wallR:OPEN};break;
		case('3'): return {state:OPEN,wallD:CLOSED,wallR:CLOSED};break;
		default : return {state:CLOSED,wallD:OPEN,wallR:OPEN};break;
	}
}

/**
Returns a name to store into / load from local storage
*/
function getLocalStorageName(p_name){
	return "grid_is_good_"+p_name;
}