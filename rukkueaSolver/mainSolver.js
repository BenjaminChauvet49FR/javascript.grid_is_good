var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");
	var selectedSpacesGrid = new InputSpacesSelection(solver.xLength, solver.yLength);

	var colours = {
		filledSpace : COLOURS.RUKKUEA_SQUARE,
		emptySpace : COLOURS.X_LIGHT, 
		numberWrite : COLOURS.WRITE_WITHIN_FIELD,
		selectedSpace : COLOURS.SELECTED_SPACE,
		selectedCornerSpace : COLOURS.SELECTED_CORNER_SPACE
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength);
		drawInsideSpaces(context, drawer, colours, solver, selectedSpacesGrid);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager, selectedSpacesGrid)},false);
	const defaultPuzzleValue = "20";
	const puzzleTypeName = "Rukkuea";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value);
		selectedSpacesGrid.restartSelectedSpaces(solver.xLength, solver.yLength);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_FILL_SPACE, ACTION_PUT_NO_FILL, ACTION_PASS_ROW_COLUMN, ACTION_SELECTION_RECTANGLE]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Passe totale", "Passer sélection", "Déselectionner", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){totalpassAction(solver)},
		function(event){selectionPassAction(solver, selectedSpacesGrid)}, 
		function(event){unselectAction(solver, selectedSpacesGrid)}, 
		function(event){undoAction(solver)}] );
	
}