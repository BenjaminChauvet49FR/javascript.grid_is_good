var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var spanState = document.getElementById("span_resolution_state");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 

	var colors = {
		openSquare : '#00ffcc',
		closedSquare : '#cc0022',
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength);
		drawer.drawTapaGrid(context, solver.clueGrid);
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "Tapa";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
	putActionElementClick("submit_multipass",function(event){multipassAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver)});

	//------

	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action", ["submit_open_space", "submit_close_space", "submit_pass_around"], 
	ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PASS_AROUND_SPACES]);
}