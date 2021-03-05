var colors={
	open_fence : "#ffffff",
	closed_fence : "#000088"
}

var drawer = new Drawer(colors);
var solver = new SolverUsotatami([[null]]);
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {clickSpace : null}; 
var drawIndications;



//--------------------
//The main draw function (at start)
function drawCanvas() {
	drawing(context, drawer, colors, solver);
}

canevas.addEventListener('click', function(event){clickCanvas(event, canevas, drawer, solver, actionsManager)},false);
setInterval(drawCanvas,30);
var fieldName = document.getElementById("input_grid_name");

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("Usotatami")});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value)});
putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)}); // Not relevant
putActionElementClick("submit_undo",function(event){undoAction(solver)});

//------

var textAction = document.getElementById("text_canvas_action");
setMode(textAction, actionsManager,ENTRY.WALLS,ACTION_CLOSE_FENCE);
addEventListenerAndCaption("submit_open_fence", ENTRY.WALLS, ACTION_OPEN_FENCE, textAction);
addEventListenerAndCaption("submit_close_fence", ENTRY.WALLS, ACTION_CLOSE_FENCE, textAction);

function addEventListenerAndCaption(p_identifier, p_entry, p_action, p_textAction) { //Shortcut action
	addEventListenerAndCaptionForSolver(actionsManager, p_textAction, p_identifier, p_entry, p_action);
}