/**
This file contains the "global" object definition and all objects that could be put into it. 
*/

function Global(p_xLength,p_yLength) {
	/*this.xLength = p_xLength;
	this.yLength = p_yLength*/
	this.loadGrid(generateWallGrid(p_xLength,p_yLength));
	this.mode = {colorRegionIfValid : false};	
	/*this.wallGrid = generateWallGrid(p_xLength,p_yLength);
	this.regionGrid = null;
	this.isRegionGridValid = false;*/
}

Global.prototype.loadGrid = function(p_wallGrid){
	this.yLength = p_wallGrid.length;
	if(this.yLength > 0){
		this.xLength = p_wallGrid[0].length;		
	}else{
		this.xLength = 0;
	}
	this.wallGrid = p_wallGrid;
	this.updateRegionGrid();
	this.isRegionGridValid = true;
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