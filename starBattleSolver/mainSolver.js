var drawer = new Drawer();
var solver = new SolverStarBattle(generateWallArray(1,1),1);
//TODO (of course the grid (1,1) is a dummy grid, but at least it has as much rows as columns as regions
var canevasInteraction = document.getElementById("canevas");
var	context = canevasInteraction.getContext("2d");
//var canevasListActions = document.getElementById("canevas_list_actions"); TODO
var actionsManager  = {clickSpace : null};
var drawIndications;

var colors={
	emptySquare:'#cccccc',
	starIndication:"#00cccc",
	crossIndication:"#cc0000",
	regionIndication:"#008800",
	rainbowSpaces:[]
}

//--------------------
//The main draw function (at start)
function drawCanvas(){
	drawer.drawWallGrid(context,solver.wallGrid,solver.xyLength,solver.xyLength); 
	drawInsideSpaces(context, drawer, colors, solver);
	if (document.getElementById("checkbox_drawIndications").checked){
		drawAroundIndications(context,drawer,colors,solver);
		drawInsideIndications(context,drawer,colors,solver);	
	}
}

setInterval(drawCanvas,30);
//--------------------

var fieldName = document.getElementById("input_grid_name");
canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,solver,actionsManager)},false);

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("SternenSchlacht")});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value)});
putActionElementClick("submit_undo",function(event){undoAction(solver)});
//putActionElementClick("submit_quickStart",function(event){quickStartAction(...)}); TODO
putActionElementClick("submit_multiPass",function(event){multiPassAction(solver)});
putActionElementClick("submit_solve",function(event){solveAction(solver)});

var textAction = document.getElementById("text_canvas_action");
setMode(textAction,actionsManager,ENTRY.SPACE,ACTION_PUT_STAR);
addEventListenerAndCaption("submit_put_star",ACTION_PUT_STAR);
addEventListenerAndCaption("submit_put_X",ACTION_PUT_NO_STAR);
addEventListenerAndCaption("submit_pass_region",ACTION_PASS_REGION);
addEventListenerAndCaption("submit_pass_row",ACTION_PASS_ROW);
addEventListenerAndCaption("submit_pass_column",ACTION_PASS_COLUMN);

function addEventListenerAndCaption(p_identifier,p_action){ //Shortcut action
	addEventListenerAndCaptionForSolver(actionsManager,textAction,p_identifier,ENTRY.SPACE,p_action);
}

//----------------
//Debug room. 
//TODO create a separate file ?

function debugTryToPutNew(p_string){
	//console.log(p_string)
}
function debugPass(p_string){
	//console.log(p_string);
}
function debugHumanMisclick(p_string){
	//console.log("Human misclick ? "+p_string);
}
function debugCancel(p_string){
	//console.log(p_string);
}
function alertPass(p_string){
	//alert(p_string);
}