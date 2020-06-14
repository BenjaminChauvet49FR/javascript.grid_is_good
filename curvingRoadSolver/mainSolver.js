var drawer = new Drawer();
var solver = new SolverCurvingRoad(generateWallArray(1,1),generateSymbolArray(1,1));
//TODO (dummy grid problem)
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {clickSpace : null}; 
var drawIndications;

var colors = {
	closed_wall:'#222222',
	//open_wall:'#dddddd',
	//edge_walls:'#000000',
	circleIn:'#ffe100',
	circleOut:'#300000',
	bannedSpace:'#666666',
	openSquare:'#00ffcc',
	closedSquare:'#cc0022',
	standardWrite:'#000000',
	reflectWrite:"#ffff88",
	validSquare:"#000088"
}

//--------------------
//The main draw function (at start)
function drawCanvas(){
	drawer.drawWalllessGrid(context,solver.wallGrid,solver.xLength,solver.yLength); 
	drawInsideSpaces(context,drawer,colors,solver);
}

var textArea = document.getElementById("textarea_happened");
var components = {
	textArea: textArea,
	checkBox : document.getElementById("checkbox_onlyAssumed"),
};
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,components,solver,actionsManager)},false);
setInterval(drawCanvas,30);
var fieldName = document.getElementById("input_grid_name");

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("CurvingRoad")});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value)});
putActionElementClick("submit_quickStart",function(event){quickStartAction(solver,null)});
putActionElementClick("submit_undo",function(event){undoAction(solver,null)});

//------

var textAction = document.getElementById("text_canvas_action");
setMode(textAction,actionsManager,ENTRY.SPACE,ACTION_CLOSE_SPACE);
addEventListenerAndCaption("submit_open_space",ACTION_OPEN_SPACE);
addEventListenerAndCaption("submit_close_space",ACTION_CLOSE_SPACE);
function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
	addEventListenerAndCaptionForSolver(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
}