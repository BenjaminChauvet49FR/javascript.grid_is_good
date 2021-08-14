var drawer = new Drawer();
var solver;
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionsManager = {}; 

function main() {
	solver = DummySolver();
	var colourSet = {
		numberWriteFixed : '#880044',
		numberWriteNotFixed : '#440088'
	}
	
	var spanState = document.getElementById("span_resolution_state");

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colourSet, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas, 30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "Hakyuu";
	putActionElementClick("submit_view_puzzle_list", function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart", function(event){quickStartAction(solver)});
	putActionElementClick("submit_multipass", function(event){multipassAction(solver)});
	putActionElementClick("submit_undo", function(event){undoAction(solver)});

	// ------
	
	addEventsListenersAndCaptionsAndSetOne(actionsManager, 
	"text_canvas_action", ["submit_enter_number", "submit_pass_region"], 
	ENTRY.SPACE, [ACTION_ENTER_NUMBER, ACTION_PASS_REGION]);
}
