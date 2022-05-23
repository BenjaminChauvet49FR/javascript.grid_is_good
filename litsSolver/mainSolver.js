var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var spanState = document.getElementById("span_resolution_state");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colours = {
		openSpace : COLOURS.OPEN_WILD,
		closedSpace : COLOURS.CLOSED_WILD,
		LSpace : COLOURS.LITS_L_DARK,
		ISpace : COLOURS.LITS_I_DARK,
		TSpace : COLOURS.LITS_T_DARK,
		SSpace : COLOURS.LITS_S_DARK,
		LSpaceLight : COLOURS.LITS_L_LIGHT,
		ISpaceLight : COLOURS.LITS_I_LIGHT,
		TSpaceLight : COLOURS.LITS_T_LIGHT,
		SSpaceLight : COLOURS.LITS_S_LIGHT,
		colourblindWrite : COLOURS.STANDARD_COLOURBLIND_WRITE	
	}

	const checkBoxColourblindFriendly = document.getElementById("checkbox_colourblind_friendly");

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colours, solver, checkBoxColourblindFriendly.checked);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas,30);
	
	const defaultPuzzleValue = "30";
	const puzzleTypeName = "LITS";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
		resetCheckboxAdjacency(solver);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PASS_REGION, ACTION_PASS_REGION_AND_ADJACENCY_SPACES]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
	buildAdjacency("div_adjacency", solver, function(event){formerLimitsExplorationAction(solver)});
}