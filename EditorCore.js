function EditorCore(p_xLength,p_yLength) {
	this.restartGrid(p_xLength,p_yLength);
}

//TODO renommer cette méthode ! Yeah !
EditorCore.prototype.restartGrid = function(p_xLength,p_yLength){
	this.setupFromWallArray(generateWallArray(p_xLength,p_yLength));
	if(this.hasNumberGrid()){
		this.setupNumberGrid(generateNumberArray(p_xLength,p_yLength, this.defaultNumber));
	}
	if(this.hasPathGrid()){
		this.setupPathGrid(generatePathArray(p_xLength,p_yLength));
	}
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
	this.inputNumber = 1; //TODO faire getter et setter
	this.resetSelection(); 
}

EditorCore.prototype.hasNumberGrid = function(){
	return (typeof(NumberGrid) == 'function');
}

EditorCore.prototype.hasPathGrid = function(){
	return (typeof(PathGrid) == 'function');
}

EditorCore.prototype.setupNumberGrid = function(p_numberArray){
	this.numberGrid = new NumberGrid(p_numberArray,p_numberArray[0].length,p_numberArray.length);
}

EditorCore.prototype.setupPathGrid = function(p_pathArray){
	this.pathGrid = new PathGrid(p_pathArray,p_pathArray[0].length,p_pathArray.length);
}

EditorCore.prototype.getArray = function(){ //TODO cette fonction gagnera à être changée de nom !
	return this.wallGrid.array;
}
EditorCore.prototype.getNumbers = function(){
	return this.numberGrid.array;
}
EditorCore.prototype.getPaths = function(){
	return this.pathGrid.array;
}

EditorCore.prototype.getWallGrid = function(){ //TODO cette fonction gagnera à être changée de nom !
	return this.wallGrid;
}
EditorCore.prototype.getNumberGrid = function(){
	return this.numberGrid;
}
EditorCore.prototype.getPathGrid = function(){
	return this.pathGrid;
}

EditorCore.prototype.getSelection = function(p_x,p_y){return this.selectedGrid[p_y][p_x];}
EditorCore.prototype.getInputNumber = function(){return this.inputNumber;}
EditorCore.prototype.setInputNumber = function(p_inputNumber){this.inputNumber = p_inputNumber}

EditorCore.prototype.getWallR = function(p_x,p_y){return this.wallGrid.getWallR(p_x,p_y);}
EditorCore.prototype.getWallD = function(p_x,p_y){return this.wallGrid.getWallD(p_x,p_y);}
EditorCore.prototype.getState = function(p_x,p_y){return this.wallGrid.getState(p_x,p_y);}
EditorCore.prototype.setWallR = function(p_x,p_y,p_state){this.wallGrid.setWallR(p_x,p_y);}
EditorCore.prototype.setWallD = function(p_x,p_y,p_state){this.wallGrid.setWallD(p_x,p_y);}
EditorCore.prototype.setState = function(p_x,p_y,p_state){this.wallGrid.setState(p_x,p_y);}
EditorCore.prototype.switchWallR = function(p_x,p_y){this.wallGrid.switchWallR(p_x,p_y);}
EditorCore.prototype.switchWallD = function(p_x,p_y){this.wallGrid.switchWallD(p_x,p_y);}
EditorCore.prototype.switchState = function(p_x,p_y){this.wallGrid.switchState(p_x,p_y);}

EditorCore.prototype.getNumber = function(p_x,p_y,p_number){return this.numberGrid.getNumber(p_x,p_y,p_number);}
EditorCore.prototype.setNumber = function(p_x,p_y,p_number){this.numberGrid.setNumber(p_x,p_y,p_number);}

EditorCore.prototype.getPathR = function(p_x,p_y){return this.pathGrid.getPathR(p_x,p_y);}
EditorCore.prototype.getPathD = function(p_x,p_y){return this.pathGrid.getPathD(p_x,p_y);}
EditorCore.prototype.setPathR = function(p_x,p_y,p_state){this.pathGrid.setPathR(p_x,p_y);}
EditorCore.prototype.setPathD = function(p_x,p_y,p_state){this.pathGrid.setPathD(p_x,p_y);}
EditorCore.prototype.switchPathR = function(p_x,p_y){this.pathGrid.switchPathR(p_x,p_y);}
EditorCore.prototype.switchPathD = function(p_x,p_y){this.pathGrid.switchPathD(p_x,p_y);}

//---
EditorCore.prototype.getXLength = function(){
	return this.wallGrid.xLength;
}
EditorCore.prototype.getYLength = function(){
	return this.wallGrid.yLength;
}

/**
Transforms the grid
*/
EditorCore.prototype.rotateCWGrid = function(){
	this.wallGrid.rotateCWGrid();
	if(this.hasNumberGrid()){
		this.numberGrid.rotateCWGrid();
	}
	this.setupFromWallArray(this.wallGrid.array); 
}

EditorCore.prototype.rotateUTurnGrid = function(){
	this.wallGrid.rotateUTurnGrid();
	if(this.hasNumberGrid()){
		this.numberGrid.rotateUTurnGrid();
	}
	this.setupFromWallArray(this.wallGrid.array);
}

EditorCore.prototype.rotateCCWGrid = function(){
	this.wallGrid.rotateCCWGrid();
	if(this.hasNumberGrid()){
		this.numberGrid.rotateCCWGrid();
	}
	this.setupFromWallArray(this.wallGrid.array);
}

EditorCore.prototype.mirrorHorizontalGrid = function(){
	this.wallGrid.mirrorHorizontalGrid();
	if(this.hasNumberGrid()){
		this.numberGrid.mirrorHorizontalGrid();
	}
	this.setupFromWallArray(this.wallGrid.array);
}

EditorCore.prototype.mirrorVerticalGrid = function(){
	this.wallGrid.mirrorVerticalGrid();
	if(this.hasNumberGrid()){
		this.numberGrid.mirrorVerticalGrid();
	}
	this.setupFromWallArray(this.wallGrid.array);
}

EditorCore.prototype.resizeGrid = function(p_xLength,p_yLength){
	this.wallGrid.resizeGrid(p_xLength,p_yLength);
	if(this.hasNumberGrid()){
		this.numberGrid.resizeGrid(p_xLength,p_yLength);
	}
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

EditorCore.prototype.resetNumbers = function(){
	/*var regionGrid = this.wallGrid.toRegionGrid();
	//Le code est copié-collé d'un solveur
	var lastRegionNumber = 0;
	for(iy = 0;iy < this.getYLength();iy++){
		for(ix = 0;ix < this.getXLength();ix++){
			lastRegionNumber = Math.max(regionGrid[iy][ix],lastRegionNumber);
		}
	}
	
	var numbersFoundInRegion = [];
	var firstX = [];
	var firstY = [];
	for(var i=0;i<=lastRegionNumber;i++){
		numbersFoundInRegion.push(0);
		firstX.push(-1);
		firstY.push(-1);
	}
	var ix,iy,ir;
	for(var iy = 0;iy < this.getYLength(); iy++){
		for(var ix = 0;ix < this.getXLength() ; ix++){
			ir = regionGrid[iy][ix];
			if (firstX[ir] == -1){
				firstX[ir] = ix;
				firstY[ir] = iy;
			}
			if (this.getNumber(ix,iy) > 0 && numbersFoundInRegion[ir] == 0){
				numbersFoundInRegion[ir] = this.getNumber(ix,iy);
			}
			this.setNumber(ix,iy,0);
		}
	}
	for(var i=0;i<=lastRegionNumber;i++){
		if (numbersFoundInRegion[i] > 0){
			this.setNumber(firstX[i],firstY[i],numbersFoundInRegion[i]);
		}
	}*/
	this.numberGrid.arrangeNumbers();
}