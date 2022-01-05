var drawer = new Drawer();
var solver, purificator;
var canevas = document.getElementById("canevas");
var spanState = document.getElementById("span_resolution_state");
var	context = canevas.getContext("2d");
var actionsManagersSet = new ActionsManagersSet(3, 0); 

function main() {
	solver = DummySolver();
	purificator = DummyPurificatorSudoku();
	purificator.configure({isBlockedDegradable : true});
	var mouseCoorsItem = {item : null};
	var selectedSpacesGrid = new InputSpacesSelection(solver.xLength, solver.yLength);
	var colourSet = {
		numberWriteFixed : COLOURS.FIXED_NUMBER,
		numberWriteNotFixed : COLOURS.NOT_FIXED_NUMBER,
		selectedSpace : COLOURS.SELECTED_SPACE,
		selectedCornerSpace : COLOURS.SELECTED_CORNER_SPACE,
		purification : COLOURS.PURIFICATION_SYMBOL_GRID
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength, selectedSpacesGrid); 
		drawInsideSpaces(context, drawer, colourSet, solver, purificator, selectedSpacesGrid);
		drawer.drawSudokuFrames(context, solver, mouseCoorsItem); 
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('mousemove', function(event){catchMouse(event, canevas, drawer, solver, mouseCoorsItem)});
	canevas.addEventListener('mouseleave', function(event){mouseCoorsItem.item = null});
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, purificator, actionsManagersSet, selectedSpacesGrid)}, false);
	setInterval(drawCanvas, 30);
	var fieldName = document.getElementById("input_grid_name");
	var fieldMode = document.getElementById("select_puzzle_type");
	fillSudokuSelectCombobox(fieldMode);

	function puzzleName() {
		const sudokuMode = getSudokuIdFromLabel(fieldMode.value);
		return "Sudoku" + "_" + sudokuMode.savedId + "_";
	}

	// Load menu
	putActionElementClick("submit_view_puzzle_list_all", function(event){viewPuzzleList("Sudoku_")});
	putActionElementClick("submit_view_puzzle_list_specific", function(event){viewPuzzleList("Sudoku_" + getSudokuIdFromLabel(fieldMode.value).savedId + "_")});
	putActionElementClick("submit_load_grid", function(event){
		loadActionCOMPLETE(canevas, drawer, {solver : solver, purificator : purificator}, puzzleName(), fieldName.value, {sudokuMode : getSudokuIdFromLabel(fieldMode.value)});
		selectedSpacesGrid.restartSelectedSpaces(solver.xLength, solver.yLength);
	});

	// A synthetizing game menu
	buildPuzzleMenuButtons("div_main_buttons", 
		["Résoudre en mode automatique", "Purifier"],
		[function(event){startAction(purificator, solver, getSudokuIdFromLabel(fieldMode.value)); }, 
		function(event){toPurificationModeAction(purificator, solver, getSudokuIdFromLabel(fieldMode.value)); }],
		["div_solving", "div_purifying"],
		actionsManagersSet
	);

	// Solver mode
	buildInputCanvas("div_solving_canvas_buttons", actionsManagersSet.getActionsManager(0), "case", ENTRY.SPACE, [ACTION_ENTER_NUMBER, ACTION_PASS_GRIDS, ACTION_SELECTION_RECTANGLE]);
	buildActionsGlobal("div_solving_global_actions", ["Démarrage rapide", "Passe totale (résolution)", "Déselectionner cases", "Passer cases sélectionnées", "Annuler"], 
		[function(event){quickStartAction(solver)}, function(event){totalPassAction(solver)}, function(event){unselectAction(solver, selectedSpacesGrid)}, function(event){selectionPassAction(solver, selectedSpacesGrid)}, function(event){undoAction(solver)}] );

	// Purificator mode
	buildInputCanvas("div_cleaning_canvas_buttons", actionsManagersSet.getActionsManager(1), "case", ENTRY.SPACE, [ACTION_PURIFY_SPACE, ACTION_UNPURIFY_SPACE]);
	buildActionsGlobal("div_cleaning_global_actions", ["Annuler", "Sauver"], 
		[function(event){undoPurificationAction(purificator)}, 
		 function(event){savePurifiedAction(purificator, puzzleName(), document.getElementById("input_grid_name").value, {sudokuMode : getSudokuIdFromLabel(fieldMode.value)})}]
	);

}
