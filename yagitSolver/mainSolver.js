var solver;

function main() {
	var colors = {
		circleArea : "#bbbbff",
		//circleIn : "#000088", // Note : shapes already drawn by main drawer
		//circleOut : "#8844ff",
		squareArea : "#bbffbb", // TODO : make it colorblind-friendly !
		//squareIn : "#008800",
		//squareOut : "#00cc44"
	}; 
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");
	
	const extraIndications = {checkBoxColorDeadEnds : document.getElementById("checkbox_color_deadEnds")};

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawing(context, drawer, colors, solver, extraIndications);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas, 30);
		
	const defaultPuzzleValue = "174";
	const puzzleTypeName = "Yagit";
	
	buildPuzzleManagementMenu("div_puzzle_management", "input_grid_name", "submit_load_grid", puzzleTypeName, defaultPuzzleValue);
	putActionElementClick("submit_load_grid", function(event){loadAction(canevas, drawer, solver, puzzleTypeName, document.getElementById("input_grid_name").value)});
	buildQuickStart("div_quickStart", function(event){quickStartAction(solver)});
	buildInputCanvas("div_canvas_buttons", actionsManager, "cloison", "textidw", ENTRY.WALLS, [ACTION_CLOSE_FENCE, ACTION_OPEN_FENCE, ACTION_NOTHING]);
	buildInputCanvas("div_canvas_buttons", actionsManager, "case", "textids", ENTRY.SPACE, [ACTION_NOTHING, ACTION_PASS_AROUND_SPACE]);
	buildInputCanvas("div_canvas_buttons", actionsManager, "noeud", "textidc", ENTRY.CORNER, [ACTION_NOTHING, ACTION_PASS_AROUND_KNOT]);
	buildActionsGlobal("div_global_actions", "textido", ["Multipasse", "Annuler"], [function(event){multipassAction(solver)}, function(event){undoAction(solver)}] );
}