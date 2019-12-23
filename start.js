//This script is where all functions are launched at start !

// ON START
// Generate a clear border grid 
//TODO make these variables more "global" AND interchangeable

var widthGrid = 6;
var heightGrid = 10;

var global = {
	xLength: widthGrid,
	yLength: heightGrid,
	borderGrid : generateGridWall(widthGrid,heightGrid),
	regionGrid : null
}

var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
adaptCanvas(canevas,global);



//The main draw function (at start)
function drawCanvas(){
	drawGridUltimate(context,global);
}

document.getElementById("submit_save_grid").addEventListener('click',function(event){saveString(global)});
document.getElementById("submit_load_grid").addEventListener('click',function(event){loadString(canevas,global)});
document.getElementById("submit_show_region_grid").addEventListener('click',function(event){readRegionGrid(global)});
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,global)},false);
setInterval(drawCanvas,30);