var solver;

function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 

	var colours = {
		cross : '#880044', 
		crossLight : '#ff88cc', 
		standardWrite : '#000000', 
		reflectWrite : '#ffff88',
	}
	
	var spanState = document.getElementById("span_resolution_state");

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context,solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colours, solver);
		solver.callStateForItem(spanState);
	}
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	const defaultPuzzleValue = "20";
	const puzzleTypeName = "Stostone";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_FILL_SPACE, ACTION_PUT_NO_FILL, ACTION_PASS_REGION, ACTION_PASS_COLUMN]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler", "Résolution"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}, function(event){solveAction(solver)}] );
}
