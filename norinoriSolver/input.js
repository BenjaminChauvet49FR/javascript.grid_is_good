/**
 When you click on the canvas
*/
function clickCanvas(event,p_canvas,p_drawer,p_textArea,p_global,p_actionId) { //TODO rename this action ? Yeah, but what about loadAction ?
    var rect = p_canvas.getBoundingClientRect();
    var pixMouseXInGrid = event.clientX - p_drawer.pix.marginGrid.left - rect.left;
    var pixMouseYInGrid = event.clientY - p_drawer.pix.marginGrid.up - rect.top;
	var spaceIndexX = Math.floor(pixMouseXInGrid/p_drawer.pix.sideSpace); //index of the space, calculated from the (x,y) position
	var spaceIndexY = Math.floor(pixMouseYInGrid/p_drawer.pix.sideSpace); //same - TODO maybe this should go to the Pix item ?
    if ((spaceIndexX >= 0) && (spaceIndexY >= 0) && (spaceIndexY < global.yLength) && (spaceIndexX < global.xLength)){
		clickSpaceAction(p_global,spaceIndexX,spaceIndexY,p_actionId);
		p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO manage true/false
	}
}

/**
You successfully clicked on a region space (coordinates in parameter). Then what ? 
*/
function clickSpaceAction(p_global,p_spaceIndexX,p_spaceIndexY,p_actionId){
	switch(p_actionId){
		case ACTION_FILL_SPACE.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+FILLING.YES);
			p_global.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.YES); 
		break;
		case ACTION_PUT_NO_FILL.id:
			console.log("HYPOTHESIS : "+p_spaceIndexX+" "+p_spaceIndexY+" "+FILLING.NO);
			p_global.emitHypothesis(p_spaceIndexX,p_spaceIndexY,FILLING.NO); 
		break;		
		case ACTION_PASS_REGION.id:
			var indexRegion = p_global.getRegion(p_spaceIndexX,p_spaceIndexY);
			console.log("PASSING REGION : "+indexRegion+" (Restent : "+p_global.getOsRemainRegion(indexRegion)+" "+p_global.getXsRemainRegion(indexRegion)+")");
			p_global.emitPassRegion(indexRegion);
		break;
	}
}

//--------------------------
/**
Tries to pass everything : rows, regions, columns.
*/
multiPassAction = function (p_global,p_textArea){
	p_global.multiPass();
	p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO manage true/false
	//TODO also manage the rewriting of the events.
}

solveAction = function (p_global,p_textArea){
	p_global.generalSolve();
	p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO see above
}

//--------------------------

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
TODO doc
*/
loadAction = function(p_canvas,p_drawer,p_textArea,p_global,p_name){
	var loadedItem = stringToNorinoriPuzzle(localStorage.getItem("grid_is_good_"+p_name));
	p_global.loadGrid(loadedItem.grid);
	p_global.loadIntelligence(loadedItem.starNumber);
	adaptCanvasAndGrid(p_canvas,p_drawer,p_global);
	p_textArea.innerHTML = ""; //TODO manage true/false
}

undoAction = function(p_global,p_textArea){
	p_global.massUndo();
	p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO manage true/false
}

quickStartAction = function(p_global,p_textArea){
	p_global.quickStart();
	p_textArea.innerHTML = p_global.happenedEventsToString(false); //TODO manage true/false
}

function adaptCanvasAndGrid(p_canvas, p_drawer,p_global){
	//Respects dimension of 800x512
	//TODO Constants can be written somewhere else !
	p_drawer.pix.sideSpace = Math.min(32,Math.min(Math.floor(800/p_global.xLength),Math.floor(512/p_global.yLength)));
	p_drawer.pix.borderSpace = Math.max(1,Math.floor(p_drawer.pix.sideSpace/10));
	p_drawer.setMarginGrid(0,0,0,0);
	//TODO should be factorized with other editors !
	p_canvas.width = p_global.xLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.left+p_drawer.pix.marginGrid.right;
	p_canvas.height = p_global.yLength*p_drawer.pix.sideSpace+p_drawer.pix.marginGrid.up+p_drawer.pix.marginGrid.down;
}

function viewNorinoriList(){
	var string = "";
	for (var i = 0, len = localStorage.length; i < len; i++) {
        var key = localStorage.key(i);
		if (key.startsWith("grid_is_good_Norinori")){
			string+=(key+"\n");
		}
	}
	alert(string);
}