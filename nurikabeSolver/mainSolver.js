var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var spanState = document.getElementById("span_resolution_state");
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 

	var colors = {
		openSpace : '#0088ff',
		closedSpace : '#ccffcc',
		numberWrite : '#000000',
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength);
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	const defaultPuzzleValue = "1045";
	const puzzleTypeName = "Nurikabe";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value);
		resetCheckboxAdjacency(solver);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_ISLAND_SPACE, ACTION_SEA_SPACE, ACTION_PASS_SPACE]);
	buildActionsGlobal("div_global_actions", ["Purge", "Multipasse", "Résolution", "Annuler"], 
		[function(event){purgeAction(solver)}, function(event){multipassAction(solver)},
		function(event){solveAction(solver)} , function(event){undoAction(solver)}] );
	buildAdjacency("div_adjacency", solver, function(event){formerLimitsExplorationAction(solver)});
}