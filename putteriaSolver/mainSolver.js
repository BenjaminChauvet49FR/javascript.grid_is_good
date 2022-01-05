var drawer = new Drawer();
var solver;
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {}; 

function main() {
	solver = DummySolver();
	var colourSet = {
		fixedColour : COLOURS.FIXED_NUMBER,
		notFixedColour : COLOURS.NOT_FIXED_NUMBER
	}
	
	var spanState = document.getElementById("span_resolution_state");

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colourSet, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas, 30);
	const defaultPuzzleValue = "30";
	const puzzleTypeName = "Putteria";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_FILL_SPACE, ACTION_PUT_NO_FILL, ACTION_PASS_ALL_REGIONS_SIZE]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler"], [function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}
