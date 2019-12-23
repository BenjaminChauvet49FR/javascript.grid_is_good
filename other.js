/**
Returns the grid with walls as a string to be contained in a cookie (must be rectangular and non-empty)
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
Returns the grid with walls from the string if it was previously serialized with the appropriate function gridToString
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
Converts a grid with walls (right and down) to a "region" grid (regions 1,2,3,...) 
p_wallGrid : the source grid
*/
function wallGridToRegionGrid(p_wallGrid){
	var regionGridAnswer = [];
	var yLength = p_wallGrid.length;
	var xLength = p_wallGrid[0].length;
	//Create the grid with banned and uncharted spaces
	for(var iy=0;iy<yLength;iy++){
		regionGridAnswer.push([]);
		for(var ix=0;ix<xLength;ix++){
			if (p_wallGrid[iy][ix].state == CLOSED){
				regionGridAnswer[iy].push(BANNED);
			}else{
				regionGridAnswer[iy].push(UNCHARTED);
			}
		}
	}
	//Region parting :
	var firstX;
	var firstY = 0;
	var regionIndex = 0;
	var spacesThatBelong = [];
	var spaceToPut;
	var x,y;
	//Then, go for all non-banned spaces
	while(firstY < yLength){
		firstX = 0;
		while ((firstX < xLength) && (regionGridAnswer[firstY][firstX] != UNCHARTED)){ //le dernier true sera à changer quand je ferai des cases destinées à rester à -1
			firstX++;
		}
		if (firstX < xLength){
			spacesThatBelong.push({sx:firstX,sy:firstY});
			while(spacesThatBelong.length > 0){
				spaceToPut = spacesThatBelong.pop();
				x = spaceToPut.sx;
				y = spaceToPut.sy;
				regionGridAnswer[y][x] = regionIndex;
				if((y > 0) && (regionGridAnswer[y-1][x] == UNCHARTED) && (p_wallGrid[y-1][x].wallD == OPEN)){
					spacesThatBelong.push({sx:x,sy:y-1});
				}
				if((x > 0) && (regionGridAnswer[y][x-1] == UNCHARTED) && (p_wallGrid[y][x-1].wallR == OPEN)){
					spacesThatBelong.push({sx:x-1,sy:y});
				}
				if((y <= yLength-2) && (regionGridAnswer[y+1][x] == UNCHARTED) && (p_wallGrid[y][x].wallD == OPEN)){
					spacesThatBelong.push({sx:x,sy:y+1});
				}
				if((x <= xLength-2) && (regionGridAnswer[y][x+1] == UNCHARTED) && (p_wallGrid[y][x].wallR == OPEN)){
					spacesThatBelong.push({sx:x+1,sy:y});
				}
			}
			regionIndex++;
			firstX++;
		}
		if(firstX == xLength){
			firstX = 0;
			firstY++;
		}
	}
	return regionGridAnswer;
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
Generates a clean grid wall with desired width and height
*/
function generateGridWall(p_widthGrid, p_heightGrid){
	var answer = [];
	for(var iy=0;iy<p_heightGrid;iy++){
		answer.push([]);
		for(var ix=0;ix<p_widthGrid;ix++){
			answer[iy].push({state:OPEN,wallD:OPEN,wallR:OPEN});
		}
	}
	return answer;
}

