var solver;

function main() {
	var colors = {}; 
	var drawer = new Drawer();
	solver = DummySolver();
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;
	var spanState = document.getElementById("span_resolution_state");

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawing(context, drawer, colors, solver);
		solver.callStateForItem(spanState);
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event, canevas, drawer, solver, actionsManager)},false);
	setInterval(drawCanvas, 30);
	var fieldName = document.getElementById("input_grid_name");
	const puzzleTypeName = "Galaxies";

	// Direct actions (includes puzzle management)
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver)});
	putActionElementClick("submit_multipass", function(event){multipassAction(solver)});

	// Canvas actions
	var textActionFence = document.getElementById("text_canvas_action_fence");
	var textActionSpace = document.getElementById("text_canvas_action_space");
	setMode(textActionFence, actionsManager, ENTRY.WALLS, ACTION_CLOSE_FENCE);
	setMode(textActionSpace, actionsManager, ENTRY.SPACE, ACTION_NOTHING);
	addEventListenerAndCaption("submit_open_fence", ENTRY.WALLS, ACTION_OPEN_FENCE, textActionFence);
	addEventListenerAndCaption("submit_close_fence", ENTRY.WALLS, ACTION_CLOSE_FENCE, textActionFence);
	addEventListenerAndCaption("submit_pass_fence", ENTRY.WALLS, ACTION_PASS_FENCE, textActionFence);
	addEventListenerAndCaption("submit_do_nothing_fence", ENTRY.WALLS, ACTION_NOTHING, textActionFence);
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_do_nothing_space", ENTRY.SPACE, ACTION_NOTHING); 
	addEventListenerAndCaptionActionSubmit(actionsManager, textActionSpace, "submit_pass_galaxy", ENTRY.SPACE, ACTION_PASS_GALAXY_DELIMITATION);  


	function addEventListenerAndCaption(p_identifier, p_entry, p_action, p_textAction) { //Shortcut action
		addEventListenerAndCaptionActionSubmit(actionsManager, p_textAction, p_identifier, p_entry, p_action);
	}
}