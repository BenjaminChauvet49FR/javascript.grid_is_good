
// All the main variables
var drawer=new Drawer();
var editorCore = new EditorCore(9,9);
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var modesManager = {clickSpace:null, clickWallD:null, clickWallR:null};


//The main draw function (at start)
function drawCanvas(){
	drawer.drawGrid(context,editorCore);
}

// Canvas 
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,editorCore,modesManager)},false);
setInterval(drawCanvas,30);

var fieldName = document.getElementById("input_grid_name");
var fieldStars = document.getElementById("input_number_stars");
var fieldDimension = document.getElementById("input_number_dimension");

adaptCanvasAndGrid(canevas,drawer,editorCore);
document.getElementById("submit_save_grid").addEventListener('click',function(event){saveAction(editorCore,fieldName.value,fieldStars.value)});
document.getElementById("submit_load_grid").addEventListener('click',function(event){loadAction(canevas,drawer,editorCore,fieldName.value,fieldDimension,fieldStars)});
document.getElementById("submit_show_region_grid").addEventListener('click',function(event){readRegionGrid(editorCore)});
document.getElementById("submit_new_grid").addEventListener('click',function(event){restartAction(canevas,drawer,editorCore,fieldDimension.value,fieldDimension.value)});

document.getElementById("submit_rotate_clockwise").addEventListener('click',function(event){rotateCWAction(canevas,drawer,editorCore)});
document.getElementById("submit_rotate_uturn").addEventListener('click',function(event){rotateUTurnAction(canevas,drawer,editorCore)});
document.getElementById("submit_rotate_counter_clockwise").addEventListener('click',function(event){rotateCCWAction(canevas,drawer,editorCore)});
document.getElementById("submit_mirror_horizontal").addEventListener('click',function(event){mirrorHorizontalAction(canevas,drawer,editorCore)});
document.getElementById("submit_mirror_vertical").addEventListener('click',function(event){mirrorVerticalAction(canevas,drawer,editorCore)});

document.getElementById("submit_wall_selection").addEventListener('click',function(event){actionBuildWallsAroundSelection(editorCore)});
document.getElementById("submit_clear_selection").addEventListener('click',function(event){actionUnselectAll(editorCore)});


//-------------------------
// Mode of selection (TODO : besides the modesManager item, nothing appears above this line) 

var textMode = document.getElementById("span_mode"); //TODO bientôt il y aura plusieurs modes !
textMode.innerHTML = MODE_NORMAL.html;
modesManager.clickSpace = MODE_NORMAL.id;
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
	p_submitElement.value = p_mode.value;
	p_submitElement.addEventListener('click',function(event){
		actionUnselectAll(editorCore); 
		textMode.innerHTML = p_mode.html;
		modesManager.clickSpace = p_mode; //TODO à améliorer !
	});
}