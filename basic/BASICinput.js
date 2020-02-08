// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas

/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_global){
	var wallOK = false;
	var indexWallR = p_drawer.getClickWallR(event,p_canvas,p_global);
	var indexWallD = p_drawer.getClickWallD(event,p_canvas,p_global);
	if (indexWallR != null){
		p_global.switchWallR(indexWallR.x,indexWallR.y);
		wallOK = true;
	}
	if (indexWallD != null){
		p_global.switchWallD(indexWallD.x,indexWallD.y);
		wallOK = true;
	}
	if (wallOK){
		return;
	}
	var indexSpaces = p_drawer.getClickSpace(event,p_canvas,p_global);
	if (indexSpaces != null){
		p_global.switchState(indexSpaces.x,indexSpaces.y);
	}
}

/** Saves a walled grid into local storage 
p_global : the Global item
p_detachedName : the detached name (without the prefix) to store into local storage
*/
saveAction = function(p_global,p_detachedName, p_starsNumber) {
	var localStorageName = getLocalStorageName(p_detachedName);
	if (localStorage.hasOwnProperty(localStorageName)){
		if (confirm("Le stockage local a déjà une propriété nommée '"+localStorageName+"'. L'écraser ?")){
			localStorage.setItem(localStorageName, wallGridToString(p_global.wallGrid));
		}
	}
	else{
		localStorage.setItem(localStorageName, wallGridToString(p_global.wallGrid));
	}
}

/** Loads a walled grid from local storage 
p_canvas : the canvas (it should be redimensioned)
p_pix : the Pix item 
p_global : the Global item
p_detachedName : the detached name (without the prefix) to load from local storage
*/
loadAction = function(p_canvas,p_pix,p_global,p_detachedName){
	var localStorageName = getLocalStorageName(p_detachedName);
	if (localStorage.hasOwnProperty(localStorageName)){
		if (confirm("Charger la grille "+localStorageName+" ?")){
			var wallGrid = stringToWallGrid(localStorage.getItem(localStorageName));
			p_global.loadGrid(wallGrid);
			adaptCanvas(p_canvas,p_pix,p_global);	
		}
	} else{
		alert("Le stockage local n'a pas de propriété nommée '"+localStorageName+"'.");
	}
}

/** 
Read the region grid as it is
p_global : the global item
*/
readRegionGrid = function(p_global){
	p_global.updateRegionGrid();
}

/**
Restarts the grid and the canvas to new dimensions
p_canvas : the canvas to adapt
p_pix : the Pix item
p_global : the Global item
p_xLength : horizontal dimension
p_yLength : vertical dimension
*/
restartAction = function(p_canvas, p_drawer, p_global, p_xLength, p_yLength){
	if (confirm("Redémarrer la grille ?")){
		p_global.restartGrid(p_xLength,p_yLength);
		adaptCanvas(p_canvas, p_drawer,p_global);	
	}
}

/**
Adapts canvas to global grid
p_canvas : the canvas to adapt
p_pix : the Pix item to calculate coordinates
p_global : the Global item the canvas should be adapted to
*/
function adaptCanvas(p_canvas, p_drawer,p_global){
	p_canvas.width = p_global.xLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.left+p_drawer.pix.marginGrid.right;
	p_canvas.height = p_global.yLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.up+p_drawer.pix.marginGrid.down;
}