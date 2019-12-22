// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas

/**
 When you click on the canvas
*/
function clickCanvas(event) {
    var rect = canevas.getBoundingClientRect();
    var pixMouseX = event.clientX - rect.left;
    var pixMouseY = event.clientY - rect.top;
	var spaceIndexX = Math.floor(pixMouseX/PIX.SIDE_SPACE); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseY/PIX.SIDE_SPACE); //same
	regionGrid = null;
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

//----------------

/** Saves into local storage */
saveString = function(event) {
	localStorage.setItem('saved_grid_is_good', wallGridToString(borderGrid))
}

/** Loads from local storage */
loadString = function(event){
	borderGrid = stringToWallGrid(localStorage.getItem('saved_grid_is_good'));
}

/** Read the region grid as it is*/
readRegionGrid = function(event){
	/*const regionGrid = wallGridToRegionGrid(borderGrid);
	const yLength = regionGrid.length;
	const xLength = regionGrid[0].length;
	var answer = "";
	for(var iy = 0;iy < yLength;iy++){
		for(var ix = 0;ix < xLength;ix++){
			answer += (regionGrid[iy][ix] % 10) //TODO Le "mod 10" c'est pas top
		}
		answer += "\n"
	}
	console.log(answer); TODO Extraire le code de ce commentaire, y'a moyen de faire une super fonction toString*/
	regionGrid =  wallGridToRegionGrid(borderGrid);
}