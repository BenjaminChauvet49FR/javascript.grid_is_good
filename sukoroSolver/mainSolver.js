var drawer = new Drawer();
var solver, purificator;
var canevas = document.getElementById("canevas");
var spanState = document.getElementById("span_resolution_state");
var	context = canevas.getContext("2d");
var actionsManagersSet = new ActionsManagersSet(3, 0); 

function main() {
	solver = DummySolver();
	purificator = DummyPurificatorSymbolArray(); 
	purificator.configure({isBlockedDegradable : true});
	var colourSet = {
		numberWriteFixed : COLOURS.FIXED_NUMBER,
		numberWriteNotFixed : COLOURS.NOT_FIXED_NUMBER,
		openSpaceFixed : COLOURS.OPEN_WILD,
		openSpaceNotFixed : COLOURS.OPEN_WILD_LIGHT,
		closedNearX : '#440000',
		closedFarX : '#cc88ff',
		purification : COLOURS.PURIFICATION_SYMBOL_GRID
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colourSet, solver, purificator);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, purificator, actionsManagersSet)}, false);
	setInterval(drawCanvas, 30);
	
	const defaultPuzzleValue = "1";
	const puzzleTypeName = "Sukoro";

	// Load menu
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadActionCOMPLETE(canevas, drawer, {solver : solver, purificator : purificator}, puzzleTypeName, document.getElementById("input_grid_name").value);
	});

	// A synthetizing game menu
	buildPuzzleMenuButtons("div_main_buttons", 
		["Résoudre en mode automatique", "Purifier"],
		[function(event){startAction(purificator, solver); }, 
		function(event){toPurificationModeAction(purificator, solver); }],
		["div_solving", "div_purifying"],
		actionsManagersSet
	);

	// Solver mode
	buildInputCanvas("div_solving_canvas_buttons", actionsManagersSet.getActionsManager(0), "case", ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_ENTER_NUMBER, ACTION_PASS_SPACE]);
	buildActionsGlobal("div_solving_global_actions", ["Démarrage rapide", "Multipasse", "Résolution", "Annuler"], 
		[function(event){quickStartAction(solver)}, function(event){multiPassAction(solver)}, function(event){resolveAction(solver)}, function(event){undoAction(solver)}] );

	// Purificator mode
	buildInputCanvas("div_cleaning_canvas_buttons", actionsManagersSet.getActionsManager(1), "case", ENTRY.SPACE, [ACTION_PURIFY_SPACE, ACTION_UNPURIFY_SPACE]);
	buildActionsGlobal("div_cleaning_global_actions", ["Annuler", "Sauver"], 
		[function(event){undoPurificationAction(purificator)}, 
		 function(event){savePurifiedAction(purificator, puzzleName(), document.getElementById("input_grid_name").value, {sudokuMode : getSudokuIdFromLabel(fieldMode.value)})}]
	);

}
