var solver;
function main() {
	var colors = {
		openLink : COLOURS.OPEN_LINK_DOTS,
		openNode : COLOURS.OPEN_NODE_DOTS,
		undecidedLink : COLOURS.UNDECIDED_LINK_DOTS,
		closedLink : COLOURS.CLOSED_LINK_DOTS,
		
		numberWrite:'#220044'
	}

	var drawer = new Drawer(colors);
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	drawer.adaptCanvasDimensions(canevas, {isDotted : true, xLength : solver.xLength, yLength : solver.yLength}); // Note : required here because of "isDotted".
	var spanState = document.getElementById("span_resolution_state");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;



	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		draw(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	const defaultPuzzleValue = "1";
	const puzzleTypeName = "SlitherLink";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "noeud", ENTRY.NET_NODE, [ACTION_EXCLUDE_LOOP_SPACE, ACTION_INCLUDE_LOOP_SPACE, ACTION_PASS_SPACE, ACTION_NOTHING]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "lien", ENTRY.NET_EDGE, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);
	buildInputCanvas("div_canvas3_buttons", actionsManager, "maille", ENTRY.SPACE, [ACTION_NOTHING, ACTION_PASS_MESH]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Résolution", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );
	initializeItemsLoopInfos("div_common_loop_display", solver);	
}
