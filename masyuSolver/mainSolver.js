var solver;
var purificator;
function main() {
	const colours = {
		noLink : COLOURS.NO_LINK,
		presentLink : COLOURS.LINK,
		noLinkState : COLOURS.NO_LINK_SPACE,
		presentLinkState : COLOURS.LINK_SPACE,
		oppositeSpaceWrite : COLOURS.LOOP_ERGONOMIC_OPPOSITE_END,
		
		circleOut : COLOURS.PEARL_OUT,
		circleBlackIn : COLOURS.BLACK_PEARL_IN,
		circleWhiteIn : COLOURS.WHITE_PEARL_IN,
		purification : COLOURS.PURIFICATION_SYMBOL_GRID
	}

	var drawer = new Drawer(colours);
	solver = DummySolver();
	purificator = DummyPurificatorSymbolArray();
	purificator.configure({isBlockedDegradable : true});
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");
	var actionsManagerSet = new ActionsManagersSet(2, 0);

	//--------------------
	//The main draw function (at start)
	
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength);
		drawInsideSpaces(context, drawer, colours, solver, purificator);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, purificator, actionsManagerSet)},false);
	const defaultPuzzleValue = "289";
	const puzzleTypeName = "Masyu";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadActionCOMPLETE(canevas, drawer, {solver : solver, purificator : purificator}, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	
	// A synthetizing game menu
	buildPuzzleMenuButtons("div_main_buttons", 
		["Résoudre en mode automatique", "Purifier"],
		[function(event){startAction(purificator, solver); }, 
		function(event){toPurificationModeAction(purificator, solver); }],
		["div_solving", "div_purifying"],
		actionsManagerSet
	);
	
	// Solver mode
	buildInputCanvas("div_solving_canvas_buttons", actionsManagerSet.getActionsManager(0), "case", ENTRY.SPACE, [ACTION_EXCLUDE_LOOP_SPACE, ACTION_INCLUDE_LOOP_SPACE, ACTION_PASS_SPACE, ACTION_NOTHING]);
	buildInputCanvas("div_solving_canvas2_buttons", actionsManagerSet.getActionsManager(0), "lien", ENTRY.WALLS, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);
	buildActionsGlobal("div_solving_global_actions", ["Démarrage rapide", "Multipasse", "Annuler"], 
		[function(event){quickStartAction(solver)}, function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
	initializeItemsLoopInfos("div_common_loop_display", solver);	
	
	// Purificator mode
	buildInputCanvas("div_cleaning_canvas_buttons", actionsManagerSet.getActionsManager(1), "case", ENTRY.SPACE, [ACTION_PURIFY_SPACE, ACTION_UNPURIFY_SPACE]);
	buildActionsGlobal("div_cleaning_global_actions", ["Annuler", "Sauver"], 
		[function(event){undoPurificationAction(purificator)}, 
		 function(event){savePurifiedAction(purificator, puzzleTypeName, document.getElementById("input_grid_name").value)}]
	);
}


