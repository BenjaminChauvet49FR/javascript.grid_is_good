function EditorCore(p_xLength,p_yLength) {
	this.setupFromWallArray(generateWallArray(p_xLength,p_yLength));
	this.mode = {colorRegionIfValid : false};	
}

//YUP ! The grid must NOT be null !
EditorCore.prototype.setupFromWallArray = function(p_wallArray){
	this.wallGrid = new WallGrid(p_wallArray,p_wallArray[0].length,p_wallArray.length);
	this.regionGrid = null;
	this.isRegionGridValid = true;
	this.isSelectionMode = false;
	this.selectedSpacesList = null;
	this.selectedGrid = null;
	this.resetSelection(); 
}

EditorCore.prototype.restartGrid = function(p_xLength,p_yLength){
	this.setupFromWallArray(generateWallArray(p_xLength,p_yLength));
}

EditorCore.prototype.getXLength = function(){
	return this.wallGrid.xLength;
}
EditorCore.prototype.getYLength = function(){
	return this.wallGrid.yLength;
}
EditorCore.prototype.getArray = function(){
	return this.wallGrid.array;
}

EditorCore.prototype.getSelection = function(p_x,p_y){return this.selectedGrid[p_y][p_x];}
EditorCore.prototype.getWallR = function(p_x,p_y){return this.wallGrid.getWallR(p_x,p_y);}
EditorCore.prototype.getWallD = function(p_x,p_y){return this.wallGrid.getWallD(p_x,p_y);}
EditorCore.prototype.getState = function(p_x,p_y){return this.wallGrid.getState(p_x,p_y);}
EditorCore.prototype.setWallR = function(p_x,p_y,p_state){this.wallGrid.setWallR(p_x,p_y);}
EditorCore.prototype.setWallD = function(p_x,p_y,p_state){this.wallGrid.setWallD(p_x,p_y);}
EditorCore.prototype.setState = function(p_x,p_y,p_state){this.wallGrid.setState(p_x,p_y);}
EditorCore.prototype.switchWallR = function(p_x,p_y){this.wallGrid.switchWallR(p_x,p_y);}
EditorCore.prototype.switchWallD = function(p_x,p_y){this.wallGrid.switchWallD(p_x,p_y);}
EditorCore.prototype.switchState = function(p_x,p_y){this.wallGrid.switchState(p_x,p_y);}

/**
Transforms the grid
*/
EditorCore.prototype.rotateCWGrid = function(){
	this.wallGrid.rotateCWGrid();
	this.setupFromWallArray(this.wallGrid.array); //TODO improve me this !
}

EditorCore.prototype.rotateUTurnGrid = function(){
	this.wallGrid.rotateUTurnGrid();
	this.setupFromWallArray(this.wallGrid.array);
}

EditorCore.prototype.rotateCCWGrid = function(){
	this.wallGrid.rotateCCWGrid();
	this.setupFromWallArray(this.wallGrid.array);
}

EditorCore.prototype.mirrorHorizontalGrid = function(){
	this.wallGrid.mirrorHorizontalGrid();
	this.setupFromWallArray(this.wallGrid.array);
}

EditorCore.prototype.mirrorVerticalGrid = function(){
	this.wallGrid.mirrorVerticalGrid();
	this.setupFromWallArray(this.wallGrid.array);
}

EditorCore.prototype.resizeGrid = function(p_xLength,p_yLength){
	this.wallGrid.resizeGrid(p_xLength,p_yLength);
	this.setupFromWallArray(this.wallGrid.array);
}

//-------------------------------------------

/**
Selection phase
*/
EditorCore.prototype.selectSpace = function(p_x,p_y){
	this.selectedGrid[p_y][p_x] = SELECTED.YES;
	this.selectedSpacesList.push({x:p_x,y:p_y});
}

EditorCore.prototype.unselectAll = function(){
	var space;
	while(this.selectedSpacesList.length > 0){
		space = this.selectedSpacesList.pop();
		this.selectedGrid[space.y][space.x] = SELECTED.NO;
	}
}

EditorCore.prototype.resetSelection = function(){
	this.isSelectionMode = false;
	this.selectedSpacesList = [];
	this.selectedGrid = [];
	for(var iy = 0; iy<this.getYLength();iy++){
		this.selectedGrid.push([]);
		for(var ix = 0; ix<this.getXLength();ix++){
			this.selectedGrid[iy].push(SELECTED.NO);
		}
	}		
}

EditorCore.prototype.buildWallsAroundSelection = function(){
	this.selectedSpacesList.forEach(space => {
		if (space.x > 0 && this.selectedGrid[space.y][space.x-1] == SELECTED.NO){
			this.wallGrid.setWallR(space.x-1,space.y,CLOSED);
		}
		if (space.x < this.getXLength()-1 && this.selectedGrid[space.y][space.x+1] == SELECTED.NO){
			this.wallGrid.setWallR(space.x,space.y,CLOSED);
		}
		if (space.y > 0 && this.selectedGrid[space.y-1][space.x] == SELECTED.NO){
			this.wallGrid.setWallD(space.x,space.y-1,CLOSED);
		}
		if (space.y < this.getYLength()-1 && this.selectedGrid[space.y+1][space.x] == SELECTED.NO){
			this.wallGrid.setWallD(space.x,space.y,CLOSED);
		}
	});
	this.unselectAll();
}

EditorCore.prototype.clearWallsAround = function(p_x,p_y){
	if (p_x > 0 && this.selectedGrid[p_y][p_x-1] == SELECTED.NO){
		this.wallGrid.setWallR(p_x-1,p_y,OPEN);
	}
	if (p_x < this.getXLength()-1 && this.selectedGrid[p_y][p_x+1] == SELECTED.NO){
		this.wallGrid.setWallR(p_x,p_y,OPEN);
	}
	if (p_y > 0 && this.selectedGrid[p_y-1][p_x] == SELECTED.NO){
		this.wallGrid.setWallD(p_x,p_y-1,OPEN);
	}
	if (p_y < this.getYLength()-1 && this.selectedGrid[p_y+1][p_x] == SELECTED.NO){
		this.wallGrid.setWallD(p_x,p_y,OPEN);
	}
}