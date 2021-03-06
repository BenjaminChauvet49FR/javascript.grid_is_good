/**
Returns the string to wallGrid format to be contained in local storage (must be rectangular and non-empty)
X-empty ; 0 sides right and down open ; 1 side right closed ; 2 side down closed ; 3 side down closed.
p_grid : the grid to be stringed
*/
function wallGridToString(p_grid){
	var yLength = p_grid.length;
	var xLength = p_grid[0].length;
	var answer = yLength+" "+xLength+" ";
	var valueSpace;
	for(var iy = 0;iy < yLength;iy++)
		for(var ix = 0;ix < xLength;ix++){
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
Returns the wallGrid from the string if it was previously serialized with the appropriate function gridToString
p_string : the string to be turned into a grid
*/
function stringToWallGrid(p_string){
	var stringArray = p_string.split(' ');
	var yLength = stringArray[0];
	var xLength = stringArray[1];
	var fieldString = stringArray[2];
	var answer = [];
	for(iy=0;iy<yLength;iy++){
		answer.push([]);
		for(ix=0;ix<xLength;ix++){
			answer[iy].push(charToSpace(fieldString.charAt(ix+iy*xLength)));
		}
	}
	return answer;
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
Returns a region grid from a wall grid
*/
function regionGridToString(p_regionGrid){
	const yLength = p_regionGrid.length;
	const xLength = p_regionGrid[0].length;
	var answer = "";
	for(var iy = 0;iy < yLength;iy++){
		for(var ix = 0;ix < xLength;ix++){
			answer += (p_regionGrid[iy][ix] % 10) //TODO Le "mod 10" c'est pas top
		}
		answer += "\n"
	}
	return answer;
}

/**
Returns a name to store into / load from local storage
*/
function getLocalStorageName(p_name){
	return "grid_is_good_"+p_name;
}