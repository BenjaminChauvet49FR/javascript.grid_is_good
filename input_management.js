// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas

/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_global) {
    var rect = p_canvas.getBoundingClientRect();
    var pixMouseX = event.clientX - rect.left;
    var pixMouseY = event.clientY - rect.top;
	var spaceIndexX = Math.floor(pixMouseX/PIX.SIDE_SPACE); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseY/PIX.SIDE_SPACE); //same
	p_global.regionGrid = null; 
    if ((pixMouseX % PIX.SIDE_SPACE) >= (PIX.SIDE_SPACE-PIX.BORDER_CLICK_DETECTION)){
		switchR(p_global.borderGrid[spaceIndexY][spaceIndexX]);
	}
	if ((pixMouseX % PIX.SIDE_SPACE <= PIX.BORDER_CLICK_DETECTION-1) && spaceIndexX > 0){
		switchR(p_global.borderGrid[spaceIndexY][spaceIndexX-1]);
	}
	if ((pixMouseY % PIX.SIDE_SPACE) >= (PIX.SIDE_SPACE-PIX.BORDER_CLICK_DETECTION)){
		switchD(p_global.borderGrid[spaceIndexY][spaceIndexX]);
	}
	if ((pixMouseY % PIX.SIDE_SPACE <= PIX.BORDER_CLICK_DETECTION-1) && spaceIndexY > 0){
		switchD(p_global.borderGrid[spaceIndexY-1][spaceIndexX]);
	}
}

/**Switches the state of the right wall of a space*/
function switchR(p_space){
	if(p_space.wallR == WALL_CLOSED){
		p_space.wallR = WALL_OPEN;
		return;
	}
	p_space.wallR = WALL_CLOSED;
}

/**Switches the state of the down wall of a space*/
function switchD(p_space){
	if(p_space.wallD == WALL_CLOSED){
		p_space.wallD = WALL_OPEN;
		return;
	}
	p_space.wallD = WALL_CLOSED;
}

//----------------------

/** Saves into local storage */
saveString = function(p_global) {
	localStorage.setItem('saved_grid_is_good', wallGridToString(p_global.borderGrid))
}

/** Loads from local storage */
loadString = function(p_canvas,p_global){
	var grid = stringToWallGrid(localStorage.getItem('saved_grid_is_good'));
	p_global.borderGrid = grid;
	p_global.xLength = grid[0].length;
	p_global.yLength = grid.length;
	adaptCanvas(p_canvas,p_global);
}

/** Read the region grid as it is*/
readRegionGrid = function(p_global){
	p_global.regionGrid = wallGridToRegionGrid(p_global.borderGrid);
}