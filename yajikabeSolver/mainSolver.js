var solver;
var purificator;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	purificator = DummyPurificatorSymbolArray();
	purificator.configure({blockedSymbol : "X" , isBlockedDegradable : true});
	var spanState = document.getElementById("span_resolution_state");
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManagerSet = new ActionsManagersSet(3, 0); // 3 as the number of required actions managers set (equal to the number of sub menus)

	var colours = {
		openSquare : '#00ccff',
		closedSquare : '#cc0022',
		purification : "#ffaaaa"
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength);
		drawer.drawCombinedArrowGridIndications(context, solver.clueGrid);
		drawInsideSpaces(context, drawer, colours, solver, purificator);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, purificator, 
	actionsManagerSet)}, false);
	const defaultPuzzleValue = "19";
	const puzzleTypeName = "Yajikabe";
	
	// Load menu
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadActionCOMPLETE(canevas, drawer, {solver : solver, purificator : purificator}, puzzleTypeName, document.getElementById("input_grid_name").value);
	});
	
	// A synthetizing game menu
	buildPuzzleMenuButtons("div_main_buttons", 
		["Résoudre en mode automatique", "Purifier", "Résoudre en mode manuel"],
		[function(event){startAction(purificator, solver); }, 
		function(event){toPurificationModeAction(purificator, solver); },
		function(event){startActionManual(purificator, solver);}],
		["div_solving", "div_purifying", "div_manual"],
		actionsManagerSet
	);

	// Solver mode
	buildInputCanvas("div_solving_canvas_buttons", actionsManagerSet.getActionsManager(0), "case", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PASS_STRIP]);
	buildActionsGlobal("div_solving_global_actions", ["Démarrage rapide", "Multipasse", "Résolution", "Annuler"], 
		[function(event){quickStartAction(solver)}, function(event){multipassAction(solver)}, function(event){solveAction(solver)}, function(event){undoAction(solver)}] );
	
	// Purificator mode
	buildInputCanvas("div_cleaning_canvas_buttons", actionsManagerSet.getActionsManager(1), "case", ENTRY.SPACE, [ACTION_PURIFY_SPACE, ACTION_UNPURIFY_SPACE]);
	buildActionsGlobal("div_cleaning_global_actions", ["Annuler", "Sauver"], 
		[function(event){undoPurificationAction(purificator)}, 
		 function(event){savePurifiedAction(purificator, puzzleTypeName, document.getElementById("input_grid_name").value)}]
	);
	
	// Manual mode
	buildInputCanvas("div_manual_canvas_buttons", actionsManagerSet.getActionsManager(2), "case", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_NEUTRALIZE_SPACE]);
	buildActionsGlobal("div_manual_global_actions", ["Annuler"], [function(event){undoAction(solver)}]);
}