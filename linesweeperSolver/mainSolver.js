var solver;
function main() {
	const colours = {
		noLink:'#aa0000',
		presentLink:'#cc00ff',
		noLinkState:'#448844',
		presentLinkState:'#ddeeff',
		oppositeSpaceWrite:'#0000ff',
		
		numberWrite:'#004488'
	}

	var drawer = new Drawer(colours);
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var spanState = document.getElementById("span_resolution_state");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;



	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawEmptyGrid(context, solver.xLength, solver.yLength);
		drawInsideSpaces(context, drawer, colours, solver);
		// Note : no drawing of non-clue banned spaces
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	const defaultPuzzleValue = "8";
	const puzzleTypeName = "Linesweeper";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "texti", ENTRY.SPACE, [ACTION_EXCLUDE_LOOP_SPACE, ACTION_INCLUDE_LOOP_SPACE, ACTION_PASS_SPACE, ACTION_NOTHING]);
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "textid", ENTRY.WALLS, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", "textido", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
	initializeItemsLoopInfos("div_common_loop_display", solver);	
}
