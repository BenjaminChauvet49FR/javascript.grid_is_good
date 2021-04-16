var solver;
function main() {
	var drawer = new Drawer();
	solver = new SolverTheoryCluster();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colors= {
		openSquare : '#00ffcc',
		closedSquare : '#cc0022',
		insideIndicationsOnWhite : '#008800',
		insideIndicationsOnFilled : '#00ff00',
		standardWrite : '#000000',
		reflectWrite : "#ffff88",
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colors, solver);
	}

	canevas.addEventListener('click', function(event){clickCanvas(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "TheoryCluster";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	//putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver)});
	putActionElementClick("submit_discard_hypotheses",function(event){discardDeductionsAction(solver)});

	//------

	var textAction = document.getElementById("text_canvas_action");
	setMode(textAction,actionsManager,ENTRY.SPACE,ACTION_CLOSE_SPACE);
	addEventListenerAndCaption("submit_open_space",ACTION_OPEN_SPACE);
	addEventListenerAndCaption("submit_close_space",ACTION_CLOSE_SPACE);
	addEventListenerAndCaption("submit_open_space_fake",ACTION_OPEN_SPACE_FAKE);
	addEventListenerAndCaption("submit_close_space_fake",ACTION_CLOSE_SPACE_FAKE);
	function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
		addEventListenerAndCaptionActionSubmit(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
	}
}
