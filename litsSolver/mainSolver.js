var drawer = new Drawer();
var solver = new SolverLITS(generateWallArray(1,1));
//TODO (dummy grid problem)
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {clickSpace : null}; 
var drawIndications;

var colors={
	openSquare:'#00ffcc',
	closedSquare:'#cc0022',
	LSquare:'#ffcccc',
	ISquare:'#ffcc88',
	TSquare:'#ccffcc',
	SSquare:'#ccccff',
	rainbowSpaces:[],
	insideIndicationsOnWhite:'#008800',
	insideIndicationsOnFilled:'#00ff00',
	standardWrite:'#000000',
	reflectWrite:"#ffff88",
}

//--------------------
//The main draw function (at start)
function drawCanvas(){
	drawer.drawWallGrid(context,solver.gridWall,solver.xLength,solver.yLength); 
	drawInsideSpaces(context,drawer,colors,solver);
}

var textArea = document.getElementById("textarea_happened");
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,solver,actionsManager)},false);
setInterval(drawCanvas,30);
var fieldName = document.getElementById("input_grid_name");

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("LITS")});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value)});
putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
putActionElementClick("submit_multiPass",function(event){multiPassAction(solver)});
putActionElementClick("submit_undo",function(event){undoAction(solver)});

//------

var textAction = document.getElementById("text_canvas_action");
setMode(textAction,actionsManager,ENTRY.SPACE,ACTION_CLOSE_SPACE);
addEventListenerAndCaption("submit_open_space",ACTION_OPEN_SPACE);
addEventListenerAndCaption("submit_close_space",ACTION_CLOSE_SPACE);
addEventListenerAndCaption("submit_pass_region",ACTION_PASS_REGION);
addEventListenerAndCaption("submit_pass_region_and_adjacency", ACTION_PASS_REGION_AND_ADJACENCY_SPACES);
function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
	addEventListenerAndCaptionActionSubmit(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
}