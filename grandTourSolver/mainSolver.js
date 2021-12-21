var solver;
function main() {
	const colours = {
		openLink:'#000000',
		undecidedLink:'#dddddd',
		blockedLink:'#cc0088',
		closedLink:'#eeeeff'
	}

	var drawer = new Drawer(colours);
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");


	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawInsideSpaces(context, drawer, colours, solver);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	const defaultPuzzleValue = "1";
	const puzzleTypeName = "GrandTour";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "noeud", ENTRY.NET_NODE, [ACTION_NOTHING, ACTION_PASS_SPACE]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "lien", ENTRY.NET_EDGE, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Résolution", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );
	initializeItemsLoopInfos("div_common_loop_display", solver);
}

quickStartEventsClosure = function(p_solver) {
	return function() {
		p_solver.initiateQuickStart("Grand Tour");

		p_solver.terminateQuickStart();
	}
}