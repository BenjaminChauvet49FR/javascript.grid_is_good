var solver;

function main() {
	var colours = {
		fixedNumber : COLOURS.FIXED_NUMBER,
		notFixedNumber : COLOURS.NOT_FIXED_NUMBER,
		selectedSpace : COLOURS.SELECTED_SPACE,
		selectedCornerSpace : COLOURS.SELECTED_CORNER_SPACE,
	}; // Note : see Usotatami to see why fences colours aren't handled there.
	

	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var selectedSpacesGrid = new InputSpacesSelection(solver.xLength, solver.yLength);
	var spanState = document.getElementById("span_resolution_state");

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawing(context, drawer, colours, solver, selectedSpacesGrid);
		solver.callStateForItem(spanState);
	}

	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager, selectedSpacesGrid)}, false);
	const defaultPuzzleValue = "7";
	const puzzleTypeName = "Fillomino";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value);
		selectedSpacesGrid.restartSelectedSpaces(solver.xLength, solver.yLength);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_ENTER_NUMBER, ACTION_PASS_AROUND_SPACE, ACTION_SELECTION_RECTANGLE]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "cloison", ENTRY.WALLS, [ACTION_CLOSE_FENCE, ACTION_OPEN_FENCE, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Déselectionner cases", "Passer sélection", "Annuler", "Résolution"], 
		[function(event){multipassAction(solver)}, 
		function(event){unselectAction(solver, selectedSpacesGrid)}, function(event){selectionPassAction(solver, selectedSpacesGrid)},
		function(event){undoAction(solver)}, function(event){solveAction(solver)}] );
}