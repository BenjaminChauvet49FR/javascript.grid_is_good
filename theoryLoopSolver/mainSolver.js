var solver ;

function main() {
	var colors= {
		closed_wall : COLOURS.CLOSED_WALL,
		open_wall : COLOURS.OPEN_WALL,
		edge_walls : COLOURS.EDGE_WALL,
		bannedSpace : COLOURS.BANNED_SPACE,
		openSpace : COLOURS.OPEN_WILD,
		closedSpace : COLOURS.CLOSED_WILD,
		noLink : COLOURS.NO_LINK,
		noLinkWall : COLOURS.NO_LINK_WALL,
		presentLink : COLOURS.LINK,
		noLinkState : COLOURS.NO_LINK_SPACE,
		presentLinkState:COLOURS.LINK_SPACE
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
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength); 
		drawer.drawSolverLinkInsideSpaces(context, colors, solver);
		solver.callStateForItem(spanState);		
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas, 30);
	var fieldName = document.getElementById("input_grid_name");
	
	const defaultPuzzleValue = "1";
	const puzzleTypeName = "TheoryLoop";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_EXCLUDE_LOOP_SPACE, ACTION_INCLUDE_LOOP_SPACE, ACTION_NOTHING]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "case", ENTRY.WALLS, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
	initializeItemsLoopInfos("div_common_loop_display", solver);	
}

