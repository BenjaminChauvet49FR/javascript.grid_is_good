var colors={
	closed_wall:'#222222',
	open_wall:'#dddddd',
	edge_walls:'#000000',
	bannedSpace:'#666666',
	openSquare:'#00ffcc',
	closedSquare:'#cc0022',
	noLink:'#aa0000',
	presentLink:'#cc00ff',
	noLinkState:'#448844',
	presentLinkState:'#bbffdd'
}

var drawer = new Drawer(colors);
var solver = new SolverTheoryLoop();
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {clickSpace : null}; 
var drawIndications;



//--------------------
//The main draw function (at start)
function drawCanvas() {
	drawer.drawWalllessGrid(context, null, 10, 10); //TODO solution provisoire
	drawer.drawSolverLinkGrid(context, solver.loopSolver); 
	// No drawing of banned spaces. 
	//drawInsideSpaces(context,drawer,colors,solver);
}

var textArea = document.getElementById("textarea_happened");
var components = {
	textArea: textArea,
	checkBox : document.getElementById("checkbox_onlyAssumed"),
};
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,components,solver,actionsManager)},false);
setInterval(drawCanvas,30);
var fieldName = document.getElementById("input_grid_name");

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("TheoryLoop")});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value)});
//putActionElementClick("submit_quickStart",function(event){quickStartAction(solver,null)}); // Not relevant
putActionElementClick("submit_undo",function(event){undoAction(solver,null)});

//------

var textAction = document.getElementById("text_canvas_action");
setMode(textAction,actionsManager,ENTRY.SPACE,ACTION_CLOSE_SPACE);
setMode(textAction,actionsManager,ENTRY.WALL_R,ACTION_LINK_SPACES);
setMode(textAction,actionsManager,ENTRY.WALL_D,ACTION_LINK_SPACES); //TODO Fusionner WALL_R et WALL_D
addEventListenerAndCaption("submit_open_space", ENTRY.SPACE, ACTION_OPEN_SPACE);
addEventListenerAndCaption("submit_close_space", ENTRY.SPACE, ACTION_CLOSE_SPACE);
addEventListenerAndCaption("submit_link_spaces", ENTRY.WALL_R, ACTION_LINK_SPACES);
addEventListenerAndCaption("submit_close_links", ENTRY.WALL_R, ACTION_CLOSE_LINKS);
addEventListenerAndCaption("submit_link_spaces", ENTRY.WALL_D, ACTION_LINK_SPACES);
addEventListenerAndCaption("submit_close_links", ENTRY.WALL_D, ACTION_CLOSE_LINKS);

function addEventListenerAndCaption(p_identifier, p_entry, p_action){ //Shortcut action
	addEventListenerAndCaptionForSolver(actionsManager, textAction, p_identifier, p_entry, p_action);
}