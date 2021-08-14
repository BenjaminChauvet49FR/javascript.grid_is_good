var solver;
function main() { 
	var drawer = new Drawer();
	solver = DummySolver();
	var selectedSpacesGrid = new InputSpacesSelection(solver.xyLength, solver.xyLength);
	
	var spanState = document.getElementById("span_resolution_state");
	var canevasInteraction = document.getElementById("canevas");
	var	context = canevasInteraction.getContext("2d");
	var actionsManager  = {};
	var drawIndications;

	var colors = {
		emptySquare : '#cccccc',
		starIndication : "#00cccc",
		crossIndication : "#cc0000",
		regionIndication : "#008800",
		selectedSpace : '#bbffcc',
		selectedCornerSpace : '#bbccff'
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xyLength, solver.xyLength); 
		drawInsideSpaces(context, drawer, colors, solver, selectedSpacesGrid);
		solver.callStateForItem(spanState);
	}

	setInterval(drawCanvas,30);
	
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager, selectedSpacesGrid)},false);
	
	const defaultPuzzleValue = "15";
	const puzzleTypeName = "SternenSchlacht";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
		selectedSpacesGrid.restartSelectedSpaces(solver.xyLength, solver.xyLength);
		document.getElementById("span_stars").innerHTML = solver.numberStars;
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "texti", ENTRY.SPACE, [ACTION_PUT_STAR, ACTION_PUT_NO_FILL, ACTION_PASS_REGION, ACTION_PASS_ROW, ACTION_PASS_COLUMN, ACTION_SELECTION_RECTANGLE, ACTION_SELECTION_REGION]);
	buildActionsGlobal("div_global_actions", "textido", ["Multipasse", "Résolution", "Passer sélection", "Déselectionner", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){selectionPassAction(solver, selectedSpacesGrid)}, 
		function(event){unselectAction(solver, selectedSpacesGrid)}, function(event){undoAction(solver)}] );
}