var solver;

function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	purificator = DummyPurificatorSymbolArray(); 
	purificator.configure({blockedSymbol : SYMBOL_ID.X , isBlockedDegradable : false});
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");
	var actionsManagerSet = new ActionsManagersSet(2, 0); 

	var colours = {
		openSpace : COLOURS.OPEN_KABE_LIGHT,
		closedSpace : COLOURS.SHUGAKU_DOMINO_INNER,
		numberWrite : COLOURS.SHUGAKU_SHAPE_OUTER,
		shapeOuter : COLOURS.SHUGAKU_SHAPE_OUTER,
		shapeInner : COLOURS.SHUGAKU_SHAPE_INNER,
		purification : COLOURS.PURIFICATION_SYMBOL_GRID
	}

	const coloursFence = {
		closed_fence : COLOURS.SHUGAKU_DOMINO_OUTER,
		undecided_fence : COLOURS.UNDECIDED_FENCE,
		open_fence : COLOURS.OPEN_FENCE
	}
	drawer.setFenceColours(coloursFence);

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colours, solver, purificator);
		solver.callStateForItem(spanState);
	}
	setInterval(drawCanvas, 30);
	
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, purificator, actionsManagerSet)}, false);
		
	const defaultPuzzleValue = "6";
	const puzzleTypeName = "Shugaku";
	
	// Load and start menu
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadActionCOMPLETE(canevas, drawer, {solver : solver, purificator : purificator}, puzzleTypeName, document.getElementById("input_grid_name").value);
		resetCheckboxAdjacency(solver);
	});
		
	// A synthetizing game menu
	buildPuzzleMenuButtons("div_main_buttons", 
		["Résoudre en mode automatique", "Purifier"],
		[function(event){startAction(purificator, solver); }, 
		function(event){toPurificationModeAction(purificator, solver); }], // For the 3rd button, see Yajikabe. (don't forget to increase the size of actionsManagerSet)
		["div_solving", "div_purifying"],
		actionsManagerSet
	);	
		
	// Solver mode
	buildInputCanvas("div_solving_canvas_buttons", actionsManagerSet.getActionsManager(0), "case", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PUT_ROUND, ACTION_PUT_SQUARE, ACTION_PASS_SPACE]);
	buildInputCanvas("div_solving_canvas2_buttons", actionsManagerSet.getActionsManager(0), "cloison", ENTRY.WALLS, [ACTION_OPEN_FENCE, ACTION_CLOSE_FENCE, ACTION_NOTHING]);
	buildActionsGlobal("div_solving_global_actions", ["Démarrage rapide", "Multipasse", "Résolution", "Annuler"], 
		[function(event){quickStartAction(solver)}, function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );
	buildAdjacency("div_adjacency", solver, function(event){formerLimitsExplorationAction(solver)});
	
	// Purificator mode
	buildInputCanvas("div_cleaning_canvas_buttons", actionsManagerSet.getActionsManager(1), "case", ENTRY.SPACE, [ACTION_PURIFY_SPACE, ACTION_UNPURIFY_SPACE]);
	buildActionsGlobal("div_cleaning_global_actions", ["Annuler", "Sauver", "Recherche des puzzles minimaux"], 
		[function(event){undoPurificationAction(purificator)}, 
		 function(event){savePurifiedAction(purificator, puzzleTypeName, document.getElementById("input_grid_name").value)},
		 function(event){findMinimalPuzzles(purificator, solver)}] 
	);
}