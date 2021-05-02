var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colors = {
		openStitchOut : '#8800ff',
		openStitchIn : '#44008f',
		marginWrite : '#000044',
		bind : '#008844',
		isolate : '#880000',
		isolateRegion : '#ff0000',
		closedSpace : '#cc0022'
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas(){
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawer.drawMarginLeftUpOne(context, solver.numbersMarginsLeft, solver.numbersMarginsUp);
		drawInsideSpaces(context, drawer, colors, solver);
	}

	canevas.addEventListener('click', function(event){clickCanvas(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "Stitches";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
	putActionElementClick("submit_multiPass",function(event){multiPassAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver)});

	//------

	var textActionSpace = document.getElementById("text_canvas_action_space");
	var textActionLink = document.getElementById("text_canvas_action_link");
	setMode(textActionSpace, actionsManager, ENTRY.SPACE, ACTION_PUT_STITCH);
	setMode(textActionLink, actionsManager, ENTRY.WALLS, ACTION_BIND_STITCHES);
	addEventListenerAndCaption("submit_fill_space", ENTRY.SPACE, ACTION_PUT_STITCH, textActionSpace);
	addEventListenerAndCaption("submit_put_X", ENTRY.SPACE, ACTION_PUT_NO_FILL, textActionSpace);
	addEventListenerAndCaption("submit_bind", ENTRY.WALLS, ACTION_BIND_STITCHES, textActionLink);
	addEventListenerAndCaption("submit_not_bind", ENTRY.WALLS, ACTION_NOT_BIND_STITCHES, textActionLink);
	addEventListenerAndCaption("submit_pass_border", ENTRY.WALLS, ACTION_PASS_BORDER, textActionLink);
	addEventListenerAndCaption("submit_pass_row", ENTRY.SPACE, ACTION_PASS_ROW, textActionSpace);
	addEventListenerAndCaption("submit_pass_column", ENTRY.SPACE, ACTION_PASS_COLUMN, textActionSpace);


	function addEventListenerAndCaption(p_identifier, p_entry, p_action, p_textAction) { 
		addEventListenerAndCaptionActionSubmit(actionsManager, p_textAction, p_identifier, p_entry, p_action);
	}
}