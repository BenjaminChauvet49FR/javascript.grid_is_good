var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var spanState = document.getElementById("span_resolution_state");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colors = {
		openSquare : '#00ffcc',
		closedSquare : '#cc0022',
		LSquare : '#ffcccc',
		ISquare : '#ffcc88',
		TSquare : '#ccffcc',
		SSquare : '#ccccff',
		LSquareLight : '#ffe5e5',
		ISquareLight : '#ffe5c0',
		TSquareLight : '#e5ffe5',
		SSquareLight : '#e5e5ff',
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
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");


	const puzzleTypeName = "LITS";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
	putActionElementClick("submit_multiPass",function(event){multipassAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver)});

	//------
	
	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action", ["submit_open_space", "submit_close_space", "submit_pass_region", "submit_pass_region_and_adjacency"], 
	ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PASS_REGION, ACTION_PASS_REGION_AND_ADJACENCY_SPACES]);

}