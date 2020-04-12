/**
This kinda matches SB puzzles
*/

function shimaguniPuzzleToString(p_wallArray,p_numbersArray){
	return wallArrayToString(p_wallArray)+" "+numberArrayToString(p_numbersArray,0);
}

function stringToShimaguniPuzzle(p_string){
	var stringArray = p_string.split(' ');
	/*var xLength = stringArray[0];
	var yLength = stringArray[1];
	var fieldString = stringArray[2];
	var wallGridAnswer = [];
	var numberGrid = [];
	for(iy=0;iy<yLength;iy++){
		wallGridAnswer.push([]);
		numberGrid.push([]);
		for(ix=0;ix<xLength;ix++){
			wallGridAnswer[iy].push(charToSpace(fieldString.charAt(ix+iy*xLength)));
			numberGrid[iy].push(0);
		}
	}*/
	var wallGridAnswer = tokensToWallArray(stringArray.slice(0,3));
	var xLength = stringArray[0];
	var yLength = stringArray[1];
	var numberGrid = tokensToNumberArray(stringArray.slice(3),xLength,yLength,0);
	
	/*var indexToken = 4;
	while (indexToken < stringArray.length-2){
		numberGrid[parseInt(stringArray[indexToken+1],10)]
					[parseInt(stringArray[indexToken],10)] = parseInt(stringArray[indexToken+2],10);
		indexToken+=3;
	}*/
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