var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var spanState = document.getElementById("span_resolution_state");
	var actionsManager = {}; 
	var selectedSpacesGrid = new InputSpacesSelection(solver.xLength, solver.yLength);

	var colours = {
		openSpace : COLOURS.OPEN_WILD,
		closedSpace : COLOURS.CLOSED_WILD,
		standardWrite : COLOURS.WRITE_WITHIN_OPEN_WILD, 
		reflectWrite : COLOURS.STANDARD_CLOSED_WRITE,
		selectedSpace : COLOURS.SELECTED_SPACE,
		selectedCornerSpace : COLOURS.SELECTED_CORNER_SPACE
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colours, solver, selectedSpacesGrid);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager, selectedSpacesGrid)}, false);
	const defaultPuzzleValue = "48";
	const puzzleTypeName = "Aqre";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value, {isAyeHeya : false});
		selectedSpacesGrid.restartSelectedSpaces(solver.xLength, solver.yLength);
		resetCheckboxAdjacency(solver);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_CLOSE_SPACE, ACTION_OPEN_SPACE, ACTION_PASS_REGION, ACTION_PASS_ROW, ACTION_PASS_COLUMN, ACTION_SELECTION_RECTANGLE, ACTION_SELECTION_REGION]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Passer sélection", "Déselectionner", "Résolution", "Annuler"], 
		[
		function(event){multipassAction(solver)}, 
		function(event){selectionPassAction(solver, selectedSpacesGrid)}, 
		function(event){unselectAction(solver, selectedSpacesGrid)}, 
		function(event){solveAction(solver)},
		function(event){undoAction(solver)}] );
	buildAdjacency("div_adjacency", solver, function(event){formerLimitsExplorationAction(solver)});		
}