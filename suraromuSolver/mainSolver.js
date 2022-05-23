var solver;
function main() {
	const colours = {
		noLink : COLOURS.NO_LINK,
		presentLink : COLOURS.LINK,
		noLinkState : COLOURS.NO_LINK_SPACE,
		presentLinkState : COLOURS.LINK_SPACE,
		oppositeSpaceWrite : COLOURS.LOOP_ERGONOMIC_OPPOSITE_END,
		
		labelWrite : COLOURS.SURAROMU_LABEL_WRITE,
		labelBgFixed : COLOURS.SURAROMU_LABEL_BG_FIXED,
		labelBgNotFixed : COLOURS.SURAROMU_LABEL_BG_NOT_FIXED,
		dotsGate : COLOURS.SURAROMU_DOTS_GATE,
		labelBgNotFixed : COLOURS.SURAROMU_LABEL_BG_NOT_FIXED,
		blockedSpace : COLOURS.SURAROMU_BG_BLOCKED_SPACE,
		startIn : COLOURS.SURAROMU_START_POINT_IN,
		startOut : COLOURS.SURAROMU_START_POINT_OUT,
	}

	var drawer = new Drawer(colours);
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");


	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength);
		drawInsideSpaces(context, drawer, colours, solver);
		solver.callStateForItem(spanState);
		// Note : no drawing of non-clue banned spaces
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	const defaultPuzzleValue = "118";
	const puzzleTypeName = "Suraromu";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value);
		document.getElementById("span_gates1").innerHTML = solver.gatesNumber;
		document.getElementById("span_gates2").innerHTML = "0-"+(solver.gatesNumber-1);
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_EXCLUDE_LOOP_SPACE, ACTION_INCLUDE_LOOP_SPACE, ACTION_PASS_GATE_OR_SPACE, ACTION_NOTHING]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "lien", ENTRY.WALLS, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Résolution", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );
	initializeItemsLoopInfos("div_common_loop_display", solver);	
}