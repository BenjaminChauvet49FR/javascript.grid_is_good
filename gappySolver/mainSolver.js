var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevasInteraction = document.getElementById("canevas");
	var	context = canevasInteraction.getContext("2d");
	var actionsManager = {};
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");

	var colors = {
		emptySpace : COLOURS.X_LIGHT
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xyLength, solver.xyLength); 
		drawer.drawMarginLeftUpOne(context, solver.numbersMarginsLeft, solver.numbersMarginsUp, FONTS.ARIAL);
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}

	setInterval(drawCanvas, 30);
	
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	const defaultPuzzleValue = "257";
	const puzzleTypeName = "Gappy";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_PUT_STAR, ACTION_PUT_NO_FILL, ACTION_PASS_ROW, ACTION_PASS_COLUMN]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Résolution", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );
}