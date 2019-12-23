// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas

/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_pix,p_global) {
    var rect = p_canvas.getBoundingClientRect();
    var pixMouseX = event.clientX - rect.left;
    var pixMouseY = event.clientY - rect.top;
	var spaceIndexX = Math.floor(pixMouseX/p_pix.sideSpace); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseY/p_pix.sideSpace); //same
	p_global.regionGrid = null; 
    if ((pixMouseX % p_pix.sideSpace) >= (p_pix.sideSpace-p_pix.borderClickDetection)){
		switchR(p_global.borderGrid[spaceIndexY][spaceIndexX]);
	}
	if ((pixMouseX % p_pix.sideSpace <= p_pix.borderClickDetection-1) && spaceIndexX > 0){
		switchR(p_global.borderGrid[spaceIndexY][spaceIndexX-1]);
	}
	if ((pixMouseY % p_pix.sideSpace) >= (p_pix.sideSpace-p_pix.borderClickDetection)){
		switchD(p_global.borderGrid[spaceIndexY][spaceIndexX]);
	}
	if ((pixMouseY % p_pix.sideSpace <= p_pix.borderClickDetection-1) && spaceIndexY > 0){
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

/** Saves a walled grid into local storage */
saveAction = function(p_global,p_name) {
	localStorage.setItem("grid_is_good_"+p_name, wallGridToString(p_global.borderGrid))
}

/** Loads a walled grid from local storage */
loadAction = function(p_canvas,p_pix,p_global,p_name){
	var grid = stringToWallGrid(localStorage.getItem("grid_is_good_"+p_name));
	p_global.borderGrid = grid;
	p_global.xLength = grid[0].length;
	p_global.yLength = grid.length;
	adaptCanvas(p_canvas,p_pix,p_global);
}

/** Read the region grid as it is*/
readRegionGrid = function(p_global){
	p_global.regionGrid = wallGridToRegionGrid(p_global.borderGrid);
}

//----------------------

/**
Restarts the grid
*/
function restartGrid(p_canvas, p_pix, p_global, p_width, p_height){
	p_global.xLength=p_width;
	p_global.yLength=p_height;
	p_global.borderGrid=generateGridWall(p_width,p_height);
	p_global.regionGrid=null;
	adaptCanvas(p_canvas, p_pix,p_global);
}

//------------------

/**
Adapts canvas to actual scene
*/
function adaptCanvas(p_canvas, p_pix,p_global){
	p_canvas.width = p_global.xLength*p_pix.sideSpace+20;
	p_canvas.height = p_global.yLength*p_pix.sideSpace+20;
	p_global.regionGrid = null;
}