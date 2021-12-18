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
		openSquare : '#ccffff',
		closedSquare : '#88ff88',
		numberWrite : '#440088',
		shape : '#004488'
	}

	const coloursFence = {
		closed_fence: '#cc0000',
		undecided_fence: '#cccccc',
		open_fence: '#eeeeff'
	}
	drawer.setFenceColors(coloursFence);

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}
	setInterval(drawCanvas, 30);
	
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
		
	const defaultPuzzleValue = "1";
	const puzzleTypeName = "Shugaku";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "texti", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PUT_ROUND, ACTION_PUT_SQUARE, ACTION_PASS_SPACE]);
	buildInputCanvas("div_canvas_buttons", actionsManager, "cloison", "textid", ENTRY.WALLS, [ACTION_OPEN_FENCE, ACTION_CLOSE_FENCE, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", "textido", 
	["Multipasse", "Résolution", "Annuler"], [function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );

}