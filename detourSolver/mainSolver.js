var solver;
function main() {
	var colors = {
		closed_wall : '#222222',
		open_wall : '#dddddd',
		edge_walls : '#000000',
		bannedSpace : '#666666',
		noLink : '#aa0000',
		presentLink : '#cc00ff',
		numberWrite : '#008800',
		noLinkWall : '#ff8800',
		turningSign : '#88ff88',
		straightSign : '#8888ff',
		writeRegionNumber : '#000044'
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
		drawInsideSpaces(context, drawer, colors, solver);
		// Note : no drawing of non-clue banned spaces
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,solver,actionsManager)},false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "Detour";
	putActionElementClick("submit_view_puzzle_list", function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart", function(event){quickStartAction(solver)});
	putActionElementClick("submit_multipass", function(event){multiPassAction(solver)});
	putActionElementClick("submit_undo", function(event){undoAction(solver)});
	initializeItemsLoopInfos("div_common_loop_display", solver);

	//------

	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action_space", ["submit_pass_region_or_space", "submit_do_nothing_spaces"], 
	ENTRY.SPACE, [ACTION_PASS_REGION_OR_SPACE, ACTION_NOTHING]);
	
	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action_wall", ["submit_link_spaces", "submit_close_links", "submit_do_nothing_links"], 
	ENTRY.WALLS, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);	
}

