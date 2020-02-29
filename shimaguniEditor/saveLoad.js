/**
Cf. StarBattle puzzles I guess
*/
function shimaguniPuzzleToString(p_wallArray,p_numbersArray){
	var yLength = p_wallArray.length; 
	var xLength = p_wallArray[0].length; 
	var gridChain = xLength+" "+yLength+" ";
	var numbersChain = "Numbers ";
	var valueSpace;
	for(var iy = 0;iy < yLength;iy++)
		for(var ix = 0;ix < xLength;ix++){
			if (p_wallArray[iy][ix].state == CLOSED){
				gridChain+='X';
			}
			else{
				valueSpace=0;
				if (p_wallArray[iy][ix].wallR == CLOSED){
					valueSpace+=1;
				}
				if (p_wallArray[iy][ix].wallD == CLOSED){
					valueSpace+=2;
				}
				gridChain+=valueSpace;
			}
			if (p_numbersArray[iy][ix] > 0){
				numbersChain+=(ix+" "+iy+" "+p_numbersArray[iy][ix]+" ");
			}
		}
	return gridChain+" "+numbersChain;
	//NOTE : there is a final "" after the last space of numbersChain when split by " ".
}

/**
Returns elements for the SB puzzle (grid + number of stars)
*/
function stringToShimaguniPuzzle(p_string){
	var stringArray = p_string.split(' ');
	var xLength = stringArray[0];
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
	}
	var indexToken = 4;
	while (indexToken < stringArray.length-2){
		numberGrid[parseInt(stringArray[indexToken+1],10)]
					[parseInt(stringArray[indexToken],10)] = parseInt(stringArray[indexToken+2],10);
		indexToken+=3;
	}
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