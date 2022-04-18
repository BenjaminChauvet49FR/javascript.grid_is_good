var solver;
function main() {
	const colours = {
		openLink : COLOURS.OPEN_LINK_DOTS,
		openNode : COLOURS.OPEN_NODE_DOTS,
		undecidedLink : COLOURS.UNDECIDED_LINK_DOTS,
		closedLink : '#f8f0ff',
		
		obstacleInnerBG : COLOURS.LIGHT_DOT_BG,
		obstacleInnerWrite : COLOURS.LIGHT_DOT_WRITE,
		obstacleOuterBG : COLOURS.DARK_DOT_BG,
		obstacleOuterWrite : COLOURS.DARK_DOT_WRITE,
		areaIn : COLOURS.LIGHT_AREA,
		areaOut : COLOURS.DARK_AREA,
	}

	var drawer = new Drawer(colours);
	solver = DummySolver(); //Note : who needs drawed dummy solvers with dotted grids ? 
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");


	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		draw(context, drawer, colours, solver);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	const defaultPuzzleValue = "17";
	const puzzleTypeName = "CastleWall";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "noeud", ENTRY.NET_NODE, [ACTION_EXCLUDE_LOOP_SPACE, ACTION_INCLUDE_LOOP_SPACE, ACTION_PASS_SPACE, ACTION_NOTHING]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "lien", ENTRY.NET_EDGE, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Résolution", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );
	initializeItemsLoopInfos("div_common_loop_display", solver);
}