var drawer = new Drawer();
var solver;
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {}; 

function main() {
	solver = DummySolver();
	var colourSet = {
		numberWriteFixed : '#880044',
		numberWriteNotFixed : '#440088'
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
	const defaultPuzzleValue = "1";
	const puzzleTypeName = "Hakyuu";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "texti", ENTRY.SPACE, [ACTION_ENTER_NUMBER, ACTION_PASS_REGION]);
	buildActionsGlobal("div_global_actions", "textido", ["Multipasse", "Annuler"], [function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}
