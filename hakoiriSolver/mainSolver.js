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
	
	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "Hakoiri";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart", function(event){quickStartAction(solver)});
	putActionElementClick("submit_multiPass", function(event){multipassAction(solver)});
	putActionElementClick("submit_undo", function(event){undoAction(solver)});

	//------

	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action", ["submit_open_space", "submit_close_space", "submit_put_round", "submit_put_square", "submit_put_triangle", "submit_pass_space"], 
	ENTRY.SPACE, [ACTION_OPEN_SPACE, ACTION_CLOSE_SPACE, ACTION_PUT_ROUND, ACTION_PUT_SQUARE, ACTION_PUT_TRIANGLE, ACTION_PASS_SPACE]);
}
