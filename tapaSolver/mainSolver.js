var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var spanState = document.getElementById("span_resolution_state");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 

	var colours = {
		openSpace : COLOURS.OPEN_KABE,
		closedSpace : COLOURS.CLOSED_WILD
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength);
		drawer.drawTapaGrid(context, solver.clueGrid);
		drawInsideSpaces(context, drawer, colours, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	setInterval(drawCanvas,30);
	
	const defaultPuzzleValue = "209";
	const puzzleTypeName = "Tapa";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
		resetCheckboxAdjacency(solver);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PASS_AROUND_SPACES]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
	buildAdjacency("div_adjacency", solver, function(event){formerLimitsExplorationAction(solver)});
	
}