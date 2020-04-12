var drawer = new Drawer();
var solver = new SolverShimaguni(generateWallArray(1,1),generateNumberArray(1,1,0));
//TODO (dummy grid problem)
var canevasInteraction = document.getElementById("canevas");
var	context = canevasInteraction.getContext("2d");
var actionToDo;
var drawIndications;

var colors={
	closed_wall:'#222222',
	open_wall:'#dddddd',
	edge_walls:'#000000',
	bannedSpace:'#666666',
	validSquare:'#000088',
	rainbowSpaces:[],
	insideIndicationsOnWhite:'#008800',
	insideIndicationsOnFilled:'#00ff00',
	standardWrite:'#000000',
	reflectWrite:"#ffff88",
	validSquare:"#000088"
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

var textArea = document.getElementById("textarea_happened");

var components = {
	textArea: textArea,
	checkBox : document.getElementById("checkbox_onlyAssumed"),
};

canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,components,solver,actionToDo)},false);

setInterval(drawCanvas,30);
//--------------------

var fieldName = document.getElementById("input_grid_name");


canevas.addEventListener('click', function(event){clickCanvas(event,canevas,drawer,components,solver,actionToDo)},false);
putActionElementClick("submit_load_grid",function(event){loadAction(canevas,drawer,solver,fieldName.value)});
putActionElementClick("submit_undo",function(event){undoAction(solver,textArea)});
putActionElementClick("submit_quickStart",function(event){quickStartAction(solver,textArea)});
putActionElementClick("submit_view_puzzle_list",function(event){viewPuzzleList("Shimaguni")});
putActionElementClick("submit_multiPass",function(event){multiPassAction(solver,textArea)});


var submitFillSpace = document.getElementById("submit_fill_space");
var submitPutX = document.getElementById("submit_put_X");
var submitPassRegion = document.getElementById("submit_pass_region");

var textAction = document.getElementById("text_canvas_action");
textAction.innerHTML = ACTION_FILL_SPACE.caption;
actionToDo = ACTION_FILL_SPACE.id;
addEventListenerAndCaptionActionSubmit(submitFillSpace,ACTION_FILL_SPACE);
addEventListenerAndCaptionActionSubmit(submitPutX,ACTION_PUT_NO_FILL);
addEventListenerAndCaptionActionSubmit(submitPassRegion,ACTION_PASS_REGION);

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

function debugTryToPutNewGold(p_string){
	console.log(p_string)
}
function debugTryToPutNew(p_string){
	console.log(p_string)
}
function debugPass(p_string){
	console.log(p_string);
}
function debugHumanMisclick(p_string){
	console.log("Human misclick ? "+p_string);
}
function alertPass(p_string){
	//alert(p_string);
}