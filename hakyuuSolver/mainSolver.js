var drawer = new Drawer();
var solver = new SolverHakyuu(generateWallArray(1,1), [[null]]);
//TODO (dummy grid problem)
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {clickSpace : null}; 

var colourSet = {
	numberWriteFixed : '#880044',
	numberWriteNotFixed : '#440088'
}

//--------------------
//The main draw function (at start)
function drawCanvas(){
	drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
	drawInsideSpaces(context, drawer, colourSet, solver);
}

canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
setInterval(drawCanvas, 30);
var fieldName = document.getElementById("input_grid_name");

putActionElementClick("submit_view_puzzle_list", function(event){viewPuzzleList("Hakyuu")});
putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, fieldName. value)});
putActionElementClick("submit_quickStart", function(event){quickStartAction(solver)});
putActionElementClick("submit_multipass", function(event){multiPassAction(solver)});
putActionElementClick("submit_undo", function(event){undoAction(solver)});

//------

var textAction = document.getElementById("text_canvas_action");
setMode(textAction, actionsManager, ENTRY.SPACE, ACTION_ENTER_NUMBER);
addEventListenerAndCaption("submit_enter_number", ACTION_ENTER_NUMBER);
addEventListenerAndCaption("submit_pass_region", ACTION_PASS_REGION);
function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
	addEventListenerAndCaptionForSolver(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
}