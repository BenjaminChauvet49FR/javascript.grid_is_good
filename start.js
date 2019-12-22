//This script is where all functions are launched at start !

// ON START
// Generate a clear border grid 
//TODO make these variables more "global" AND interchangeable
var heightGrid = 12;
var widthGrid = 14;
var borderGrid = [];
for(iy=0;iy<heightGrid;iy++){
	borderGrid.push([]);
	for(ix=0;ix<widthGrid;ix++){
		borderGrid[iy].push({wallD:WALL_OPEN,wallR:WALL_OPEN});
	}
}
var regionGrid = null;

var canevas = document.getElementById("canevas");
var context = canevas.getContext("2d");

document.getElementById("submit_save_grid").addEventListener('click',saveString);
document.getElementById("submit_load_grid").addEventListener('click',loadString);
document.getElementById("submit_show_region_grid").addEventListener('click',readRegionGrid);
canevas.addEventListener('click', clickCanvas,false);
setInterval(drawCanvas,30);