var solver;
function main() {
	var drawer = new Drawer();
	solver = DummySolver();
	var spanState = document.getElementById("span_resolution_state");
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colors = {
		openStitchOut : '#8800ff',
		openStitchIn : '#44008f',
		marginWrite : '#000044',
		bind : '#008844',
		isolateRegion : '#ff0000',
		closedSpace : COLOURS.CLOSED_WILD
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength); 
		drawer.drawMarginLeftUpOne(context, solver.numbersMarginsLeft, solver.numbersMarginsUp, FONTS.ARIAL);
		drawInsideSpaces(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas, 30);
	var fieldName = document.getElementById("input_grid_name");
	
	const defaultPuzzleValue = "30";
	const puzzleTypeName = "Stitches";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event) {
		loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value);
		document.getElementById("span_bounds").innerHTML = solver.numberBounds;
	});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", ENTRY.SPACE, [ACTION_PUT_STITCH, ACTION_PUT_NO_FILL, ACTION_PASS_ROW, ACTION_PASS_COLUMN]);
	buildInputCanvas("div_canvas2_buttons", actionsManager, "case", ENTRY.WALLS, [ACTION_BIND_STITCHES, ACTION_NOT_BIND_STITCHES, ACTION_PASS_BORDER]);
	buildActionsGlobal("div_global_actions", ["Multipasse", "Annuler"], 
		[function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}