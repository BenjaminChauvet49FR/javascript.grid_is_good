var solver;

function main() {
	var colors = {}; 
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawing(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas, 30);
		
	const defaultPuzzleValue = "95";
	const puzzleTypeName = "Galaxies";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_NOTHING, ACTION_PASS_GALAXY_DELIMITATION]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "cloison",  ENTRY.WALLS, [ACTION_CLOSE_FENCE, ACTION_OPEN_FENCE, ACTION_PASS_FENCE, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler"], [function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}