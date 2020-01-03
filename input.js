// https://stackoverflow.com/questions/43172115/get-the-mouse-coordinates-when-clicking-on-canvas

/**
 When you click on the canvas
 event : the clicking event
 p_pix : the Pix item
 o_global : the Global item
*/
function clickCanvas(event,p_canvas,p_pix,p_global) {
    var rect = p_canvas.getBoundingClientRect();
    var pixMouseX = event.clientX - rect.left - p_pix.marginGrid.left; 
    var pixMouseY = event.clientY - rect.top - p_pix.marginGrid.up;
	var spaceIndexX = Math.floor(pixMouseX/p_pix.sideSpace); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseY/p_pix.sideSpace); //same
	p_global.regionGrid = null; 
	var needToSwitchSpace = true;
    if ((pixMouseX % p_pix.sideSpace) >= (p_pix.sideSpace-p_pix.borderClickDetection)){
		p_global.switchWallR(spaceIndexX,spaceIndexY);
		needToSwitchSpace = false;
	}
	if ((pixMouseX % p_pix.sideSpace <= p_pix.borderClickDetection-1) && spaceIndexX > 0){
		p_global.switchWallR(spaceIndexX-1,spaceIndexY);
		needToSwitchSpace = false;
	}
	if ((pixMouseY % p_pix.sideSpace) >= (p_pix.sideSpace-p_pix.borderClickDetection)){
		p_global.switchWallD(spaceIndexX,spaceIndexY);
		needToSwitchSpace = false;
	}
	if ((pixMouseY % p_pix.sideSpace <= p_pix.borderClickDetection-1) && spaceIndexY > 0){
		p_global.switchWallD(spaceIndexX,spaceIndexY-1);
		needToSwitchSpace = false;
	}
	if (needToSwitchSpace && (spaceIndexY >= 0) && (spaceIndexX >= 0) && (spaceIndexY <= p_global.yLength-1) && (spaceIndexX <= p_global.xLength-1)){
		p_global.switchState(spaceIndexX,spaceIndexY);
	}
}

/** Saves a walled grid into local storage 
p_global : the Global item
p_detachedName : the detached name (without the prefix) to store into local storage
*/
saveAction = function(p_global,p_detachedName) {
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
restartAction = function(p_canvas, p_pix, p_global, p_xLength, p_yLength){
	if (confirm("Redémarrer la grille ?")){
		p_global.restartGrid(p_xLength,p_yLength);
		adaptCanvas(p_canvas, p_pix,p_global);	
	}
}

/**
Adapts canvas to global grid
p_canvas : the canvas to adapt
p_pix : the Pix item to calculate coordinates
p_global : the Global item the canvas should be adapted to
*/
function adaptCanvas(p_canvas, p_pix,p_global){
	p_canvas.width = p_global.xLength*p_pix.sideSpace+p_pix.marginGrid.left+p_pix.marginGrid.right;
	p_canvas.height = p_global.yLength*p_pix.sideSpace+p_pix.marginGrid.up+p_pix.marginGrid.down;
}