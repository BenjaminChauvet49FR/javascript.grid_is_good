const IRRELEVANT = -1;

function SolverChocona(p_wallArray){
	this.construct(p_wallArray,null);
}

SolverChocona.prototype.construct = function(p_wallArray,p_gridNumber){
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.wallGrid = new WallGrid(p_wallArray,this.xLength,this.yLength); 
	this.regionGrid = this.wallGrid.toRegionGrid(); 
	this.answerGrid = [];
	this.spacesByRegion =  [];
	this.notPlacedYetByRegion = [];
	this.happenedEvents = [];	
	//Build intelligence !
	this.listInfosByRegion(p_gridNumber); //spacesByRegion and notPlacedYetByRegion
	this.buildAnswerGrid(); //answerGrid
	this.purifyAnswerGrid(); 
	this.happenedEvents = [];
	this.indexRegionsSortedBySize = null; //Will be initialized in the first use of multipass.

}

/**
Starts the answerGrid
*/
SolverChocona.prototype.buildAnswerGrid = function(){
	this.answerGrid = [];
	for(iy = 0; iy < this.yLength ; iy++){
		this.answerGrid.push([]);
		for(ix = 0; ix < this.xLength ; ix++){
			this.answerGrid[iy].push(FILLING.UNDECIDED);
		}
	}
}

//TODO update this description
/**
Puts NOs into the answerGrid corresponding to banned spaces 
Precondition : both spacesByRegion and notPlacedYetByRegion have been refreshed and answerGrid is ok.
*/
SolverChocona.prototype.purifyAnswerGrid = function(){
	//Removing banned spaces (hence the necessity to have things already updated)
	for(iy = 0; iy < this.yLength ; iy++){
		for(ix = 0; ix < this.xLength ; ix++){
			if (this.regionGrid[iy][ix] == BANNED){
				this.putNew(ix,iy,FILLING.NO);
			}
		}
	}
}

/**
Sets the list of spaces for each row and column (might be exportated) + adds numbers >= 0
Hyphothesis : all non-banned regions are numbered from 0 to n-1 ; banned spaces have lower-than-0 numbers
Exit : all spaces within a region are in reading order (top to bottom, then left to right)
*/
SolverChocona.prototype.listInfosByRegion = function(p_numberGrid){
	var ix,iy;
	var lastRegionNumber = 0;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
		}
	}
	
	this.spacesByRegion = [];
	this.notPlacedYetByRegion = [];
	
	for(var i=0;i<=lastRegionNumber;i++){
		this.spacesByRegion.push([]);
		this.notPlacedYetByRegion.push({Os:IRRELEVANT,Xs:IRRELEVANT});
	}
	
	//Setting up grid (todo : truly should be mutualised somehow.
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			if(this.regionGrid[iy][ix] >= 0){
				this.spacesByRegion[this.regionGrid[iy][ix]].push({x:ix,y:iy});
			}
		}
	}
	
	// Sets up the regions and the numbers of O to put.
	// The (if != null) means it can't be hurt by lack of initialization.
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			this.spacesByRegion[ir].push({x:ix,y:iy});
			if (p_numberGrid != null){
				number = p_numberGrid[iy][ix];
				if (number > 0){ 
					this.notPlacedYetByRegion[ir].Os = number;
				}
			}
		} 
	}

	for(var i=0;i<this.spacesByRegion.length;i++){
		if (this.notPlacedYetByRegion[i].Os > 0){       
			this.notPlacedYetByRegion[i].Xs = this.spacesByRegion[i].length - this.notPlacedYetByRegion[i].Os;
		}
	}
}

//----------------------
//Getters (not setters, of course)

SolverChocona.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

SolverChocona.prototype.getOsRemainRegion = function(p_i){return this.notPlacedYetByRegion[p_i].Os;}
SolverChocona.prototype.getXsRemainRegion = function(p_i){return this.notPlacedYetByRegion[p_i].Xs;}
SolverChocona.prototype.getFirstSpaceRegion = function(p_i){return this.spacesByRegion[p_i][0];}
SolverChocona.prototype.getRegionsNumber = function(){return this.spacesByRegion.length;}

SolverChocona.prototype.getRegion = function(p_x,p_y){
	return this.regionGrid[p_y][p_x];
}

//------------------
//Strategy management
/**
Admits that this space could be filled or not...
*/
SolverChocona.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	var result = this.tryToPutNew(p_x,p_y,p_symbol);
	if (result != null && result.eventsApplied.length > 0){
		this.happenedEvents.push(result.eventsApplied);
		return {result:RESULT.SUCCESS,eventsApplied:result.eventsApplied};
	}
	return {result:RESULT.FAILURE,eventsApplied:[]};
}

//------------------
//Putting symbols into spaces. 

/**Tries to put a symbol into the space of a grid. 3 possibilities :
RESULT.SUCCESS : it was indeed put into the grid ; the number of Os and Xs for this region, row and column are also updated.
RESULT.HARMLESS : said symbol was either already put into that space OUT out of bounds beacuse of automatic operation. Don't change anything to the grid and remaining symbols
ERROR : there is a different symbol in that space. We have done a wrong hypothesis somewhere ! (or the grid was wrong at the basis !)
This is also used at grid start in order to put Xs in banned spaces, hence the check in the NO_STAR part.
*/
SolverChocona.prototype.putNew = function(p_x,p_y,p_symbol){
	if (p_symbol == this.answerGrid[p_y][p_x]){
		return RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] != FILLING.UNDECIDED){
		return RESULT.ERROR;
	}
	this.answerGrid[p_y][p_x] = p_symbol;
	var ir = this.getRegion(p_x,p_y);
	if (this.isNotPlacedYetRelevant(ir)){
		if (p_symbol == FILLING.YES){
			this.notPlacedYetByRegion[ir].Os--;
		}
		else{
			this.notPlacedYetByRegion[ir].Xs--;
		}
	}
	return RESULT.SUCCESS;		
}

SolverChocona.prototype.isNotPlacedYetRelevant = function(p_x,p_y){
	return (this.notPlacedYetByRegion[ir].Os != IRRELEVANT);
}