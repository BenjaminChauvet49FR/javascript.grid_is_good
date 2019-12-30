//The main draw function (at start)
function drawCanvas(){
	drawGridUltimate(context,pix,colors,global);
}

// All the main variables
var pix=new Pix();
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

var fieldName = document.getElementById("input_grid_name");
var fieldWidth = document.getElementById("input_number_width");
var fieldHeight = document.getElementById("input_number_height");

adaptCanvas(canevas,pix,global);
document.getElementById("submit_save_grid").addEventListener('click',function(event){saveAction(global,fieldName.value)});
document.getElementById("submit_load_grid").addEventListener('click',function(event){loadAction(canevas,pix,global,fieldName.value)});
document.getElementById("submit_show_region_grid").addEventListener('click',function(event){readRegionGrid(global)});
document.getElementById("submit_new_grid").addEventListener('click',function(event){restartAction(canevas,pix,global,fieldWidth.value,fieldHeight.value)});
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,pix,global)},false);
global.mode.colorRegionIfValid = true;

setInterval(drawCanvas,30);