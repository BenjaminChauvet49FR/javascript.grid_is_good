function NumberGrid(p_numberArray,p_xLength,p_yLength) {
	this.array = p_numberArray;
	this.xLength = p_xLength;
	this.yLength = p_yLength;
}

function generateNumberArray(p_widthGrid, p_heightGrid){
	var answer = [];
	for(var iy=0;iy<p_heightGrid;iy++){
		answer.push([]);
		for(var ix=0;ix<p_widthGrid;ix++){
			answer[iy].push(DEFAULT_NUMBER);
		}
	}
	return answer;
}

NumberGrid.prototype.getNumber = function(p_x,p_y){return this.array[p_y][p_x]}
NumberGrid.prototype.setNumber = function(p_x,p_y,p_number){this.array[p_y][p_x] = p_number}
const DEFAULT_NUMBER = 0; //TODO c'est le nombre par défaut. Est-ce ce que nous voulons ?

NumberGrid.prototype.rotateCWGrid = function(){
	var newNumberArray = [];
	var newWallR;
	var newWallD;
	for(var iy = 0; iy < this.xLength; iy++){
		newNumberArray.push([]);
		for(var ix = 0;ix < this.yLength;ix++){	
			newNumberArray[iy].push(this.getNumber(iy,this.yLength-1-ix));
		}
	}
	this.array = newNumberArray;
	var saveXLength = this.xLength;
	this.xLength = this.yLength;
	this.yLength = saveXLength;
}

NumberGrid.prototype.rotateUTurnGrid = function(){
	var newNumberArray = [];
	for(var iy = 0; iy < this.yLength; iy++){
		newNumberArray.push([]);
		for(var ix = 0;ix < this.xLength;ix++){	
			newNumberArray[iy].push(this.getNumber(this.xLength-1-ix,this.yLength-1-iy));
		}
	}
	this.array = newNumberArray;
}

NumberGrid.prototype.rotateCCWGrid = function(){
	var newNumberArray = [];
	for(var iy = 0; iy < this.xLength; iy++){
		newNumberArray.push([]);
		for(var ix = 0;ix < this.yLength;ix++){	
			newNumberArray[iy].push(this.getNumber(this.xLength-1-iy,ix));
		}
	}
	this.array = newNumberArray;
	var saveXLength = this.xLength;
	this.xLength = this.yLength;
	this.yLength = saveXLength;
}

NumberGrid.prototype.mirrorHorizontalGrid = function(){
	var newNumberArray = [];
	for(var iy = 0; iy < this.yLength; iy++){
		newNumberArray.push([]);
		for(var ix = 0;ix < this.xLength;ix++){			
			newNumberArray[iy].push(this.getNumber(this.xLength-1-ix,iy));
		}
	}
	this.array = newNumberArray;
}

NumberGrid.prototype.mirrorVerticalGrid = function(){
	var newNumberArray = [];
	for(var iy = 0; iy < this.yLength; iy++){
		newNumberArray.push([]);
		for(var ix = 0;ix < this.xLength;ix++){	
			newNumberArray[iy].push(this.getNumber(ix,this.yLength-1-iy));
		}
	}
	this.array = newNumberArray;
}

NumberGrid.prototype.resizeGrid = function(p_xLength,p_yLength){
	var newNumberArray = [];
	var number;
	for(var iy = 0; iy < p_yLength; iy++){
		newNumberArray.push([]);
		for(var ix = 0;ix < p_xLength;ix++){
			if (ix < this.xLength && iy < this.yLength){
				number = this.getNumber(ix,iy);
			} else{
				number = DEFAULT_NUMBER;
			}
			newNumberArray[iy].push(number);
		}
	}
	this.array = newNumberArray;
	this.xLength = p_xLength;
	this.yLength = p_yLength;
}