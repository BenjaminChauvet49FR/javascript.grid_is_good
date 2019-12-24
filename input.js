// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas

/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_pix,p_global) {
    var rect = p_canvas.getBoundingClientRect();
    var pixMouseX = event.clientX - rect.left; //TODO : WARNING ! Offset not taken into account yet !
    var pixMouseY = event.clientY - rect.top;
	var spaceIndexX = Math.floor(pixMouseX/p_pix.sideSpace); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseY/p_pix.sideSpace); //same
	p_global.regionGrid = null; 
	var needToSwitchSpace = true;
    if ((pixMouseX % p_pix.sideSpace) >= (p_pix.sideSpace-p_pix.borderClickDetection)){
		switchR(p_global.borderGrid[spaceIndexY][spaceIndexX]);
		needToSwitchSpace = false;
	}
	if ((pixMouseX % p_pix.sideSpace <= p_pix.borderClickDetection-1) && spaceIndexX > 0){
		switchR(p_global.borderGrid[spaceIndexY][spaceIndexX-1]);
		needToSwitchSpace = false;
	}
	if ((pixMouseY % p_pix.sideSpace) >= (p_pix.sideSpace-p_pix.borderClickDetection)){
		switchD(p_global.borderGrid[spaceIndexY][spaceIndexX]);
		needToSwitchSpace = false;
	}
	if ((pixMouseY % p_pix.sideSpace <= p_pix.borderClickDetection-1) && spaceIndexY > 0){
		switchD(p_global.borderGrid[spaceIndexY-1][spaceIndexX]);
		needToSwitchSpace = false;
	}
	if (needToSwitchSpace && (spaceIndexY >= 0) && (spaceIndexX >= 0) && (spaceIndexY <= p_global.yLength-1) && (spaceIndexX <= p_global.xLength-1)){
		switchState(p_global.borderGrid[spaceIndexY][spaceIndexX]);
	}
}

/**Switches the state of the right wall of a space*/
function switchR(p_space){
	if(p_space.wallR == CLOSED){
		p_space.wallR = OPEN;
		return;
	}
	p_space.wallR = CLOSED;
}

/**Switches the state of the down wall of a space*/
function switchD(p_space){
	if(p_space.wallD == CLOSED){
		p_space.wallD = OPEN;
		return;
	}
	p_space.wallD = CLOSED;
}

/**Switches the state of a space*/
function switchState(p_space){
	if(p_space.state == CLOSED){
		p_space.state = OPEN;
		return;
	}
	p_space.state = CLOSED;
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

