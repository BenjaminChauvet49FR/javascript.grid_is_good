function EditorCore(p_xLength,p_yLength,p_parameters) {
	this.possessPathGrid = (p_parameters && (p_parameters.hasPathGrid == true)); //TODO il y a mieux qu'une gestion de booléens j'imagine
	this.possessWallGrid = !this.possessPathGrid;
	this.startGrid(p_xLength,p_yLength);
	this.isWithWalls = (!p_parameters || !p_parameters.hasWalls || (p_parameters.hasWalls != false));
}

//TODO : en l'état actuel on a une grille "wallGrid" et une grille "pathGrid"... qui ont exactement la même nature ! (WallGrid). Attention danger.

/**
Starts a grid from scratch. 
Basically the same as restarting it.
*/
EditorCore.prototype.startGrid = function(p_xLength,p_yLength){
	this.restartGrid(p_xLength,p_yLength);
}

/**
Restarts a grid from scratch.
*/
EditorCore.prototype.restartGrid = function(p_xLength,p_yLength){
	if(this.hasNumberGrid()){
		this.setupNumberGrid(generateNumberArray(p_xLength,p_yLength, -1)); //TODO ticking bomb ! Un "numéro par défaut" à -1, j'aime pas trop ça.
	}
	if(this.hasPathGrid()){
		this.setupFromPathArray(generatePathArray(p_xLength,p_yLength));
	}
	if (this.hasWallGrid()){
		this.setupFromWallArray(generateWallArray(p_xLength,p_yLength));
	}
	this.mode = {colorRegionIfValid : false};	
}

//Set up from non null grids
/**
Performs the required set up from a wall array (a blank one, one that was just modified or a loaded one)
This required setup may include region grid, selection mode...
*/
EditorCore.prototype.setupFromWallArray = function(p_wallArray){
	this.wallGrid = new WallGrid(p_wallArray,p_wallArray[0].length,p_wallArray.length);
	this.regionGrid = null;
	this.isRegionGridValid = true;
	this.isSelectionMode = false;
	this.selectedCornerSpace = null; //TODO gagnerait à être renommé
	this.selectedGrid = null;
	this.inputNumber = 1; //TODO faire getter et setter
	this.resetSelection(); 
}

/**
Same as setupFromWallArray but with a path grid
*/
EditorCore.prototype.setupFromPathArray = function(p_pathArray){
	this.pathGrid = new WallGrid(p_pathArray,p_pathArray[0].length,p_pathArray.length);
}

EditorCore.prototype.setupNumberGrid = function(p_numberArray,p_defaultNumber){
	this.numberGrid = new NumberGrid(p_numberArray,p_numberArray[0].length,p_numberArray.length,p_defaultNumber);
}

// ----------
// Testers

EditorCore.prototype.hasNumberGrid = function(){
	return (typeof(NumberGrid) == 'function');
}

EditorCore.prototype.hasPathGrid = function(){
	return this.possessPathGrid;
}

EditorCore.prototype.hasWallGrid = function(){
	return this.possessWallGrid;
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
EditorCore.prototype.getPathR = function(p_x,p_y){return this.pathGrid.getWallR(p_x,p_y);}
EditorCore.prototype.getPathD = function(p_x,p_y){return this.pathGrid.getWallD(p_x,p_y);}
EditorCore.prototype.setPathR = function(p_x,p_y,p_state){this.pathGrid.setWallR(p_x,p_y);}
EditorCore.prototype.setPathD = function(p_x,p_y,p_state){this.pathGrid.setWallD(p_x,p_y);}
EditorCore.prototype.switchPathR = function(p_x,p_y){this.pathGrid.switchWallR(p_x,p_y);}
EditorCore.prototype.switchPathD = function(p_x,p_y){this.pathGrid.switchWallD(p_x,p_y);}

EditorCore.prototype.getNumber = function(p_x,p_y,p_number){return this.numberGrid.getNumber(p_x,p_y,p_number);}
EditorCore.prototype.setNumber = function(p_x,p_y,p_number){this.numberGrid.setNumber(p_x,p_y,p_number);}
EditorCore.prototype.clearNumber = function(p_x,p_y){this.numberGrid.clearNumber(p_x,p_y);}

EditorCore.prototype.getXLength = function(){
	if (this.hasWallGrid()){
		return this.wallGrid.xLength;
	}
	if (this.hasPathGrid()){
		return this.pathGrid.xLength;
	}
}
EditorCore.prototype.getYLength = function(){
	if (this.hasWallGrid()){
		return this.wallGrid.yLength;
	}
	if (this.hasPathGrid()){
		return this.pathGrid.yLength;
	}
}

// --------------------
// Non-wall stuff
EditorCore.prototype.setWallsOn = function () {
    this.isWithWalls = true;
}

EditorCore.prototype.setWallsOff = function () {
    this.isWithWalls = false;
}

EditorCore.prototype.hasWalls = function () {
    return this.isWithWalls == true;
}

// --------------------
// Grid transformations

//TODO un jour je factoriserai ça !

EditorCore.prototype.rotateCWGrid = function(){
	if (this.hasWallGrid()){
		this.wallGrid.rotateCWGrid();
		this.setupFromWallArray(this.wallGrid.array); 
	}
	if (this.hasPathGrid()){
		this.pathGrid.rotateCWGrid();
		this.setupFromPathArray(this.pathGrid.array);
	}
	if(this.hasNumberGrid()){
		this.numberGrid.rotateCWGrid();
	}
}

EditorCore.prototype.rotateUTurnGrid = function(){
	if (this.hasWallGrid()){
		this.wallGrid.rotateUTurnGrid();
		this.setupFromWallArray(this.wallGrid.array);
	}
	if (this.hasPathGrid()){
		this.pathGrid.rotateUTurnGrid();
		this.setupFromPathArray(this.pathGrid.array);
	}
	if(this.hasNumberGrid()){
		this.numberGrid.rotateUTurnGrid();
	}
}

EditorCore.prototype.rotateCCWGrid = function(){
	if (this.hasWallGrid()){
		this.wallGrid.rotateCCWGrid();
		this.setupFromWallArray(this.wallGrid.array);
	}
	if (this.hasPathGrid()){
		this.pathGrid.rotateCCWGrid();
		this.setupFromPathArray(this.pathGrid.array);
	}
	if(this.hasNumberGrid()){
		this.numberGrid.rotateCCWGrid();
	}
}

EditorCore.prototype.mirrorHorizontalGrid = function(){
	if (this.hasWallGrid()){
		this.wallGrid.mirrorHorizontalGrid();
		this.setupFromWallArray(this.wallGrid.array);
	}
	if (this.hasPathGrid()){
		this.pathGrid.mirrorHorizontalGrid();
		this.setupFromPathArray(this.pathGrid.array);
	}
	if(this.hasNumberGrid()){
		this.numberGrid.mirrorHorizontalGrid();
	}
}

EditorCore.prototype.mirrorVerticalGrid = function(){
	if (this.hasWallGrid()){
		this.wallGrid.mirrorVerticalGrid();
		this.setupFromWallArray(this.wallGrid.array);
	}
	if (this.hasPathGrid()){
		this.pathGrid.mirrorVerticalGrid();
		this.setupFromPathArray(this.pathGrid.array);
	}
	if(this.hasNumberGrid()){
		this.numberGrid.mirrorVerticalGrid();
	}
}

EditorCore.prototype.resizeGrid = function(p_xLength,p_yLength){
	if (this.hasWallGrid()){
		this.wallGrid.resizeGrid(p_xLength,p_yLength);
		this.setupFromWallArray(this.wallGrid.array);
	}
	if (this.hasPathGrid()){
		this.pathGrid.resizeGrid(p_xLength,p_yLength);
		this.setupFromPathArray(this.pathGrid.array);
	}
	if(this.hasNumberGrid()){
		this.numberGrid.resizeGrid(p_xLength,p_yLength);
	}
}

//-------------------------------------------

/**
Selection phase
*/
EditorCore.prototype.selectSpace = function(p_x,p_y){
	this.selectedGrid[p_y][p_x] = SELECTED.YES;
}

EditorCore.prototype.selectRectangleMechanism = function (p_x,p_y){
	if (this.selectedCornerSpace == null){
		this.selectedCornerSpace = {x:p_x,y:p_y};
	} else {
		const xMin = Math.min(this.selectedCornerSpace.x,p_x);
		const yMin = Math.min(this.selectedCornerSpace.y,p_y);		
		const xMax = Math.max(this.selectedCornerSpace.x,p_x);
		const yMax = Math.max(this.selectedCornerSpace.y,p_y);
		for(x = xMin ; x <= xMax ; x++){
			for(var y=yMin; y<= yMax ; y++){
				this.selectSpace(x,y);
			}
		}
		this.selectedCornerSpace = null;
	}
}

EditorCore.prototype.unselectAll = function(){
	for(var iy = 0;iy < this.getYLength() ; iy++){
		for(var ix = 0;ix < this.getXLength() ; ix++){
			this.selectedGrid[iy][ix] = SELECTED.NO;
		}
	}
	this.selectedCornerSpace = null;
}

EditorCore.prototype.resetSelection = function(){
	this.isSelectionMode = false;
	this.selectedGrid = [];
	for(var iy = 0; iy<this.getYLength();iy++){
		this.selectedGrid.push([]);
		for(var ix = 0; ix<this.getXLength();ix++){
			this.selectedGrid[iy].push(SELECTED.NO);
		}
	}		
	this.selectedCornerSpace = null;
}

EditorCore.prototype.buildWallsAroundSelection = function(){
	for(var y = 0;y < this.getYLength();y++){
		for(var x = 0;x < this.getXLength();x++){
			if (this.selectedGrid[y][x] == SELECTED.YES){
				if (x > 0 && this.selectedGrid[y][x-1] == SELECTED.NO){
					this.wallGrid.setWallR(x-1,y,CLOSED);
				}
				if (x < this.getXLength()-1 && this.selectedGrid[y][x+1] == SELECTED.NO){
					this.wallGrid.setWallR(x,y,CLOSED);
				}
				if (y > 0 && this.selectedGrid[y-1][x] == SELECTED.NO){
					this.wallGrid.setWallD(x,y-1,CLOSED);
				}
				if (y < this.getYLength()-1 && this.selectedGrid[y+1][x] == SELECTED.NO){
					this.wallGrid.setWallD(x,y,CLOSED);
				}
			}
		}
	}
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
	this.numberGrid.arrangeNumbers(this.wallGrid.toRegionGrid());
}