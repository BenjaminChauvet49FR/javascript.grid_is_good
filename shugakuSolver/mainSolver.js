var solver;

function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colors = {
		openSquare : '#ccffff',
		closedSquare : '#88ff88',
		numberWrite : '#440088',
		shape : '#004488'
	}

	const coloursFence = {
		closed_fence: '#cc0000',
		undecided_fence: '#cccccc',
		open_fence: '#eeeeff'
	}
	drawer.setFenceColors(coloursFence);

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWalllessGrid(context, null, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colors, solver);
	}
	setInterval(drawCanvas, 30);
	
	canevas.addEventListener('click', function(event){clickCanvas(event, canevas, drawer, solver, actionsManager)}, false);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "Shugaku";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart", function(event){quickStartAction(solver)});
	putActionElementClick("submit_multiPass", function(event){multiPassAction(solver)});
	putActionElementClick("submit_undo", function(event){undoAction(solver)});

	//------

	var textActionSpace = document.getElementById("text_canvas_action_space");
	var textActionWall = document.getElementById("text_canvas_action_fence");
	setMode(textActionSpace, actionsManager,ENTRY.SPACE, ACTION_OPEN_SPACE);
	setMode(textActionWall, actionsManager,ENTRY.WALLS, ACTION_CLOSE_FENCE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_open_space", ENTRY.SPACE, ACTION_OPEN_SPACE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_close_space", ENTRY.SPACE, ACTION_CLOSE_SPACE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_put_round", ENTRY.SPACE, ACTION_PUT_ROUND);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_put_square", ENTRY.SPACE, ACTION_PUT_SQUARE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionWall, "submit_open_fence", ENTRY.WALLS, ACTION_OPEN_FENCE);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionWall, "submit_close_fence", ENTRY.WALLS, ACTION_CLOSE_FENCE);
}
