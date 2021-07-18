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
		circleIn:'#ffe100',
		circleOut:'#300000',
		bannedSpace:'#666666',
		openSquare:'#00ffcc',
		closedSquare:'#cc0022',
		standardWrite:'#000000',
		reflectWrite:"#ffff88",
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength); 
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "CurvingRoad";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("CurvingRoad")});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver, null)});
	putActionElementClick("submit_multipass",function(event){multiPassAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver,null)});

	//------

	var textAction = document.getElementById("text_canvas_action");
	setMode(textAction, actionsManager, ENTRY.SPACE, ACTION_CLOSE_SPACE);
	addEventListenerAndCaption("submit_open_space", ACTION_OPEN_SPACE);
	addEventListenerAndCaption("submit_close_space", ACTION_CLOSE_SPACE);
	addEventListenerAndCaption("submit_pass_space", ACTION_PASS_SPACE);
	function addEventListenerAndCaption(p_identifier,p_action) { //Shortcut action
		addEventListenerAndCaptionActionSubmit(actionsManager, textAction, p_identifier, ENTRY.SPACE, p_action);
	}
}
