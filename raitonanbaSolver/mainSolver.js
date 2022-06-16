var solver;
function main() { 
	var drawer = new Drawer();
	solver = DummySolver();
	
	var spanState = document.getElementById("span_resolution_state");
	var canevasInteraction = document.getElementById("canevas");
	var	context = canevasInteraction.getContext("2d");
	var actionsManager  = {};

	var colours = {
		emptySpace : COLOURS.X_LIGHT,
		lightbulb : COLOURS.LIGHT_BULB_LOWER,
		line : COLOURS.KNOT_BORDER,
		x : COLOURS.X_LIGHT,
		block : COLOURS.YAGIT_ROUND_BORDER, 
		numberWrite : COLOURS.WRITE_IN_PURE_GRID,
		litSpace : COLOURS.LIGHT_SPACE,
		lightExpected : COLOURS.LIGHT_BULB,
		noLightExpected : COLOURS.X_LIGHT
	}

	const extraIndications = {checkBoxLights : document.getElementById("checkbox_lateral_lights")};

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colours, solver, extraIndications);
		solver.callStateForItem(spanState);
	}

	setInterval(drawCanvas,30);
	
	
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	
	const defaultPuzzleValue = "27";
	const puzzleTypeName = "Raitonanba";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_PUT_LIGHT, ACTION_PUT_BLOCK, ACTION_PUT_NO_FILL, ACTION_PASS_ROW_COLUMN]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Passe totale", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){totalpassAction(solver)}, function(event){undoAction(solver)}] );
}