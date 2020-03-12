var drawer = new Drawer();
drawer.setMarginGrid(32,32,32,32);
var solver = new SolverStarBattle(generateWallArray(1,1),1);
//TODO (of course the grid (1,1) is a dummy grid, but at least it has as much rows as columns as regions
var canevasInteraction = document.getElementById("canevas");
var	context = canevasInteraction.getContext("2d");
//var canevasListActions = document.getElementById("canevas_list_actions"); TODO
var actionToDo;
var drawIndications;

var colors={
	closed_wall:'#222222',
	open_wall:'#dddddd',
	edge_walls:'#000000',
	bannedSpace:'#666666',
	//star:'#ffe101', TODO
	cross:'#000000',
	starIndication:"#00cccc",
	crossIndication:"#cc0000",
	regionIndication:"#008800",
	rainbowSpaces:[]
}

//--------------------
//The main draw function (at start)
function drawCanvas(){
	drawer.drawWallGrid(context,solver.wallGrid,solver.xyLength,solver.xyLength); 
	drawInsideSpaces(context,drawer,colors,solver);
	if (document.getElementById("checkbox_drawIndications").checked){
		drawAroundIndications(context,drawer,colors,solver);
		drawInsideIndications(context,drawer,colors,solver);	
	}
}

setInterval(drawCanvas,30);
//--------------------

var fieldName = document.getElementById("input_grid_name");
var starSpan = document.getElementById("span_stars");
var textArea = document.getElementById("textarea_happened");

canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,textArea,solver,actionToDo)},false);

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("SternenSchlacht")});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value,starSpan,textArea)});
putActionElementClick("submit_undo",function(event){undoAction(solver,textArea)});
//putActionElementClick("submit_quickStart",function(event){quickStartAction(solver,textArea)}); TODO
putActionElementClick("submit_multiPass",function(event){multiPassAction(solver,textArea)});
putActionElementClick("submit_solve",function(event){solveAction(solver,textArea)});

//Submits of click on a grid : what will happen ? (TODO : the word action is pretty generic)
var submitPutStar = document.getElementById("submit_put_star");
var submitPutX = document.getElementById("submit_put_X");
var submitPassRegion = document.getElementById("submit_pass_region");
var submitPassRow = document.getElementById("submit_pass_row");
var submitPassColumn = document.getElementById("submit_pass_column");

var textAction = document.getElementById("text_canvas_action");
textAction.innerHTML = ACTION_PUT_STAR.caption;
actionToDo = ACTION_PUT_STAR.id;
addEventListenerAndCaptionActionSubmit(submitPutStar,ACTION_PUT_STAR);
addEventListenerAndCaptionActionSubmit(submitPutX,ACTION_PUT_NO_STAR);
addEventListenerAndCaptionActionSubmit(submitPassRegion,ACTION_PASS_REGION);
addEventListenerAndCaptionActionSubmit(submitPassRow,ACTION_PASS_ROW);
addEventListenerAndCaptionActionSubmit(submitPassColumn,ACTION_PASS_COLUMN);

//TODO the word "action" is pretty generic

/**
Adds the event listener of an action submit by linking it to an action for the canvas (warning : changes a text element
*/
function addEventListenerAndCaptionActionSubmit(p_submitElement,p_action){
	p_submitElement.value = p_action.caption;
	p_submitElement.addEventListener('click',function(event){
		textAction.innerHTML = p_action.caption;
		actionToDo = p_action.id;
	});
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
function alertPass(p_string){
	//alert(p_string);
}