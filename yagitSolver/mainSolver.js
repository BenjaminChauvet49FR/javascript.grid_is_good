var solver;

function main() {
	var colours = {
		circleArea : COLOURS.YAGIT_ROUND_AREA, // Note : shapes already drawn by main drawer
		squareArea : COLOURS.YAGIT_SQUARE_AREA,
		deadEndArea : COLOURS.DEAD_END_AREA,
		colourBlind : COLOURS.STANDARD_COLOURBLIND_WRITE
	}; 
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");
	
	const extraIndications = {checkBoxColourDeadEnds : document.getElementById("checkbox_colour_deadEnds"), checkBoxColourblindFriendly : document.getElementById("checkbox_colourblind_friendly")};

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawing(context, drawer, colours, solver, extraIndications, );
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas, 30);
		
	const defaultPuzzleValue = "174";
	const puzzleTypeName = "Yagit";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "cloison", ENTRY.WALLS, [ACTION_CLOSE_FENCE, ACTION_OPEN_FENCE, ACTION_NOTHING]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_NOTHING, ACTION_PASS_AROUND_SPACE]);
	buildInputCanvas("div_canvas3_buttons", actionsManager, "noeud", ENTRY.CORNER, [ACTION_NOTHING, ACTION_PASS_AROUND_KNOT]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler"], [function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}