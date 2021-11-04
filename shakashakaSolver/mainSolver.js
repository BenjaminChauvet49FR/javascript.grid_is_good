var solver;

function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var spanState = document.getElementById("span_resolution_state");
	var actionsManager = {}; 
	var drawIndications;

	var colors = {
		whiteTriangle : "#cceeff",
		blackTriangle : "#000000",
		bannedSpace : "#000044",
		numberWrite : "#ffff88",
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength); 
		drawInsideSpacesAutonomous(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	const defaultPuzzleValue = "1";
	const puzzleTypeName = "Shakashaka";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "texti", ENTRY.SPACE, [ACTION_PUT_BLACK_QUARTER_TRIANGLE, ACTION_PUT_WHITE_QUARTER_TRIANGLE, ACTION_PASS_SPACE]);
	buildActionsGlobal("div_global_actions", "textido", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}

