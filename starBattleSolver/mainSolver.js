var solver;
function main() { 
	var drawer = new Drawer();
	solver = DummySolver();
	var selectedSpacesGrid = new InputSpacesSelection(solver.xyLength, solver.xyLength);
	
	var spanState = document.getElementById("span_resolution_state");
	var canevasInteraction = document.getElementById("canevas");
	var	context = canevasInteraction.getContext("2d");
	var actionsManager  = {};

	var colours = {
		emptySpace : COLOURS.X_LIGHT,
		selectedSpace : COLOURS.SELECTED_SPACE,
		selectedCornerSpace : COLOURS.SELECTED_CORNER_SPACE
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xyLength, solver.xyLength); 
		drawInsideSpaces(context, drawer, colours, solver, selectedSpacesGrid);
		solver.callStateForItem(spanState);
	}

	setInterval(drawCanvas,30);
	
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager, selectedSpacesGrid)},false);
	
	const defaultPuzzleValue = "27";
	const puzzleTypeName = "SternenSchlacht";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
		selectedSpacesGrid.restartSelectedSpaces(solver.xyLength, solver.xyLength);
		document.getElementById("span_stars").innerHTML = solver.numberStars;
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_PUT_STAR, ACTION_PUT_NO_FILL, ACTION_PASS_REGION, ACTION_PASS_ROW, ACTION_PASS_COLUMN, ACTION_SELECTION_RECTANGLE, ACTION_SELECTION_REGION]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Résolution", 'Résolution "avancée"', "Passer sélection", "Déselectionner", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){solveActionII(solver)}, function(event){selectionPassAction(solver, selectedSpacesGrid)}, 
		function(event){unselectAction(solver, selectedSpacesGrid)}, function(event){undoAction(solver)}] );
}