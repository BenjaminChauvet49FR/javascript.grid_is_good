//TODO do something with that

/**
Returns the string to be contained in local storage (must be rectangular and non-empty) from the SB puzzle
X-empty ; 0 sides right and down open ; 1 side right closed ; 2 side down closed ; 3 side down closed.
p_grid : the grid to be stringed
*/
function starBattlePuzzleToString(p_grid,p_starBattleNumber){
	var xyLength = p_grid.length; //TODO on s'assure que la dimension en X est égale à celle en Y n'est ce pas ?
	var answer = xyLength+" "+p_starBattleNumber+" ";
	var valueSpace;
	for(var iy = 0;iy < xyLength;iy++)
		for(var ix = 0;ix < xyLength;ix++){
			if (p_grid[iy][ix].state == CLOSED){
				answer+='X';
			}
			else{
				valueSpace=0;
				if (p_grid[iy][ix].wallR == CLOSED){
					valueSpace+=1;
				}
				if (p_grid[iy][ix].wallD == CLOSED){
					valueSpace+=2;
				}
				answer+=valueSpace;
			}
		}
	return answer;
}

/**
Returns elements for the SB puzzle (grid + number of stars)
*/
function stringToStarBattlePuzzle(p_string){
	var stringArray = p_string.split(' ');
	var xyLength = stringArray[0];
	var stars= stringArray[1];
	var fieldString = stringArray[2];
	var answer = [];
	for(iy=0;iy<xyLength;iy++){
		answer.push([]);
		for(ix=0;ix<xyLength;ix++){
			answer[iy].push(charToSpace(fieldString.charAt(ix+iy*xyLength)));
		}
	}
	return {grid:answer,starNumber:stars};
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