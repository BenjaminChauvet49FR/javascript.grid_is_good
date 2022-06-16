var solver;
var purificator;
function main() {
	var colours = {
		numberWrite : COLOURS.WRITE_IN_FENCES,
		purification : COLOURS.PURIFICATION_SYMBOL_GRID,
		cluesWrite : COLOURS.CLUE_INDICATING
	}; 
	purificator = DummyPurificatorSymbolArray();
	purificator.configure({blockedSymbol : SYMBOL_ID.QUESTION , isBlockedDegradable : true}); 
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");
	var actionsManagerSet = new ActionsManagersSet(2, 0); // 2 as the number of required actions managers set (equal to the number of sub menus)
	const extraIndications = {checkBoxPossibilities : document.getElementById("checkbox_possibilities")};


	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawing(context, drawer, colours, solver, purificator, extraIndications);
		solver.callStateForItem(spanState);
	}

	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, purificator, actionsManagerSet)}, false);
	const defaultPuzzleValue = "55";
	const puzzleTypeName = "Firumatto";
	
	// Load menu
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadActionCOMPLETE(canevas, drawer, {solver : solver, purificator : purificator}, puzzleTypeName, document.getElementById("input_grid_name").value);
	});
	
	// A synthetizing game menu
	buildPuzzleMenuButtons("div_main_buttons", 
		["Résoudre en mode automatique", "Purifier"],
		[function(event){startAction(purificator, solver); }, 
		function(event){toPurificationModeAction(purificator, solver);}],
		["div_solving", "div_purifying"],
		actionsManagerSet
	);
	
	// Solver mode
	buildInputCanvas("div_solving_canvas_buttons", actionsManagerSet.getActionsManager(0), "case", ENTRY.SPACE, [ACTION_NOTHING, ACTION_PASS_AROUND_SPACE]);
	buildInputCanvas("div_solving_canvas_buttons2", actionsManagerSet.getActionsManager(0), "cloison", ENTRY.WALLS, [ACTION_CLOSE_FENCE, ACTION_OPEN_FENCE, ACTION_NOTHING]);
	buildActionsGlobal("div_solving_global_actions", ["Démarrage rapide", "Multipasse", "Résolution", "Annuler"], 
		[function(event){quickStartAction(solver)}, function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );
	
	// Purificator mode
	buildInputCanvas("div_cleaning_canvas_buttons", actionsManagerSet.getActionsManager(1), "case", ENTRY.SPACE, [ACTION_PURIFY_SPACE, ACTION_UNPURIFY_SPACE]);
	buildActionsGlobal("div_cleaning_global_actions", ["Annuler", "Sauver", "Recherche des puzzles minimaux"], 
		[function(event){undoPurificationAction(purificator)}, 
		 function(event){savePurifiedAction(purificator, puzzleTypeName, document.getElementById("input_grid_name").value)},
		 function(event){findMinimalPuzzles(purificator, solver)}]
	);
}