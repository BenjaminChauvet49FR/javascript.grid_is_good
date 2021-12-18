var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var spanState = document.getElementById("span_resolution_state");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colors = {
		openSquare : '#00ffcc',
		closedSquare : '#cc0022',
		LSquare : '#ffcccc',
		ISquare : '#ffcc88',
		TSquare : '#ccffcc',
		SSquare : '#ccccff',
		LSquareLight : '#ffe5e5',
		ISquareLight : '#ffe5c0',
		TSquareLight : '#e5ffe5',
		SSquareLight : '#e5e5ff',
		insideIndicationsOnWhite : '#008800',
		insideIndicationsOnFilled : '#00ff00',
		standardWrite : '#000000',
		reflectWrite : "#ffff88",
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas,30);
	
	const defaultPuzzleValue = "30";
	const puzzleTypeName = "LITS";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "texti", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PASS_REGION, ACTION_PASS_REGION_AND_ADJACENCY_SPACES]);
	buildActionsGlobal("div_global_actions", "textido", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}