var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colors = {
		openSquare : '#00ffcc',
		chocolateSquare : '#ffcccc',
		lackingSquare : '#bbbbbb',
		insideIndicationsOnWhite : '#008800',
		insideIndicationsOnFilled : '#0000ff',
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colors, solver);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "Chocona";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver,null)});
	putActionElementClick("submit_multipass",function(event){multiPassAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver,null)});

	//------

	var textAction = document.getElementById("text_canvas_action");
	setMode(textAction,actionsManager,ENTRY.SPACE,ACTION_CLOSE_SPACE);
	addEventListenerAndCaption("submit_open_space",ACTION_OPEN_SPACE);
	addEventListenerAndCaption("submit_close_space",ACTION_CLOSE_SPACE);
	addEventListenerAndCaption("submit_pass_region",ACTION_PASS_REGION);
	function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
		addEventListenerAndCaptionActionSubmit(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
	}
}