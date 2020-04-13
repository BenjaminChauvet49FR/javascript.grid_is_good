function PathGrid(p_pathArray,p_xLength,p_yLength) {
	this.array = p_pathArray;
	this.xLength = p_xLength;
	this.yLength = p_yLength;
}

function generatePathArray(p_widthGrid, p_heightGrid){
	var answer = [];
	for(var iy=0;iy<p_heightGrid;iy++){
		answer.push([]);
		for(var ix=0;ix<p_widthGrid;ix++){
			answer[iy].push({pathD:PATH.NO,pathR:PATH.NO});
		}
	}
	return answer;
}

PathGrid.prototype.getPathR = function(p_x,p_y){return this.array[p_y][p_x].pathR;}
PathGrid.prototype.getPathD = function(p_x,p_y){return this.array[p_y][p_x].pathD;}
PathGrid.prototype.getPathU = function(p_x,p_y){return this.array[p_y-1][p_x].pathR;}
PathGrid.prototype.getPathL = function(p_x,p_y){return this.array[p_y][p_x-1].pathD;}
PathGrid.prototype.setPathR = function(p_x,p_y,p_state){this.array[p_y][p_x].pathR = p_state;this.isRegionGridValid=false;}
PathGrid.prototype.setPathD = function(p_x,p_y,p_state){this.array[p_y][p_x].pathD = p_state;this.isRegionGridValid=false;}
PathGrid.prototype.setPathU = function(p_x,p_y,p_state){this.array[p_y-1][p_x].pathR = p_state;this.isRegionGridValid=false;}
PathGrid.prototype.setPathL = function(p_x,p_y,p_state){this.array[p_y][p_x-1].pathD = p_state;this.isRegionGridValid=false;}
PathGrid.prototype.switchPathR = function(p_x,p_y){this.setPathR(p_x,p_y,switchedState(this.getPathR(p_x,p_y)));}
PathGrid.prototype.switchPathD = function(p_x,p_y){this.setPathD(p_x,p_y,switchedState(this.getPathD(p_x,p_y)));}
PathGrid.prototype.switchPathU = function(p_x,p_y){this.setPathU(p_x,p_y,switchedState(this.getPathU(p_x,p_y)));}
PathGrid.prototype.switchPathL = function(p_x,p_y){this.setPathU(p_x,p_y,switchedState(this.getPathL(p_x,p_y)));}



PathGrid.prototype.rotateCWGrid = function(){
	var newPathGrid = [];
	var newPathR;
	var newPathD;
	for(var iy = 0; iy < this.xLength; iy++){
		newPathGrid.push([]);
		for(var ix = 0;ix < this.yLength;ix++){	
			newPathD = this.getPathR(iy,this.yLength-1-ix);
			if(ix < this.yLength-1)
				newPathR = this.getPathD(iy,this.yLength-2-ix);
			else
				newPathR = CLOSED;
			newPathGrid[iy].push(
				{pathD:newPathD,
				 pathR:newPathR}
			);
		}
	}
	this.array = newPathGrid;
	var saveXLength = this.xLength;
	this.xLength = this.yLength;
	this.yLength = saveXLength;
}

PathGrid.prototype.rotateUTurnGrid = function(){
	var newPathGrid = [];
	var newPathR;
	var newPathD;
	for(var iy = 0; iy < this.yLength; iy++){
		newPathGrid.push([]);
		for(var ix = 0;ix < this.xLength;ix++){	
			if(ix < this.xLength-1){
				newPathR = this.getPathR(this.xLength-2-ix,this.yLength-1-iy);
			}
			else{
				newPathR = CLOSED;
			}
			if(iy < this.yLength-1){
				newPathD = this.getPathD(this.xLength-1-ix,this.yLength-2-iy);
			}
			else{
				newPathD = CLOSED;
			}
			newPathGrid[iy].push(
				{pathD:newPathD,
				 pathR:newPathR}
			);
		}
	}
	this.array = newPathGrid;
}

PathGrid.prototype.rotateCCWGrid = function(){
	var newPathGrid = [];
	var newPathR;
	var newPathD;
	for(var iy = 0; iy < this.xLength; iy++){
		newPathGrid.push([]);
		for(var ix = 0;ix < this.yLength;ix++){	
			newPathR = this.getPathD(this.xLength-1-iy,ix);
			if(iy < this.xLength-1)
				newPathD = this.getPathR(this.xLength-2-iy,ix);
			else
				newPathD = CLOSED;
			newPathGrid[iy].push(
				{pathD:newPathD,
				 pathR:newPathR}
			);
		}
	}
	this.array = newPathGrid;
	var saveXLength = this.xLength;
	this.xLength = this.yLength;
	this.yLength = saveXLength;
}

PathGrid.prototype.mirrorHorizontalGrid = function(){
	var newPathGrid = [];
	var newPathR;
	var newPathD;
	for(var iy = 0; iy < this.yLength; iy++){
		newPathGrid.push([]);
		for(var ix = 0;ix < this.xLength;ix++){	
			if(ix < this.xLength-1){
				newPathR = this.getPathR(this.xLength-2-ix,iy);
			}
			else{
				newPathR = CLOSED;
			}
			newPathD = this.getPathD(this.xLength-1-ix,iy);
			
			newPathGrid[iy].push(
				{pathD:newPathD,
				 pathR:newPathR}
			);
		}
	}
	this.array = newPathGrid;
}

PathGrid.prototype.mirrorVerticalGrid = function(){
	var newPathGrid = [];
	var newPathR;
	var newPathD;
	for(var iy = 0; iy < this.yLength; iy++){
		newPathGrid.push([]);
		for(var ix = 0;ix < this.xLength;ix++){	
			if(iy < this.yLength-1){
				newPathD = this.getPathD(ix,this.yLength-2-iy);
			}
			else{
				newPathD = CLOSED;
			}
			newPathR = this.getPathR(ix,this.yLength-1-iy);
			
			newPathGrid[iy].push(
				{pathD:newPathD,
				 pathR:newPathR}
			);
		}
	}
	this.array = newPathGrid;
}

PathGrid.prototype.resizeGrid = function(p_xLength,p_yLength){
	var newPathGrid = [];
	var newPathD,newPathR;
	for(var iy = 0; iy < p_yLength; iy++){
		newPathGrid.push([]);
		for(var ix = 0;ix < p_xLength;ix++){
			if (ix < this.xLength && iy < this.yLength){
				newPathD = this.getPathD(ix,iy);
				newPathR = this.getPathR(ix,iy);
			} else{
				newPathD = PATH.NO;
				newPathR = PATH.NO;
			}
			newPathGrid[iy].push(
				{pathD:newPathD,
				 pathR:newPathR}
			);
		}
	}
	this.array = newPathGrid;
	this.xLength = p_xLength;
	this.yLength = p_yLength;
}

//-----------

// Constants for paths and spaces
const PATH = {YES:1,NO:0}; 