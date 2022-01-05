var solver;

function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");

	var colors = {
		circle : COLOURS.HAKOIRI_ROUND,
		square : COLOURS.HAKOIRI_SQUARE,
		triangle : COLOURS.HAKOIRI_TRIANGLE,
		edge : COLOURS.HAKOIRI_EDGE,
		openFixedSpace : COLOURS.OPEN_KABE,
		openFoundSpace : COLOURS.OPEN_KABE_LIGHT,
	}
	
	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}
	setInterval(drawCanvas, 30);
	
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	
	const defaultPuzzleValue = "1";
	const puzzleTypeName = "Hakoiri";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value, {isCorral : true});
		resetCheckboxAdjacency(solver);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PUT_ROUND, ACTION_PUT_SQUARE, ACTION_PUT_TRIANGLE, ACTION_PASS_REGION]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
	buildAdjacency("div_adjacency", solver, function(event){formerLimitsExplorationAction(solver)});
}
