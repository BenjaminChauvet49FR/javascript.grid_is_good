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
		openSquare : '#00ffcc',
		closedSquare : '#cc0022',
		truth : '#88dd88',
		lie : '#cc8800',
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

	const puzzleTypeName = "Usoone";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver, null)});
	putActionElementClick("submit_multipass",function(event){multipassAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver,null)});

	//------

	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action", ["submit_close_space", "submit_open_space", "submit_pass_numbers_set"], 
	ENTRY.SPACE, [ACTION_CLOSE_SPACE ,ACTION_OPEN_SPACE, ACTION_PASS_NUMBERS_SET]);
}
