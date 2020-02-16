function GlobalNorinori(p_wallGrid){
	Global.call(this,1,1);
	this.loadGrid(p_wallGrid);
	this.answerGrid = [];
	this.spacesByRegion =  [];
	this.notPlacedYetByRegion = [];
	this.neighborsGrid = [];
	this.happenedEvents = [];	
	this.loadIntelligence(); 
}

GlobalNorinori.prototype = new Global(1,1);
GlobalNorinori.prototype.constructor = GlobalNorinori;

/**
Calls the function that launches the intelligence of the grid. Very important !
*/
GlobalNorinori.prototype.loadIntelligence = function(){
	this.xLength = this.wallGrid[0].length;
	this.yLength = this.wallGrid.length;
	this.listSpacesByRegion(); //spacesByRegion
	this.buildPossibilities(); //notPlacedYetByRegion
	this.buildAnswerGrid(); //answerGrid
	this.buildNeighborsGrid(); //neighborsGrid
	this.purifyAnswerGrid(); 
	this.happenedEvents = [];
}

/**
Starts the answerGrid
*/
GlobalNorinori.prototype.buildAnswerGrid = function(){
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
GlobalNorinori.prototype.purifyAnswerGrid = function(){
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
Sets up the neighbor grid
Precondition : xLength and yLength are known
*/
GlobalNorinori.prototype.buildNeighborsGrid = function(){
	this.neighborsGrid = [];
	for(var iy=0;iy<this.yLength;iy++){
		this.neighborsGrid.push([]);
		for(var ix=0;ix<this.xLength;ix++){
			this.neighborsGrid[iy].push({undecided : 4, Os : 0});
		}
	}
	for(var iy=1;iy<this.yLength-1;iy++){
		this.neighborsGrid[iy][0].undecided = 3;
		this.neighborsGrid[iy][this.xLength-1].undecided = 3;
	}
	for(var ix=1;ix<this.xLength-1;ix++){
		this.neighborsGrid[0][ix].undecided =  3;
		this.neighborsGrid[this.yLength-1][ix].undecided = 3;
	}
	this.neighborsGrid[0][0].undecided = 2;
	this.neighborsGrid[0][this.xLength-1].undecided = 2;
	this.neighborsGrid[this.yLength-1][0].undecided = 2;
	this.neighborsGrid[this.yLength-1][this.xLength-1].undecided = 2;
}

//TODO modify this description
/**
Sets the list of spaces for each row and column (might be exportated)
Hyphothesis : all non-banned regions are numbered from 0 to n-1 ; banned spaces have lower-than-0 numbers
Exit : all spaces within a region are in reading order (top to bottom, then left to right)
*/
GlobalNorinori.prototype.listSpacesByRegion = function(){
	var ix,iy;
	var lastRegionNumber = 0;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
		}
	}
	
	this.spacesByRegion = [];
	for(var i=0;i<=lastRegionNumber;i++){
		this.spacesByRegion.push([]);
	}
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			if(this.regionGrid[iy][ix] >= 0){
				this.spacesByRegion[this.regionGrid[iy][ix]].push({x:ix,y:iy});
			}
		}
	}
}

/**
Puts the number of remaining spaces to fill (Os) and to remain white (Xs) in each region, row and column, assuming we start from scratch.
Precondition : this.spacesByRegion must be refreshed, since it will be needed for region.
*/
GlobalNorinori.prototype.buildPossibilities = function(p_numberStarsPer){
	this.notPlacedYetByRegion = [];
	for(var i=0;i<this.spacesByRegion.length;i++){
		this.notPlacedYetByRegion.push({Os:2,Xs:this.spacesByRegion[i].length-2});
	}
}

//----------------------
//Getters (not setters, of course)

GlobalNorinori.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

GlobalNorinori.prototype.getOsRemainRegion = function(p_i){return this.notPlacedYetByRegion[p_i].Os;}
GlobalNorinori.prototype.getXsRemainRegion = function(p_i){return this.notPlacedYetByRegion[p_i].Xs;}
GlobalNorinori.prototype.getFirstSpaceRegion = function(p_i){return this.spacesByRegion[p_i][0];}
GlobalNorinori.prototype.getRegionsNumber = function(){return this.spacesByRegion.length;}

//------------------
//Strategy management
/**
Admits that this space could be filled or not...
*/
GlobalNorinori.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	var result = this.tryToPutNew(p_x,p_y,p_symbol);
	if (result != null && result.eventsApplied.length > 0){
		this.happenedEvents.push(result.eventsApplied);
		return {result:RESULT.SUCCESS,eventsApplied:result.eventsApplied};
	}
	return {result:RESULT.FAILURE,eventsApplied:[]};
}

//------------------
// TODO : pass and multipass.

//------------------
//Putting symbols into spaces. 

/**Tries to put a symbol into the space of a grid. 3 possibilities :
RESULT.SUCCESS : it was indeed put into the grid ; the number of Os and Xs for this region, row and column are also updated.
RESULT.HARMLESS : said symbol was either already put into that space OUT out of bounds beacuse of automatic operation. Don't change anything to the grid and remaining symbols
ERROR : there is a different symbol in that space. We have done a wrong hypothesis somewhere ! (or the grid was wrong at the basis !)
This is also used at grid start in order to put Xs in banned spaces, hence the check in the NO_STAR part.
*/
GlobalNorinori.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_x >= this.xLength) || (p_y < 0) || (p_y >= this.yLength) || 
	(this.answerGrid[p_y][p_x] == p_symbol)){
		return RESULT.HARMLESS;
	}
	debugTryToPutNewGold("Putting into grid : "+p_x+" "+p_y+" "+p_symbol);
	if (this.answerGrid[p_y][p_x] == FILLING.UNDECIDED){
		this.answerGrid[p_y][p_x] = p_symbol;
		var indexRegion = this.getRegion(p_x,p_y);
		if (p_symbol == FILLING.YES){
			this.notPlacedYetByRegion[indexRegion].Os--;
			if (p_x > 0){
				this.neighborsGrid[p_y][p_x-1].Os++;
				this.neighborsGrid[p_y][p_x-1].undecided--;	
			}if (p_y > 0){
				this.neighborsGrid[p_y-1][p_x].Os++;
				this.neighborsGrid[p_y-1][p_x].undecided--;	
			}if (p_x < this.xLength-1){
				this.neighborsGrid[p_y][p_x+1].Os++;
				this.neighborsGrid[p_y][p_x+1].undecided--;	
			}if (p_y < this.yLength-1){
				this.neighborsGrid[p_y+1][p_x].Os++;
				this.neighborsGrid[p_y+1][p_x].undecided--;	
			}
		} else if (p_symbol == FILLING.NO){
			if (indexRegion >= 0){
				this.notPlacedYetByRegion[indexRegion].Xs--;				
			}
			if (p_x > 0){
				this.neighborsGrid[p_y][p_x-1].undecided--;	
			}if (p_y > 0){
				this.neighborsGrid[p_y-1][p_x].undecided--;	
			}if (p_x < this.xLength-1){
				this.neighborsGrid[p_y][p_x+1].undecided--;	
			}if (p_y < this.yLength-1){
				this.neighborsGrid[p_y+1][p_x].undecided--;	
			}
		}
		return RESULT.SUCCESS;
	}
	if (this.answerGrid[p_y][p_x] != p_symbol){
		debugTryToPutNewGold("NOOOO !");
		return RESULT.ERROR;
	}
}

/**
When you want to remove a symbol from a space !
*/
GlobalNorinori.prototype.remove = function(p_x,p_y){
	var indexRegion = this.regionGrid[p_y][p_x];
	var symbol = this.answerGrid[p_y][p_x];
	this.answerGrid[p_y][p_x] = FILLING.UNDECIDED;
	debugTryToPutNew("Removing the following : "+p_x+" "+p_y+" "+symbol);
	if (symbol == FILLING.YES){
		this.notPlacedYetByRegion[indexRegion].Os++;
		if (p_x > 0){
			this.neighborsGrid[p_y][p_x-1].Os--;
			this.neighborsGrid[p_y][p_x-1].undecided++;	
		}if (p_y > 0){
			this.neighborsGrid[p_y-1][p_x].Os--;
			this.neighborsGrid[p_y-1][p_x].undecided++;	
		}if (p_x < this.xLength-1){
			this.neighborsGrid[p_y][p_x+1].Os--;
			this.neighborsGrid[p_y][p_x+1].undecided++;	
		}if (p_y < this.yLength-1){
			this.neighborsGrid[p_y+1][p_x].Os--;
			this.neighborsGrid[p_y+1][p_x].undecided++;	
		}
	}
	if (symbol == FILLING.NO){
		this.notPlacedYetByRegion[indexRegion].Xs++;
		if (p_x > 0){
			this.neighborsGrid[p_y][p_x-1].undecided++;	
		}if (p_y > 0){
			this.neighborsGrid[p_y-1][p_x].undecided++;	
		}if (p_x < this.xLength-1){
			this.neighborsGrid[p_y][p_x+1].undecided++;	
		}if (p_y < this.yLength-1){
			this.neighborsGrid[p_y+1][p_x].undecided++;	
		}
	}
}


/**
Tries to put a new symbol into a grid and then forces the filling of all stars and Xs that can be deduced logically without breaking the rules : 
-if a star is placed, all Xs around it
-if a star or an X is placed and it causes to have all the stars/Xs in that region/row/column deduced, fill this region/row/column with the missing symbols
-repeat until either new can be newly deduced (good, although this may be a wrong answer) or there is an absurd situation with two opposite symbols deduced in the same space (bad). 

BIG WARNING : if the end is successful, the list of spaces will be put into eventsApplied. But this doesn't mean they are all fine !
*/
//TODO : do something about big warning !
GlobalNorinori.prototype.tryToPutNew = function(p_x,p_y,p_symbol){
	
	if (this.answerGrid[p_y][p_x] != FILLING.UNDECIDED){
		debugHumanMisclick("Trying to put "+p_symbol+" at "+p_x+","+p_y+" ; there is already "+this.answerGrid[p_y][p_x]+" in this place !");
		return null;
	}
	
	var eventsToAdd = [new SpaceEvent(p_symbol,p_x,p_y)];
	var eventsApplied = [];
	var ok = true;
	var putNewResult;
	var spaceEventToApply;
	var spaceEventToAdd;
	var x,y,r,symbol,xi,yi,roundi;
	while ((eventsToAdd.length > 0) && ok){ 
		spaceEventToApply = eventsToAdd.pop();
		x = spaceEventToApply.x;
		y = spaceEventToApply.y;
		symbol = spaceEventToApply.symbol;
		putNewResult = this.putNew(x, y,symbol);
		ok = (putNewResult != RESULT.ERROR);
		if (putNewResult == RESULT.SUCCESS){
			r = this.getRegion(x,y); //(y,x) might be out of bounds, if so the putNewResult isn't supposed to be RESULT.SUCCESS. Hence the check only here.
			//Final alert on region
			if (this.notPlacedYetByRegion[r].Os == 0){
				var spaceInRegion;
				for(var si=0;si< this.spacesByRegion[r].length;si++){
					spaceInRegion = this.spacesByRegion[r][si];
					if (this.answerGrid[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,spaceInRegion.x,spaceInRegion.y)));
					}
				}
			}
			if (this.notPlacedYetByRegion[r].Xs == 0){
				var spaceInRegion;
				for(var si=0;si< this.spacesByRegion[r].length;si++){
					spaceInRegion = this.spacesByRegion[r][si];
					if (this.answerGrid[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES,spaceInRegion.x,spaceInRegion.y)));
					}
				}
			}
			
			var upward = (y>0);
			var leftward = (x>0);
			var rightward = (x<this.xLength-1);
			var downward = (y<this.yLength-1);
			if (symbol == FILLING.YES){
				//Alert on formed domino (down & up)
				//If not, if neighbors are undecided and now have exactly 2 Os neighbors (reminder : they are added one by one)
				//If this space has exactly one undecided neighbor and no O : add an O here.
				//Cornered O : the diagonally-opposite X.
				var notPartOfDomino = (this.neighborsGrid[y][x].Os == 0);
				var exactlyOneUndecidedNeighbor = (this.neighborsGrid[y][x].undecided == 1);
				var toBeMerged = (notPartOfDomino && exactlyOneUndecidedNeighbor);

				
				if (upward){ // Up
					if (this.answerGrid[y-1][x] == FILLING.YES){
						eventsToAdd=pushEventsDominoMadeVertical(eventsToAdd,x,y-1);
					} else if (this.neighborsGrid[y-1][x].Os == 2){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,x,y-1)));
					}
					if(toBeMerged && this.answerGrid[y-1][x] == FILLING.UNDECIDED){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES,x,y-1)));
					}
				}
				if (downward){ //Down
					if (this.answerGrid[y+1][x] == FILLING.YES){
						eventsToAdd=pushEventsDominoMadeVertical(eventsToAdd,x,y);
					} else if (this.neighborsGrid[y+1][x].Os == 2){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,x,y+1)));
					}
					if(toBeMerged && this.answerGrid[y+1][x] == FILLING.UNDECIDED){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES,x,y+1)));
					}
				}
				if (leftward) { //Left
					if(this.answerGrid[y][x-1] == FILLING.YES){
						eventsToAdd=pushEventsDominoMadeHorizontal(eventsToAdd,x-1,y);
					} else if (this.neighborsGrid[y][x-1].Os == 2){
							eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,x-1,y)));
					}
					if(toBeMerged && this.answerGrid[y][x-1] == FILLING.UNDECIDED){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES,x-1,y)));
					}
				}		
				if (rightward){ //Right
					if(this.answerGrid[y][x+1] == FILLING.YES){
						eventsToAdd=pushEventsDominoMadeHorizontal(eventsToAdd,x,y);
					} else if (this.neighborsGrid[y][x+1].Os == 2){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,x+1,y)));
					}
					if(toBeMerged && this.answerGrid[y][x+1] == FILLING.UNDECIDED){
						eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES,x+1,y)));
					}
				}
				//First O of a region
				if (this.notPlacedYetByRegion[r].Os == 1){ 
					if (!(this.hasNeighborQualifiable(r,x,y))){ //If we have put an O into a space without a foreign undecided neighbor OR a X (a non-"qualifiable" O, word subject to change) :
						debugTryToPutNew("Well, this has no neighbor qualifiable");
						for(var si=0;si< this.spacesByRegion[r].length;si++){ // Fill all unreachable spaces with X.
							spaceInRegion = this.spacesByRegion[r][si];
							if (this.answerGrid[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED && (!adjacentOrIdentical(spaceInRegion.x,spaceInRegion.y,x,y))){
								eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,spaceInRegion.x,spaceInRegion.y)));
							}
						}
					}
					else{
						debugTryToPutNew("This has neighbor qualifiable");
						for(var si=0;si< this.spacesByRegion[r].length;si++){ //Fill all spaces that won't be part of a domino with X
							spaceInRegion = this.spacesByRegion[r][si];
							if ((this.answerGrid[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED) && (!this.hasNeighborQualifiable(r,spaceInRegion.x,spaceInRegion.y))){
								eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,spaceInRegion.x,spaceInRegion.y)));
							}
						}
					}
				}
				eventsToAdd = this.pushEventsIfAloneAndCornered(eventsToAdd,leftward,upward,rightward,downward,x,y);
			}
			if (symbol == FILLING.NO){
				var alterX; 
				var alterY;
				//Four checks per direction :
				//If the neighbor cell is fully isolated => X
				//If the neighbor cell has only one undecided neighbor and is a single half of domino => O in the correct neighbor
				//If the neighbor cell belongs to a region with only one O and cannot be linked to any O => X into it.
				//If the neighbor cell is O => check if it is cornered and if yes add Xs in angles opposite to the corners
				[DIRECTION.LEFT,DIRECTION.UP,DIRECTION.RIGHT,DIRECTION.DOWN].forEach(direction =>{
					if (this.existentDirection(direction,x,y)){
						alterX = alteredX(direction,x);
						alterY = alteredY(direction,y);
						if ((this.neighborsGrid[alterY][alterX].undecided == 0) &&
							(this.neighborsGrid[alterY][alterX].Os == 0)){
							eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,alterX,alterY)));
						}
						if (this.isNotQualifiablePostPutX(alterX,alterY)){
							eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,alterX,alterY)));
						}
						if ((this.answerGrid[alterY][alterX] == FILLING.YES) && (this.furtherExistentDirection(direction,alterX,alterY))){
							eventsToAdd = this.pushEventsIfAloneAndCornered(eventsToAdd,leftward,upward,rightward,downward,alterX,alterY);
						}
						if (this.readyToBeCompletedDomino(alterX,alterY)){
							[DIRECTION.LEFT,DIRECTION.UP,DIRECTION.RIGHT,DIRECTION.DOWN].forEach(direction2 =>{
								if(direction2 != ((direction+2) % 4) ){
									if (this.existentDirection(direction2,alterX,alterY) &&
										this.answerGrid[alteredY(direction2,alterY)][alteredX(direction2,alterX)] == FILLING.UNDECIDED){
											eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES,alteredX(direction2,alterX),alteredY(direction2,alterY))));	
										}	
								}
							});
						}
					}
				});
			}
			eventsApplied.push(spaceEventToApply);
		} // if RESULT.SUCCESS
	}
	
	//Mistakes were made, we should undo everything 
	if (!ok){
		this.undoList(eventsApplied);
		return {eventsApplied:[],coherence:COHERENCE.FAILURE};
	} 
	
	//Actually it's fine !
	else{
		debugTryToPutNewGold("Yes !-----------------"); 
		return {eventsApplied:eventsApplied,coherence:COHERENCE.SUCCESS};
	}
}

/**
Pushes six events corresponding to the surroundings of an horizontal domino given the left space
*/
function pushEventsDominoMadeHorizontal(p_eventsToAdd,p_xLeft,p_yLeft){
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xLeft+2,p_yLeft)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xLeft-1,p_yLeft)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xLeft,p_yLeft-1)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xLeft,p_yLeft+1)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xLeft+1,p_yLeft-1)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xLeft+1,p_yLeft+1)));
	return p_eventsToAdd;
}


/**
Pushes six events corresponding to the surroundings of a vertical domino given the up space
*/
function pushEventsDominoMadeVertical(p_eventsToAdd,p_xUp,p_yUp){
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xUp,p_yUp+2)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xUp,p_yUp-1)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xUp-1,p_yUp+1)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xUp+1,p_yUp+1)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xUp-1,p_yUp)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_xUp+1,p_yUp)));
	return p_eventsToAdd;
}

GlobalNorinori.prototype.emptyUpwards = function(p_x,p_y){
	return ((p_y > 0) &&  this.answerGrid[p_y-1][p_x] == FILLING.UNDECIDED);
}
GlobalNorinori.prototype.emptyDownwards = function(p_x,p_y){
	return ((p_y < this.yLength-1) && this.answerGrid[p_y+1][p_x] == FILLING.UNDECIDED);
}
GlobalNorinori.prototype.emptyLeftwards = function(p_x,p_y){
	return ((p_x > 0) && this.answerGrid[p_y][p_x-1] == FILLING.UNDECIDED);
}
GlobalNorinori.prototype.emptyRightwards = function(p_x,p_y){
	return ((p_x < this.xLength-1) && this.answerGrid[p_y][p_x+1] == FILLING.UNDECIDED);
}
GlobalNorinori.prototype.readyToBeCompletedDomino = function(p_x,p_y){
	return (this.answerGrid[p_y][p_x] == FILLING.YES) && (this.neighborsGrid[p_y][p_x].undecided == 1) && (this.neighborsGrid[p_y][p_x].Os == 0);
}

GlobalNorinori.prototype.isNeighborQualifiable = function(p_indexRegion,p_x,p_y){
	return ((this.answerGrid[p_y][p_x] == FILLING.YES) || ((this.regionGrid[p_y][p_x] != p_indexRegion) && (this.answerGrid[p_y][p_x] == FILLING.UNDECIDED)));
}

GlobalNorinori.prototype.hasNeighborQualifiable = function(p_indexRegion,p_x,p_y){
	return ((p_x > 0 && this.isNeighborQualifiable(p_indexRegion,p_x-1,p_y)) ||
		   (p_y > 0 && this.isNeighborQualifiable(p_indexRegion,p_x,p_y-1)) ||
		   ((p_x < this.xLength - 1) && this.isNeighborQualifiable(p_indexRegion,p_x+1,p_y)) ||
		   ((p_y < this.yLength - 1) && this.isNeighborQualifiable(p_indexRegion,p_x,p_y+1)));
}

/**
Tests if an X should be put into a neighbor space of a newly put X because it is unqualifiable and in a region with already one O.
*/
GlobalNorinori.prototype.isNotQualifiablePostPutX = function(p_x,p_y){
	var indexRegion = this.regionGrid[p_y][p_x];
	return ((this.answerGrid[p_y][p_x] == FILLING.UNDECIDED) && (this.notPlacedYetByRegion[indexRegion].Os == 1) && !this.hasNeighborQualifiable(indexRegion,p_x,p_y));
}


GlobalNorinori.prototype.isBlockedLeft = function(p_x,p_y){
	return (p_x == 0 || this.answerGrid[p_y][p_x-1] == FILLING.NO);
}

GlobalNorinori.prototype.isBlockedUp = function(p_x,p_y){
	return (p_y == 0 || this.answerGrid[p_y-1][p_x] == FILLING.NO);
}

GlobalNorinori.prototype.isBlockedRight = function(p_x,p_y){
	return (p_x == (this.xLength-1) || this.answerGrid[p_y][p_x+1] == FILLING.NO);
}

GlobalNorinori.prototype.isBlockedDown = function(p_x,p_y){
	return (p_y == (this.yLength-1) || this.answerGrid[p_y+1][p_x] == FILLING.NO);
}


/**
Rushes the spaces with 2 regions by filling them with O (actually, fills one space and the next one follows)
*/
GlobalNorinori.prototype.quickStart = function(){
	var space;
	for(var i=0;i<this.spacesByRegion.length;i++){
		if(this.spacesByRegion[i].length == 2){
			space = this.spacesByRegion[i][0];
			this.emitHypothesis(space.x,space.y,FILLING.YES);
		}
	}
}




/**
Tests if an O in a space is alone and "cornered" (for all four corners)
The (p_x,p_y) space must contain an O.
*/
GlobalNorinori.prototype.pushEventsIfAloneAndCornered = function(p_eventsToAdd,p_leftward, p_upward, p_rightward, p_downward, p_x,p_y){
	if (this.neighborsGrid[p_y][p_x].Os == 1){
		return p_eventsToAdd;
	}
	var leftBlocked = this.isBlockedLeft(p_x,p_y);
	var rightBlocked = this.isBlockedRight(p_x,p_y);
	var upBlocked = this.isBlockedUp(p_x,p_y);
	var downBlocked = this.isBlockedDown(p_x,p_y);
	var goDown = upBlocked && p_downward;
	var goUp = p_upward && downBlocked;
	if (leftBlocked && p_rightward){
		if (goDown){
			p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_x+1,p_y+1)));
		}
		if (goUp){
			p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_x+1,p_y-1)));
		}
	}
	if (p_leftward && rightBlocked){
		if (goDown){
			p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_x-1,p_y+1)));
		}
		if (goUp){
			p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,p_x-1,p_y-1)));
		}
	}
	return p_eventsToAdd;
}




/**
Working on four directions to limit duplicated code
*/
GlobalNorinori.prototype.existentDirection = function(p_direction,p_x,p_y){
	switch(p_direction){
		case DIRECTION.LEFT : return (p_x > 0);
		case DIRECTION.UP : return (p_y > 0);
		case DIRECTION.RIGHT : return (p_x < (this.xLength-1));
		case DIRECTION.DOWN : return (p_y < (this.yLength-1));
	}
}

GlobalNorinori.prototype.furtherExistentDirection = function(p_direction,p_x,p_y){
	switch(p_direction){
		case DIRECTION.LEFT : return (p_x > 1);
		case DIRECTION.UP : return (p_y > 1);
		case DIRECTION.RIGHT : return (p_x < (this.xLength-2));
		case DIRECTION.DOWN : return (p_y < (this.yLength-2));
	}
}

alteredX = function(p_direction,p_x){
	return p_x+DIRECTION_X_COORDINATES[p_direction];
}

alteredY = function(p_direction,p_y){
	return p_y+DIRECTION_Y_COORDINATES[p_direction];
}

/*
Autres pistes à exploiter :
->3 cases diagonalement consécutives ne peuvent être toutes coloriées (à cause de celle du milieu)

->
O..
X?X
O.. 
Le ? est un X ; fonctionne aussi en remplaçant X par un mur.

->
O..
X?X
.X.
Le ? est un X.

TODO :
-> Ajouter la possibilité d'annuler jusqu'à ce qu'une certaine case soit effacée. (ou de rechercher le moment où une case a été effacée)
*/

/**
Cancel the last list of events since the last "non-deducted" space. TODO : change this name.
*/
GlobalNorinori.prototype.massUndo = function(){
	if (this.happenedEvents.length == 0)
		return;	
	var spaceEventsListToUndo = this.happenedEvents.pop();
	this.undoList(spaceEventsListToUndo);
} 

/**
Cancels a list of events passed in argument
*/
GlobalNorinori.prototype.undoList = function(p_list){
	console.log("We are going to undo a list of : "+p_list.length);
	var spaceEventToUndo;
	while (p_list.length !=0){
		spaceEventToUndo = p_list.pop();
		this.remove(spaceEventToUndo.x,spaceEventToUndo.y);
	}
}

/**
Logs that a space event is pushed into a list (in the calling function !) and returns the space event !
*/
function loggedSpaceEvent(spaceEvt){
	debugTryToPutNewGold("Event pushed : "+spaceEvt.toString());
	return spaceEvt
}

//--------------
/**Tests if two pairs of coordinates are orthogonally adjacent or identical
*/
function adjacentOrIdentical(p_x1,p_y1,p_x2,p_y2){
	var dy = Math.abs(p_y1-p_y2);
	var dx = Math.abs(p_x1-p_x2);
	return (dx+dy <= 1);
}
//--------------
// It's "to string" time !

function answerGridToString(p_grid){
	for(yi=0;yi<p_grid.length;yi++){
		row = "";
		for(xi=0;xi<p_grid.length;xi++){
			row+=p_grid[yi][xi];
		}
		console.log(row);
	}
}

/**
Returns the events to the text
p_onlyAssumed : true if only the assumed events should be written.
*/
GlobalNorinori.prototype.happenedEventsToString = function(p_onlyAssumed){
	var ei,li;
	var answer = "";
	if (p_onlyAssumed){
		this.happenedEvents.forEach(function(eventList){
			answer+=eventList[0].toString()+"\n";
		});
	}
	else{
		this.happenedEvents.forEach(function(eventList){
			eventList.forEach(function(spaceEvent){
				answer+=spaceEvent.toString()+"\n" 
			});
			answer+="--------\n";
		});
	}
	return answer;
}