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

// All the pixel measurements
var pix={
	sideSpace : 30,
	borderSpace : 2, //Inner border
	borderClickDetection : 5, //How many pixels from the side of a space can you click to trigger the border ?
	canvasWidth : 800,
	canvasHeight: 800
}

var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");

//All the colors used in the scenery
var colors={
	closed_wall:'#222222',
	open_wall:'#dddddd',
	edge_walls:'#000000'
}

