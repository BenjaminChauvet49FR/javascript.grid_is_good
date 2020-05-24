var drawer = new Drawer();
var solver = new SolverNorinori(generateWallArray(1,1),1);

var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {clickSpace : null}; 
var drawIndications;

var colors={
	closed_wall:'#222222',
	open_wall:'#dddddd',
	edge_walls:'#000000',
	bannedSpace:'#666666',
	validSquare:'#000088',
	rainbowSpaces:[],
	insideIndicationsOnWhite:'#008800',
	insideIndicationsOnFilled:'#00ff00',
}

//--------------------
//The main draw function (at start)
function drawCanvas(){
	drawer.drawWallGrid(context,solver.wallGrid,solver.xLength,solver.yLength);
	drawInsideSpaces(context,drawer,colors,solver);
	if (document.getElementById("checkbox_drawIndications").checked){
		drawInsideIndications(context,drawer,colors,solver);	
	}
}

var components = {
	textArea:document.getElementById("textarea_happened"),
	checkBox : document.getElementById("checkbox_onlyAssumed"),
};

canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,components,solver,actionsManager)},false);

setInterval(drawCanvas,30);

var fieldName = document.getElementById("input_grid_name");
var textArea = document.getElementById("textarea_happened");

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("Norinori")});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value,textArea)});
putActionElementClick("submit_undo",function(event){undoAction(solver,textArea)});
putActionElementClick("submit_quickStart",function(event){quickStartAction(solver,textArea)});
putActionElementClick("submit_multiPass",function(event){multiPassAction(solver,textArea)});

var textAction = document.getElementById("text_canvas_action");
setMode(textAction,actionsManager,ENTRY.SPACE,ACTION_FILL_SPACE);
addEventListenerAndCaption("submit_fill_space",ACTION_FILL_SPACE);
addEventListenerAndCaption("submit_put_X",ACTION_PUT_NO_FILL);
addEventListenerAndCaption("submit_pass_region",ACTION_PASS_REGION);
function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
	addEventListenerAndCaptionForSolver(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
}