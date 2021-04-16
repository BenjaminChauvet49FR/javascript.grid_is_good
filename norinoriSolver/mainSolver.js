function main() {
	var drawer = new Drawer();
	var solver = new SolverNorinori(generateWallArray(1,1),1);

	var canevas = document.getElementById("canevas");
	var	context = canevas.getContext("2d");
	var actionsManager = {}; 
	var drawIndications;

	var colors={
		filledSquare:'#000088',
		emptySquare:'#aaaaaa',
		rainbowSpaces:[],
		insideIndicationsOnWhite:'#008800',
		insideIndicationsOnFilled:'#00ff00',
	}

	//--------------------
	//The main draw function (at start)
	function drawCanvas(){
		drawer.drawWallGrid(context, solver.gridWall, solver.xLength, solver.yLength);
		drawInsideSpaces(context, drawer, colors, solver);
		if (document.getElementById("checkbox_drawIndications").checked){
			drawInsideIndications(context,drawer,colors,solver);	
		}
	}

	canevas.addEventListener('click', function(event){clickCanvasAction(event,canevas,drawer,solver,actionsManager)},false);

	setInterval(drawCanvas,30);

	var fieldName = document.getElementById("input_grid_name");
	var textArea = document.getElementById("textarea_happened");

	const puzzleTypeName = "Norinori";
	putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList(puzzleTypeName)});
	putActionElementClick("submit_load_grid",function(event){loadAction(canevas, drawer, solver, puzzleTypeName, fieldName.value, textArea)});
	putActionElementClick("submit_undo",function(event){undoAction(solver,textArea)});
	putActionElementClick("submit_quickStart",function(event){quickStartAction(solver,textArea)});
	putActionElementClick("submit_multiPass",function(event){multiPassAction(solver,textArea)});

	var textAction = document.getElementById("text_canvas_action");
	setMode(textAction,actionsManager,ENTRY.SPACE,ACTION_FILL_SPACE);
	addEventListenerAndCaption("submit_fill_space",ACTION_FILL_SPACE);
	addEventListenerAndCaption("submit_put_X",ACTION_PUT_NO_FILL);
	addEventListenerAndCaption("submit_pass_region",ACTION_PASS_REGION);
	function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
		addEventListenerAndCaptionActionSubmit(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
	}
}