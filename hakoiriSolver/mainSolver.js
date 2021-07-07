var solver;

function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");

	var colors = {
		circle : '#ff0000',
		square : '#00cc00',
		triangle : '#4400ff',
		edge : '#220044',
		openSquare : '#00ccff'
	}
	
	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}
	setInterval(drawCanvas, 30);
	
	canevas.addEventListener('click', function(event){clickCanvas(event, canevas, drawer, solver, actionsManager)}, false);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "Hakoiri";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart", function(event){quickStartAction(solver)});
	putActionElementClick("submit_multiPass", function(event){multiPassAction(solver)});
	putActionElementClick("submit_undo", function(event){undoAction(solver)});

	//------

	var textActionSpace = document.getElementById("text_canvas_action_space");
	var textActionWall = document.getElementById("text_canvas_action_fence");
	setMode(textActionSpace, actionsManager,ENTRY.SPACE, ACTION_OPEN_SPACE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_open_space", ENTRY.SPACE, ACTION_OPEN_SPACE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_close_space", ENTRY.SPACE, ACTION_CLOSE_SPACE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_put_round", ENTRY.SPACE, ACTION_PUT_ROUND);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_put_square", ENTRY.SPACE, ACTION_PUT_SQUARE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_put_triangle", ENTRY.SPACE, ACTION_PUT_TRIANGLE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_pass_space", ENTRY.SPACE, ACTION_PASS_SPACE);
}
