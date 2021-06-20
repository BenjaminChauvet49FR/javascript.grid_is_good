var drawer = new Drawer();
var solver;
var canevas = document.getElementById("canevas");
var spanState = document.getElementById("span_resolution_state");
var	context = canevas.getContext("2d");
var actionsManager = {}; 

function main() {
	solver = DummySolver();
	var mouseCoorsItem = {item : null};
	var selectedSpacesGrid = new InputSpacesSelection(solver.xLength, solver.yLength);
	var colourSet = {
		numberWriteFixed : '#880044',
		numberWriteNotFixed : '#440088',
		selectedSpace : '#bbffcc',
		selectedCornerSpace : '#bbccff'
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength, selectedSpacesGrid); 
		drawer.drawSudokuFrames(context, solver, mouseCoorsItem); 
		drawInsideSpaces(context, drawer, colourSet, solver, selectedSpacesGrid);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('mousemove', function(event){catchMouse(event, canevas, drawer, solver, mouseCoorsItem)});
	canevas.addEventListener('mouseleave', function(event){mouseCoorsItem.item = null});
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager, selectedSpacesGrid)}, false);
	setInterval(drawCanvas, 30);
	var fieldName = document.getElementById("input_grid_name");
	var fieldMode = document.getElementById("select_puzzle_type");
	fillSudokuSelectCombobox(fieldMode);

	function puzzleName() {
		const sudokuMode = getSudokuIdFromLabel(fieldMode.value);
		return "Sudoku" + "_" + sudokuMode.savedId + "_";
	}

	putActionElementClick("submit_view_puzzle_list_all", function(event){viewPuzzleList("Sudoku_")});
	putActionElementClick("submit_view_puzzle_list_specific", function(event){viewPuzzleList("Sudoku_" + getSudokuIdFromLabel(fieldMode.value).savedId + "_")});
	putActionElementClick("submit_load_grid", function(event){loadAction(
		canevas, drawer, solver, puzzleName(), fieldName.value, {sudokuMode : getSudokuIdFromLabel(fieldMode.value)})
			selectedSpacesGrid.restartSelectedSpaces(solver.xLength, solver.yLength);
	});
	putActionElementClick("submit_quickStart", function(event){quickStartAction(solver)});
	putActionElementClick("submit_totalPass", function(event){totalPassAction(solver)});
	putActionElementClick("submit_selectionPass",function(event){selectionPassAction(solver, selectedSpacesGrid)});
	putActionElementClick("submit_undo", function(event){undoAction(solver)});
	putActionElementClick("submit_unselect",function(event){unselectAction(solver, selectedSpacesGrid)});

	//------

	var textAction = document.getElementById("text_canvas_action");
	setMode(textAction, actionsManager, ENTRY.SPACE, ACTION_ENTER_NUMBER);
	addEventListenerAndCaption("submit_enter_number", ACTION_ENTER_NUMBER);
	addEventListenerAndCaption("submit_pass_grids", ACTION_PASS_GRIDS);
	addEventListenerAndCaption("submit_select_rectangle", ACTION_SELECTION_RECTANGLE);
	function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
		addEventListenerAndCaptionActionSubmit(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
	}

}
