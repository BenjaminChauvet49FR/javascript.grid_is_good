var drawer = new Drawer();
var solver = new SolverChocona(generateWallArray(1,1),1);
var canevas = document.getElementById("canevas");
var	context = canevas.getContext("2d");
var actionToDo;
var drawIndications;

var colors={
	closed_wall:'#222222',
	open_wall:'#dddddd',
	edge_walls:'#000000',
	bannedSpace:'#666666',
	cross:'#000000',
	regionIndication:"#008800",
}

//--------------------
//The main draw function (at start)
function drawCanvas(){
	drawer.drawWallGrid(context,solver.wallGrid,solver.xLength,solver.yLength); 
	drawInsideSpaces(context,drawer,colors,solver);
	if (document.getElementById("checkbox_drawIndications").checked){
		drawInsideIndications(context,drawer,colors,solver);	
	}
}

setInterval(drawCanvas,30);
//--------------------

var fieldName = document.getElementById("input_grid_name");
var components = {
	textArea:document.getElementById("textarea_happened"),
	checkBox : document.getElementById("checkbox_onlyAssumed"),
};

canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,components,solver,actionToDo)},false);

putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("Chocona")});
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value,components)});
//putActionElementClick("submit_undo",function(event){undoAction(solver,components)});
//putActionElementClick("submit_quickStart",function(event){quickStartAction(...)}); 
//putActionElementClick("submit_multiPass",function(event){multiPassAction(solver,components)});
//putActionElementClick("submit_solve",function(event){solveAction(solver,components)});

//Submits of click on a grid : what will happen ? (TODO : the word action is pretty generic)
var submitFillSpace = document.getElementById("submit_fill_space");
var submitPutX = document.getElementById("submit_put_X");

var textAction = document.getElementById("text_canvas_action");
textAction.innerHTML = ACTION_FILL_SPACE.caption;
actionToDo = ACTION_FILL_SPACE.id;
addEventListenerAndCaptionActionSubmit(submitFillSpace,ACTION_FILL_SPACE);
addEventListenerAndCaptionActionSubmit(submitPutX,ACTION_FILL_NO_SPACE);

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
function debugCancel(p_string){
	//console.log(p_string);
}
function alertPass(p_string){
	//alert(p_string);
}