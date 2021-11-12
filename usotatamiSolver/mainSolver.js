var solver;

function main() {
	var colors = {}; // TODO manage this some day

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

	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	const defaultPuzzleValue = "17";
	const puzzleTypeName = "Usotatami";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "texti", ENTRY.SPACE, [ACTION_NOTHING, ACTION_PASS_AROUND_SPACE]);
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "textid", ENTRY.WALLS, [ACTION_CLOSE_FENCE, ACTION_OPEN_FENCE, ACTION_NOTHING, ]);
	buildActionsGlobal("div_global_actions", "textido", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}