//This script is where all functions are launched at start !

// ON START

// All the pixel measurements
var pix={
	sideSpace : 30,
	borderSpace : 2, //Inner border
	borderClickDetection : 5, //How many pixels from the side of a space can you click to trigger the border ?
	canvasWidth : 800,
	canvasHeight: 800,
	marginGrid : {
		left:0,
		up:0,
		right:0,
		down:0
	}
}

var global = new Global(6,6);
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");

//All the colors used in the scenery
var colors={
	closed_wall:'#222222',
	open_wall:'#dddddd',
	edge_walls:'#000000',
	bannedSpace:'#666666',
	rainbowSpaces:["#6666ff","#ff6666","#66ff66",
	"#66ffff","#ffff66","#ff66ff",
	"#cc66ff","#ffcc66","#66ffcc",
	"#ff00cc","#00ccff","#ccff00"]
}

