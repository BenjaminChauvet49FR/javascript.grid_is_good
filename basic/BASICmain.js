
// All the main variables
var drawer=new Drawer();
var global = new Global(6,6);
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");

//The main draw function (at start)
function drawCanvas(){
	drawer.drawGrid(context,global);
}



var fieldName = document.getElementById("input_grid_name");
var fieldWidth = document.getElementById("input_number_width");
var fieldHeight = document.getElementById("input_number_height");

adaptCanvas(canevas,drawer,global);
document.getElementById("submit_save_grid").addEventListener('click',function(event){saveAction(global,fieldName.value)});
document.getElementById("submit_load_grid").addEventListener('click',function(event){loadAction(canevas,drawer,global,fieldName.value)});
document.getElementById("submit_show_region_grid").addEventListener('click',function(event){readRegionGrid(global)});
document.getElementById("submit_new_grid").addEventListener('click',function(event){restartAction(canevas,drawer,global,fieldWidth.value,fieldHeight.value)});
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,global)},false);
global.mode.colorRegionIfValid = true;

setInterval(drawCanvas,30);