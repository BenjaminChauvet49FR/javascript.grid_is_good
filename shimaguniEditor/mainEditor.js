
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

var fieldX = document.getElementById("input_number_xLength");
var fieldY = document.getElementById("input_number_yLength");
var fieldName = document.getElementById("input_grid_name");

adaptCanvasAndGrid(canevas,drawer,editorCore);

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("Shimaguni")});
putActionElementClick("submit_save_grid",function(event){saveAction(editorCore,fieldName.value,{})});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,editorCore,fieldName.value,{xLengthField : fieldX, yLengthField:fieldY})});
putActionElementClick("submit_auto_name",function(event){fieldName.value = "Shimaguni"});
putActionElementClick("submit_new_grid",function(event){restartAction(canevas,drawer,editorCore,fieldX.value,fieldY.value)});
putActionElementClick("submit_resize_grid",function(event){resizeAction(canevas,drawer,editorCore,fieldX.value,fieldY.value)});

putActionElementClick("submit_rotate_clockwise",function(event){rotateCWAction(canevas,drawer,editorCore)});
putActionElementClick("submit_rotate_uturn",function(event){rotateUTurnAction(canevas,drawer,editorCore)});
putActionElementClick("submit_rotate_counter_clockwise",function(event){rotateCCWAction(canevas,drawer,editorCore)});
putActionElementClick("submit_mirror_horizontal",function(event){mirrorHorizontalAction(canevas,drawer,editorCore)});
putActionElementClick("submit_mirror_vertical",function(event){mirrorVerticalAction(canevas,drawer,editorCore)});

putActionElementClick("submit_wall_selection",function(event){actionBuildWallsAroundSelection(editorCore)});
putActionElementClick("submit_clear_selection",function(event){actionUnselectAll(editorCore)});



//-------------------------
// Mode of selection (TODO : besides the modesManager item, nothing appears above this line) 

//See "CommonXManager.js" above.
var textMode = document.getElementById("span_mode"); 
setMode(textMode,modesManager,MODES.SPACE,MODE_NORMAL);
function addEventListenerAndCaptionActionSubmitStandardSpace(elementId, modeValue){
	addEventListenerAndCaptionActionSubmit(editorCore,modesManager,textMode,elementId,MODES.SPACE,modeValue);
}
addEventListenerAndCaptionActionSubmitStandardSpace("submit_normal_mode",MODE_NORMAL);
addEventListenerAndCaptionActionSubmitStandardSpace("submit_select_mode",MODE_SELECTION);
addEventListenerAndCaptionActionSubmitStandardSpace("submit_erase_mode",MODE_ERASE);
addEventListenerAndCaptionActionSubmitStandardSpace("submit_digit_mode",MODE_NUMBER);

document.getElementById("input_number_value_region").addEventListener('change',function(){editorCore.setInputNumber(this.value)});