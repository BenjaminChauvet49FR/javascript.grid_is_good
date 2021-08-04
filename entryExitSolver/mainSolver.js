var solver;

function main() {
	var colors = {
		closed_wall:'#222222',
		open_wall:'#dddddd',
		edge_walls:'#000000',
		bannedSpace:'#666666',
		noLink:'#aa0000',
		noLinkWall:'#ff8800',
		presentLink:'#cc00ff',
		noLinkState:'#448844',
		presentLinkState:'#ddeeff',
		numberWrite:'#008800',
		oppositeSpaceWrite:'#0000ff'
	}

	var drawer = new Drawer(colors);
	solver = DummySolver(); 
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");


	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength);
		drawer.drawSolverLinkInsideSpaces(context, colors, solver, solver.gridWall);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvas(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "EntryExit";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
	putActionElementClick("submit_multipass",function(event){multiPassAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver)});
	initializeItemsLoopInfos("div_common_loop_display", solver);

	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action_space", ["submit_pass_region", "submit_do_nothing_spaces"], 
	ENTRY.SPACE, [ACTION_PASS_REGION, ACTION_NOTHING]);
	
	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action_wall", ["submit_link_spaces", "submit_close_links", "submit_do_nothing_links"], 
	ENTRY.WALLS, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);	
}
