var solver;
function main() { 
	var drawer = new Drawer();
	solver = DummySolver();
	var selectedSpacesGrid = new InputSpacesSelection(solver.xyLength, solver.xyLength);
	
	var spanState = document.getElementById("span_resolution_state");
	var canevasInteraction = document.getElementById("canevas");
	var	context = canevasInteraction.getContext("2d");
	var actionsManager  = {};
	var drawIndications;

	var colors = {
		emptySquare : '#cccccc',
		starIndication : "#00cccc",
		crossIndication : "#cc0000",
		regionIndication : "#008800",
		selectedSpace : '#bbffcc',
		selectedCornerSpace : '#bbccff'
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xyLength, solver.xyLength); 
		drawInsideSpaces(context, drawer, colors, solver, selectedSpacesGrid);
		solver.callStateForItem(spanState);
	}

	setInterval(drawCanvas,30);
	//--------------------

	var fieldName = document.getElementById("input_grid_name");
	canevas.addEventListener('click', function(event){clickCanvas(event, canevas, drawer, solver, actionsManager, selectedSpacesGrid)},false);

	const puzzleTypeName = "SternenSchlacht";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("SternenSchlacht")});
	putActionElementClick("submit_load_grid",function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value);
		selectedSpacesGrid.restartSelectedSpaces(solver.xyLength, solver.xyLength);
		document.getElementById("span_stars").innerHTML = solver.numberStars;
	});
	putActionElementClick("submit_undo",function(event){undoAction(solver)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
	putActionElementClick("submit_multiPass",function(event){multiPassAction(solver)});
	putActionElementClick("submit_solve",function(event){solveAction(solver)});
	putActionElementClick("submit_selectionPass",function(event){selectionPassAction(solver, selectedSpacesGrid)});
	putActionElementClick("submit_unselect",function(event){unselectAction(solver, selectedSpacesGrid)});

	var textAction = document.getElementById("text_canvas_action");
	setMode(textAction, actionsManager, ENTRY.SPACE, ACTION_PUT_STAR);
	addEventListenerAndCaption("submit_put_star", ACTION_PUT_STAR);
	addEventListenerAndCaption("submit_put_X", ACTION_PUT_NO_STAR);
	addEventListenerAndCaption("submit_pass_region", ACTION_PASS_REGION);
	addEventListenerAndCaption("submit_pass_row", ACTION_PASS_ROW);
	addEventListenerAndCaption("submit_pass_column", ACTION_PASS_COLUMN);
	addEventListenerAndCaption("submit_select_rectangle", ACTION_SELECTION_RECTANGLE);
	addEventListenerAndCaption("submit_select_region", ACTION_SELECTION_REGION);

	function addEventListenerAndCaption(p_identifier, p_action) { //Shortcut action
		addEventListenerAndCaptionActionSubmit(actionsManager, textAction, p_identifier, ENTRY.SPACE, p_action);
	}
}