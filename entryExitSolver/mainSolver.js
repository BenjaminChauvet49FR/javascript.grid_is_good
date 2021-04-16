var solver;

function main() {
	var colors = {
		closed_wall:'#222222',
		open_wall:'#dddddd',
		edge_walls:'#000000',
		bannedSpace:'#666666',
		noLink:'#aa0000',
		noLinkWall:'#ff8800',
		presentLink:'#cc00ff',
		noLinkState:'#448844',
		presentLinkState:'#ddeeff',
		numberWrite:'#008800',
		oppositeSpaceWrite:'#0000ff'
	}

	var drawer = new Drawer(colors);
	solver = DummySolver(); 
	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	//--------------------
	//The main draw function (at start)
	function drawCanvas() {
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength);
		drawer.drawSolverLinkInsideSpaces(context, colors, solver, solver.gridWall);
	}

	canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,solver,actionsManager)},false);
	setInterval(drawCanvas,30);
	var fieldName = document.getElementById("input_grid_name");

	const puzzleTypeName = "EntryExit";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver)});
	putActionElementClick("submit_multipass",function(event){multiPassAction(solver)});
	putActionElementClick("submit_undo",function(event){undoAction(solver)});
	putActionElementClick("submit_color_chains",function(event){solver.seeColorChainsAction()}); 
	putActionElementClick("submit_see_opposite_ends",function(event){solver.seeOppositeEndsAction()});
	putActionElementClick("submit_mask_information_chains",function(event){solver.maskChainsInformation()});

	//------

	var textActionSpace = document.getElementById("text_canvas_action_space");
	var textActionWall = document.getElementById("text_canvas_action_wall");
	setMode(textActionSpace,actionsManager,ENTRY.SPACE,ACTION_CLOSE_SPACE);
	setMode(textActionWall,actionsManager,ENTRY.WALLS,ACTION_LINK_SPACES);
	addEventListenerAndCaption("submit_open_space", ENTRY.SPACE, ACTION_OPEN_SPACE, textActionSpace);
	addEventListenerAndCaption("submit_close_space", ENTRY.SPACE, ACTION_CLOSE_SPACE, textActionSpace);
	addEventListenerAndCaption("submit_link_spaces", ENTRY.WALLS, ACTION_LINK_SPACES, textActionWall);
	addEventListenerAndCaption("submit_close_links", ENTRY.WALLS, ACTION_CLOSE_LINKS, textActionWall);
	addEventListenerAndCaption("submit_pass_space", ENTRY.SPACE, ACTION_PASS_SPACE, textActionSpace);

	function addEventListenerAndCaption(p_identifier, p_entry, p_action, p_textAction) { //Shortcut action
		addEventListenerAndCaptionActionSubmit(actionsManager, p_textAction, p_identifier, p_entry, p_action);
	}
}
