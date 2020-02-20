/**
This file contains the "global" object definition and all objects that could be put into it. 
*/

function Global(p_xLength,p_yLength) {
	this.loadGrid(generateWallGrid(p_xLength,p_yLength));
	this.mode = {colorRegionIfValid : false};	
}

Global.prototype.loadGrid = function(p_wallGrid){
	this.yLength = p_wallGrid.length;
	if(this.yLength > 0){
		this.xLength = p_wallGrid[0].length;		
	}else{
		this.xLength = 0;
	}
	this.wallGrid = p_wallGrid;
	this.regionGrid = null;
	this.updateRegionGrid();
	this.isRegionGridValid = true;
	this.isSelectionMode = false;
	this.selectedSpacesList = null;
	this.selectedGrid = null;
	this.resetSelection(); 

}

Global.prototype.restartGrid = function(p_xLength,p_yLength){
	this.loadGrid(generateWallGrid(p_xLength,p_yLength));
}


Global.prototype.getWallR = function(p_x,p_y){return this.wallGrid[p_y][p_x].wallR;}
Global.prototype.getWallD = function(p_x,p_y){return this.wallGrid[p_y][p_x].wallD;}
Global.prototype.getState = function(p_x,p_y){return this.wallGrid[p_y][p_x].state;}
Global.prototype.setWallR = function(p_x,p_y,p_state){this.wallGrid[p_y][p_x].wallR = p_state;this.isRegionGridValid=false;}
Global.prototype.setWallD = function(p_x,p_y,p_state){this.wallGrid[p_y][p_x].wallD = p_state;this.isRegionGridValid=false;}
Global.prototype.setState = function(p_x,p_y,p_state){this.wallGrid[p_y][p_x].state = p_state;this.isRegionGridValid=false;}
Global.prototype.switchWallR = function(p_x,p_y){this.setWallR(p_x,p_y,switchedState(this.getWallR(p_x,p_y)));}
Global.prototype.switchWallD = function(p_x,p_y){this.setWallD(p_x,p_y,switchedState(this.getWallD(p_x,p_y)));}
Global.prototype.switchState = function(p_x,p_y){this.setState(p_x,p_y,switchedState(this.getState(p_x,p_y)));}
Global.prototype.getRegion = function(p_x,p_y){return this.regionGrid[p_y][p_x]};
Global.prototype.getSelection = function(p_x,p_y){return this.selectedGrid[p_y][p_x]};

Global.prototype.updateRegionGrid = function(){
	this.regionGrid = wallGridToRegionGrid(this.wallGrid);
	this.isRegionGridValid = true;
}

/**
Generates a clean grid wall with desired width and height
*/
function generateWallGrid(p_widthGrid, p_heightGrid){
	var answer = [];
	for(var iy=0;iy<p_heightGrid;iy++){
		answer.push([]);
		for(var ix=0;ix<p_widthGrid;ix++){
			answer[iy].push({state:OPEN,wallD:OPEN,wallR:OPEN});
		}
	}
	return answer;
}


/**
Converts a grid with walls (right and down) to a "region" grid (regions 1,2,3,...) 
p_wallGrid : the source grid
*/
function wallGridToRegionGrid(p_wallGrid){
	var regionGridAnswer = [];
	var yLength = p_wallGrid.length;
	var xLength = p_wallGrid[0].length;
	//Create the grid with banned and uncharted spaces
	for(var iy=0;iy<yLength;iy++){
		regionGridAnswer.push([]);
		for(var ix=0;ix<xLength;ix++){
			if (p_wallGrid[iy][ix].state == CLOSED){
				regionGridAnswer[iy].push(BANNED);
			}else{
				regionGridAnswer[iy].push(UNCHARTED);
			}
		}
	}
	//Region parting :
	var firstX;
	var firstY = 0;
	var regionIndex = 0;
	var spacesThatBelong = [];
	var spaceToPut;
	var x,y;
	//Then, go for all non-banned spaces
	while(firstY < yLength){
		firstX = 0;
		while ((firstX < xLength) && (regionGridAnswer[firstY][firstX] != UNCHARTED)){ //le dernier true sera à changer quand je ferai des cases destinées à rester à -1
			firstX++;
		}
		if (firstX < xLength){
			spacesThatBelong.push({sx:firstX,sy:firstY});
			while(spacesThatBelong.length > 0){
				spaceToPut = spacesThatBelong.pop();
				x = spaceToPut.sx;
				y = spaceToPut.sy;
				regionGridAnswer[y][x] = regionIndex;
				if((y > 0) && (regionGridAnswer[y-1][x] == UNCHARTED) && (p_wallGrid[y-1][x].wallD == OPEN)){
					spacesThatBelong.push({sx:x,sy:y-1});
				}
				if((x > 0) && (regionGridAnswer[y][x-1] == UNCHARTED) && (p_wallGrid[y][x-1].wallR == OPEN)){
					spacesThatBelong.push({sx:x-1,sy:y});
				}
				if((y <= yLength-2) && (regionGridAnswer[y+1][x] == UNCHARTED) && (p_wallGrid[y][x].wallD == OPEN)){
					spacesThatBelong.push({sx:x,sy:y+1});
				}
				if((x <= xLength-2) && (regionGridAnswer[y][x+1] == UNCHARTED) && (p_wallGrid[y][x].wallR == OPEN)){
					spacesThatBelong.push({sx:x+1,sy:y});
				}
			}
			regionIndex++;
			firstX++;
		}
		if(firstX == xLength){
			firstX = 0;
			firstY++;
		}
	}
	return regionGridAnswer;
}

/**
Returns the opposite of a wall state
p_wallState : a wall state (should match a wall state constant... right ?).
*/
function switchedState(p_wallState){
	return 1-p_wallState;
}

//-------------------------------------------

/**
Selection phase
*/
Global.prototype.selectSpace = function(p_x,p_y){
	this.selectedGrid[p_y][p_x] = SELECTED.YES;
	this.selectedSpacesList.push({x:p_x,y:p_y});
}

Global.prototype.unselectAll = function(){
	var space;
	while(this.selectedSpacesList.length > 0){
		space = this.selectedSpacesList.pop();
		this.selectedGrid[space.y][space.x] = SELECTED.NO;
	}
}

Global.prototype.resetSelection = function(){
	this.isSelectionMode = false;
	this.selectedSpacesList = [];
	this.selectedGrid = [];
	for(var iy = 0; iy<this.yLength;iy++){
		this.selectedGrid.push([]);
		for(var ix = 0; ix<this.xLength;ix++){
			this.selectedGrid[iy].push(SELECTED.NO);
		}
	}		
}

Global.prototype.buildWallsAroundSelection = function(){
	this.selectedSpacesList.forEach(space => {
		if (space.x > 0 && this.selectedGrid[space.y][space.x-1] == SELECTED.NO){
			this.setWallR(space.x-1,space.y,CLOSED);
		}
		if (space.x < this.xLength-1 && this.selectedGrid[space.y][space.x+1] == SELECTED.NO){
			this.setWallR(space.x,space.y,CLOSED);
		}
		if (space.y > 0 && this.selectedGrid[space.y-1][space.x] == SELECTED.NO){
			this.setWallD(space.x,space.y-1,CLOSED);
		}
		if (space.y < this.yLength-1 && this.selectedGrid[space.y+1][space.x] == SELECTED.NO){
			this.setWallD(space.x,space.y,CLOSED);
		}
	});
	this.unselectAll();
}

Global.prototype.clearWallsAround = function(p_x,p_y){
	if (p_x > 0 && this.selectedGrid[p_y][p_x-1] == SELECTED.NO){
		this.setWallR(p_x-1,p_y,OPEN);
	}
	if (p_x < this.xLength-1 && this.selectedGrid[p_y][p_x+1] == SELECTED.NO){
		this.setWallR(p_x,p_y,OPEN);
	}
	if (p_y > 0 && this.selectedGrid[p_y-1][p_x] == SELECTED.NO){
		this.setWallD(p_x,p_y-1,OPEN);
	}
	if (p_y < this.yLength-1 && this.selectedGrid[p_y+1][p_x] == SELECTED.NO){
		this.setWallD(p_x,p_y,OPEN);
	}
}

//-------------------------------------------

/**
Transforms the grid
*/
Global.prototype.rotateCWGrid = function(){
	var newWallGrid = [];
	var newWallR;
	var newWallD;
	for(var iy = 0; iy < this.xLength; iy++){
		newWallGrid.push([]);
		for(var ix = 0;ix < this.yLength;ix++){	
			newWallD = this.wallGrid[this.yLength-1-ix][iy].wallR;
			if(ix < this.yLength-1)
				newWallR = this.wallGrid[this.yLength-2-ix][iy].wallD;
			else
				newWallR = CLOSED;
			newWallGrid[iy].push(
				{state:this.wallGrid[this.yLength-1-ix][iy].state,
				 wallD:newWallD,
				 wallR:newWallR}
			);
		}
	}
	this.loadGrid(newWallGrid);
}

Global.prototype.rotateUTurnGrid = function(){
	var newWallGrid = [];
	var newWallR;
	var newWallD;
	for(var iy = 0; iy < this.yLength; iy++){
		newWallGrid.push([]);
		for(var ix = 0;ix < this.xLength;ix++){	
			if(ix < this.xLength-1){
				newWallR = this.wallGrid[this.yLength-1-iy][this.xLength-2-ix].wallR;
			}
			else{
				newWallR = CLOSED;
			}
			if(iy < this.yLength-1){
				newWallD = this.wallGrid[this.yLength-2-iy][this.xLength-1-ix].wallD;
			}
			else{
				newWallD = CLOSED;
			}
			newWallGrid[iy].push(
				{state:this.wallGrid[this.yLength-1-iy][this.xLength-1-ix].state,
				 wallD:newWallD,
				 wallR:newWallR}
			);
		}
	}
	this.loadGrid(newWallGrid);
}

Global.prototype.rotateCCWGrid = function(){
	var newWallGrid = [];
	var newWallR;
	var newWallD;
	for(var iy = 0; iy < this.xLength; iy++){
		newWallGrid.push([]);
		for(var ix = 0;ix < this.yLength;ix++){	
			newWallR = this.wallGrid[ix][this.xLength-1-iy].wallD;
			if(iy < this.xLength-1)
				newWallD = this.wallGrid[ix][this.xLength-2-iy].wallR;
			else
				newWallD = CLOSED;
			newWallGrid[iy].push(
				{state:this.wallGrid[ix][this.xLength-1-iy].state,
				 wallD:newWallD,
				 wallR:newWallR}
			);
		}
	}
	this.loadGrid(newWallGrid);
}

Global.prototype.mirrorHorizontalGrid = function(){
	var newWallGrid = [];
	var newWallR;
	var newWallD;
	for(var iy = 0; iy < this.yLength; iy++){
		newWallGrid.push([]);
		for(var ix = 0;ix < this.xLength;ix++){	
			if(ix < this.xLength-1){
				newWallR = this.wallGrid[iy][this.xLength-2-ix].wallR;
			}
			else{
				newWallR = CLOSED;
			}
			newWallD = this.wallGrid[iy][this.xLength-1-ix].wallD;
			
			newWallGrid[iy].push(
				{state:this.wallGrid[iy][this.xLength-1-ix].state,
				 wallD:newWallD,
				 wallR:newWallR}
			);
		}
	}
	this.loadGrid(newWallGrid);
}

Global.prototype.mirrorVerticalGrid = function(){
	var newWallGrid = [];
	var newWallR;
	var newWallD;
	for(var iy = 0; iy < this.yLength; iy++){
		newWallGrid.push([]);
		for(var ix = 0;ix < this.xLength;ix++){	
			if(iy < this.yLength-1){
				newWallD = this.wallGrid[this.yLength-2-iy][ix].wallD;
			}
			else{
				newWallD = CLOSED;
			}
			newWallR = this.wallGrid[this.yLength-1-iy][ix].wallR;
			
			newWallGrid[iy].push(
				{state:this.wallGrid[this.yLength-1-iy][ix].state,
				 wallD:newWallD,
				 wallR:newWallR}
			);
		}
	}
	this.loadGrid(newWallGrid);
}

Global.prototype.resizeGrid = function(p_xLength,p_yLength){
	var newWallGrid = [];
	var newWallD,newWallR,newState;
	for(var iy = 0; iy < p_yLength; iy++){
		newWallGrid.push([]);
		for(var ix = 0;ix < p_xLength;ix++){
			if (ix < this.xLength && iy < this.yLength){
				newState = this.wallGrid[iy][ix].state;
				newWallD = this.wallGrid[iy][ix].wallD;
				newWallR = this.wallGrid[iy][ix].wallR;
			} else{
				newState = OPEN;
				newWallD = OPEN;
				newWallR = OPEN;
			}
			newWallGrid[iy].push(
				{state:newState,
				 wallD:newWallD,
				 wallR:newWallR}
			);
		}
	}
	this.loadGrid(newWallGrid);
}