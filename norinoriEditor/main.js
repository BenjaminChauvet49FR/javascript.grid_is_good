
// All the main variables
var drawer=new Drawer();
var global = new Global(9,9);
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var mode;

//The main draw function (at start)
function drawCanvas(){
	drawer.drawGrid(context,global);
}

var fieldName = document.getElementById("input_grid_name");
var fieldX = document.getElementById("input_number_xLength");
var fieldY = document.getElementById("input_number_yLength");

adaptCanvasAndGrid(canevas,drawer,global);
document.getElementById("submit_save_grid").addEventListener('click',function(event){saveAction(global,fieldName.value)});
document.getElementById("submit_load_grid").addEventListener('click',function(event){loadAction(canevas,drawer,global,fieldName.value,fieldX,fieldY)});
document.getElementById("submit_show_region_grid").addEventListener('click',function(event){readRegionGrid(global)});
document.getElementById("submit_new_grid").addEventListener('click',function(event){restartAction(canevas,drawer,global,fieldX.value,fieldY.value)});
document.getElementById("submit_resize_grid").addEventListener('click',function(event){resizeAction(canevas,drawer,global,fieldX.value,fieldY.value)});

document.getElementById("submit_rotate_clockwise").addEventListener('click',function(event){rotateCWAction(canevas,drawer,global)});
document.getElementById("submit_rotate_uturn").addEventListener('click',function(event){rotateUTurnAction(canevas,drawer,global)});
document.getElementById("submit_rotate_counter_clockwise").addEventListener('click',function(event){rotateCCWAction(canevas,drawer,global)});
document.getElementById("submit_mirror_horizontal").addEventListener('click',function(event){mirrorHorizontalAction(canevas,drawer,global)});
document.getElementById("submit_mirror_vertical").addEventListener('click',function(event){mirrorVerticalAction(canevas,drawer,global)});

document.getElementById("submit_wall_selection").addEventListener('click',function(event){actionBuildWallsAroundSelection(global)});
document.getElementById("submit_clear_selection").addEventListener('click',function(event){actionUnselectAll(global)});

canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,global,mode)},false);
global.mode.colorRegionIfValid = true;

setInterval(drawCanvas,30);

var textMode = document.getElementById("span_mode");
textMode.innerHTML = MODE_NORMAL.caption;
mode = MODE_NORMAL.id;
var submitNormal = document.getElementById("submit_normal_mode");
var submitErase = document.getElementById("submit_erase_mode");
var submitSelect = document.getElementById("submit_select_mode");
addEventListenerAndCaptionActionSubmit(submitNormal,MODE_NORMAL);
addEventListenerAndCaptionActionSubmit(submitErase,MODE_SELECTION);
addEventListenerAndCaptionActionSubmit(submitSelect,MODE_ERASE);

/**
Adds the event listener of an action submit by linking it to an action for the canvas (warning : changes a text element)
*/
function addEventListenerAndCaptionActionSubmit(p_submitElement,p_mode){
	actionUnselectAll(global);
	p_submitElement.value = p_mode.value;
	p_submitElement.addEventListener('click',function(event){
		textMode.innerHTML = p_mode.html;
		mode = p_mode.id;
	});
}