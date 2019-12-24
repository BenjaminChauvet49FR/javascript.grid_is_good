

//The main draw function (at start)
function drawCanvas(){
	drawGridUltimate(context,pix,colors,global);
}

var fieldName = document.getElementById("input_grid_name");
var fieldWidth = document.getElementById("input_number_width");
var fieldHeight = document.getElementById("input_number_height");

adaptCanvas(canevas,pix,global);
document.getElementById("submit_save_grid").addEventListener('click',function(event){saveAction(global,fieldName.value)});
document.getElementById("submit_load_grid").addEventListener('click',function(event){loadAction(canevas,pix,global,fieldName.value)});
document.getElementById("submit_show_region_grid").addEventListener('click',function(event){readRegionGrid(global)});
document.getElementById("submit_new_grid").addEventListener('click',function(event){restartGrid(canevas,pix,global,fieldWidth.value,fieldHeight.value)});
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,pix,global)},false);
global.mode.colorRegionIfPossible = false;
setInterval(drawCanvas,30);