var solver;

function main() {
	const colors = {
		noLink:'#aa0000',
		noLinkWall:'#ff8800',
		presentLink:'#cc00ff',
		oppositeSpaceWrite:'#0000ff'		
	}

	var drawer = new Drawer(colors);
	solver = DummySolver(); 
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");


	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength);
		drawer.drawSolverLinkInsideSpaces(context, colors, solver, solver.gridWall);
		solver.callStateForItem(spanState);
	}
	
	setInterval(drawCanvas, 30);

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)}, false);
	const defaultPuzzleValue = "59";
	const puzzleTypeName = "EntryExit";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "texti", ENTRY.SPACE, [ACTION_NOTHING, ACTION_PASS_REGION]);
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "textid", ENTRY.WALLS, [ACTION_LINK_SPACES, ACTION_CLOSE_LINKS, ACTION_NOTHING]);
	buildActionsGlobal("div_global_actions", "textido", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
	initializeItemsLoopInfos("div_common_loop_display", solver);	
}
