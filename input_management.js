// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas

/**
 When you click on the canvas
*/
clickCanvas = function(event) {
    var rect = canevas.getBoundingClientRect();
    var pixMouseX = event.clientX - rect.left;
    var pixMouseY = event.clientY - rect.top;
	var spaceIndexX = Math.floor(pixMouseX/PIX.SIDE_SPACE); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseY/PIX.SIDE_SPACE); //same
    if ((pixMouseX % PIX.SIDE_SPACE) >= (PIX.SIDE_SPACE-PIX.BORDER_CLICK_DETECTION)){
		switchR(borderGrid[spaceIndexY][spaceIndexX]);
	}
	if ((pixMouseX % PIX.SIDE_SPACE <= PIX.BORDER_CLICK_DETECTION-1) && spaceIndexX > 0){
		switchR(borderGrid[spaceIndexY][spaceIndexX-1]);
	}
	if ((pixMouseY % PIX.SIDE_SPACE) >= (PIX.SIDE_SPACE-PIX.BORDER_CLICK_DETECTION)){
		switchD(borderGrid[spaceIndexY][spaceIndexX]);
	}
	if ((pixMouseY % PIX.SIDE_SPACE <= PIX.BORDER_CLICK_DETECTION-1) && spaceIndexY > 0){
		switchD(borderGrid[spaceIndexY-1][spaceIndexX]);
	}
}



saveString = function(event) {
	localStorage.setItem('saved_grid_is_good', gridToString(borderGrid))
}

loadString = function(event){
	borderGrid = stringToGrid(localStorage.getItem('saved_grid_is_good'));
}

/**
Returns the grid as a string to be contained in a cookie (must be rectangular and non-empty)
X-empty ; 0 sides right and down open ; 1 side right closed ; 2 side down closed ; 3 side down closed.
p_grid : the grid to be stringed
*/
function gridToString(p_grid){
	var yLength = p_grid.length;
	var xLength = p_grid[0].length;
	var answer = yLength+" "+xLength+" ";
	var valueSpace;
	for(var iy = 0;iy < yLength;iy++)
		for(var ix = 0;ix < xLength;ix++){
			if (!p_grid[iy][ix]){
				answer+='X';
			}
			else{
				valueSpace=0;
				if (p_grid[iy][ix].wallR == WALL_CLOSED){
					valueSpace+=1;
				}
				if (p_grid[iy][ix].wallD == WALL_CLOSED){
					valueSpace+=2;
				}
				answer+=valueSpace;
			}
		}
	return answer;
}

/**
Returns the grid from the string if it was previously serialized with the appropriate function gridToString
p_string : the string to be turned into a grid
*/
function stringToGrid(p_string){
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
		case('0'): return {wallD:WALL_OPEN,wallR:WALL_OPEN};break;
		case('1'): return {wallD:WALL_OPEN,wallR:WALL_CLOSED};break;
		case('2'): return {wallD:WALL_CLOSED,wallR:WALL_OPEN};break;
		case('3'): return {wallD:WALL_CLOSED,wallR:WALL_CLOSED};break;
		default : return {wallD:WALL_OPEN,wallR:WALL_OPEN};break;
	}
}