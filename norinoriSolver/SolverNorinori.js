function SolverNorinori(p_wallArray) {
	GeneralSolver.call(this);
	this.construct(p_wallArray);
}

SolverNorinori.prototype = Object.create(GeneralSolver.prototype);
SolverNorinori.prototype.constructor = SolverNorinori;

SolverNorinori.prototype.construct = function(p_wallArray) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionGrid(); 
	this.answerGrid = [];
	this.spacesByRegion =  [];
	this.notPlacedYetByRegion = [];
	this.neighborsGrid = [];
	//Build intelligence !
	this.listSpacesByRegion(); //spacesByRegion
	this.buildPossibilities(); //notPlacedYetByRegion
	this.buildAnswerGrid(); //answerGrid
	this.buildNeighborsGrid(); //neighborsGrid
	this.purifyAnswerGrid(); 
	this.indexRegionsSortedBySize = null; //Will be initialized in the first use of multipass.
	this.methodSet = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsMultiPass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.methodTools = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryClosure(this)};

}

/**
Starts the answerGrid
*/
SolverNorinori.prototype.buildAnswerGrid = function(){
	this.answerGrid = [];
	for(iy = 0; iy < this.yLength ; iy++){
		this.answerGrid.push([]);
		for(ix = 0; ix < this.xLength ; ix++){
			this.answerGrid[iy].push(FILLING.UNDECIDED);
		}
	}
}

/**
Puts NOs into the answerGrid corresponding to banned spaces 
Precondition : both spacesByRegion and notPlacedYetByRegion have been refreshed and answerGrid is ok.
*/
SolverNorinori.prototype.purifyAnswerGrid = function(){
	//Removing banned spaces (hence the necessity to have things already updated)
	for(iy = 0; iy < this.yLength ; iy++){
		for(ix = 0; ix < this.xLength ; ix++){
			if (this.regionArray[iy][ix] == WALLGRID.OUT_OF_REGIONS){
				this.putNew(ix,iy,FILLING.NO);
			}
		}
	}
}

/**
Sets up the neighbor grid
Precondition : xLength and yLength are known
*/
SolverNorinori.prototype.buildNeighborsGrid = function(){
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

/**
Sets the list of spaces for each row and column (might be exportated)
Hyphothesis : all non-banned regions are numbered from 0 to n-1 ; banned spaces have lower-than-0 numbers
Exit : all spaces within a region are in reading order (top to bottom, then left to right)
*/
SolverNorinori.prototype.listSpacesByRegion = function(){
	var ix,iy;
	var lastRegionNumber = 0;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionArray[iy][ix],lastRegionNumber);
		}
	}
	
	this.spacesByRegion = [];
	for(var i=0;i<=lastRegionNumber;i++){
		this.spacesByRegion.push([]);
	}
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			if(this.regionArray[iy][ix] >= 0){
				this.spacesByRegion[this.regionArray[iy][ix]].push({x:ix,y:iy});
			}
		}
	}
}

/**
Puts the number of remaining spaces to fill (Os) and to remain white (Xs) in each region, row and column, assuming we start from scratch.
Precondition : this.spacesByRegion must be refreshed, since it will be needed for region.
*/
SolverNorinori.prototype.buildPossibilities = function(p_numberStarsPer){
	this.notPlacedYetByRegion = [];
	for(var i=0;i<this.spacesByRegion.length;i++){
		this.notPlacedYetByRegion.push({Os:2,Xs:this.spacesByRegion[i].length-2});
	}
}

//----------------------
// Misc methods (may be used for drawing and intelligence)

SolverNorinori.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

SolverNorinori.prototype.getOsRemainRegion = function(p_i){return this.notPlacedYetByRegion[p_i].Os;}
SolverNorinori.prototype.getXsRemainRegion = function(p_i){return this.notPlacedYetByRegion[p_i].Xs;}
SolverNorinori.prototype.getFirstSpaceRegion = function(p_i){return this.spacesByRegion[p_i][0];}
SolverNorinori.prototype.getRegionsNumber = function(){return this.spacesByRegion.length;}

SolverNorinori.prototype.getRegion = function(p_x,p_y){
	return this.regionArray[p_y][p_x];
}

//------------------
// Input methods
/**
Admits that this space could be filled or not...
*/
SolverNorinori.prototype.emitHypothesis = function(p_x,p_y,p_symbol) {
	this.tryToPutNew(p_x,p_y,p_symbol);
}

/**
Cancels the last list of events since the last "non-deducted" space.
*/
SolverNorinori.prototype.undo = function(){
	this.undoToLastHypothesis(undoEventClosure(this));
}

/**
Rushes the spaces with 2 regions by filling them with O (actually, fills one space and the next one follows)
*/
SolverNorinori.prototype.quickStart = function(){
	var space;
	this.initiateQuickStart();
	for(var i=0;i<this.spacesByRegion.length;i++){
		if(this.spacesByRegion[i].length == 2){
			space = this.spacesByRegion[i][0];
			this.emitHypothesis(space.x,space.y,FILLING.YES);
		}
	}
	this.terminateQuickStart();
}

SolverNorinori.prototype.emitPassRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.passEvents(generatedEvents, this.methodSet, this.methodTools, p_indexRegion, "Region "+p_indexRegion); 
}

SolverNorinori.prototype.makeMultiPass = function() {
	this.multiPass(this.methodSet, this.methodTools, this.methodsMultiPass);
}

namingCategoryClosure = function(p_solver) {
	return function (p_indexRegion) {
		return "Region "+ p_indexRegion + " (" + p_solver.getFirstSpaceRegion(p_indexRegion).x +" "+ p_solver.getFirstSpaceRegion(p_indexRegion).y + ")"; 
	}
}

//------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		return p_solver.putNew(eventToApply.x, eventToApply.y, eventToApply.symbol);
	}
}

/**Tries to put a symbol into the space of a grid. 3 possibilities :
SUCCESS : it was indeed put into the grid ; the number of Os and Xs for this region, row and column are also updated.
HARMLESS : said symbol was either already put into that space OUT out of bounds beacuse of automatic operation. Don't change anything to the grid and remaining symbols
FAILURE : there is a different symbol in that space. We have done a wrong hypothesis somewhere ! (or the grid was wrong at the basis !)
This is also used at grid start in order to put Xs in banned spaces, hence the check in the NO part.
*/
SolverNorinori.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_x >= this.xLength) || (p_y < 0) || (p_y >= this.yLength) || 
	(this.answerGrid[p_y][p_x] == p_symbol)){
		return EVENT_RESULT.HARMLESS;
	}
	autoLogTryToPutNewGold("Putting into grid : "+p_x+" "+p_y+" "+p_symbol);
	if (this.answerGrid[p_y][p_x] == FILLING.UNDECIDED) {
		this.answerGrid[p_y][p_x] = p_symbol;
		var indexRegion = this.getRegion(p_x,p_y);
		if (p_symbol == FILLING.YES){
			this.notPlacedYetByRegion[indexRegion].Os--;
			if (p_x > 0) {
				this.neighborsGrid[p_y][p_x-1].Os++;
				this.neighborsGrid[p_y][p_x-1].undecided--;	
			} 
			if (p_y > 0) {
				this.neighborsGrid[p_y-1][p_x].Os++;
				this.neighborsGrid[p_y-1][p_x].undecided--;	
			}
			if (p_x <= this.xLength-2) {
				this.neighborsGrid[p_y][p_x+1].Os++;
				this.neighborsGrid[p_y][p_x+1].undecided--;	
			}
			if (p_y <= this.yLength-2) {
				this.neighborsGrid[p_y+1][p_x].Os++;
				this.neighborsGrid[p_y+1][p_x].undecided--;	
			}
		} else if (p_symbol == FILLING.NO){
			if (indexRegion >= 0){
				this.notPlacedYetByRegion[indexRegion].Xs--;				
			}
			if (p_x > 0) {
				this.neighborsGrid[p_y][p_x-1].undecided--;	
			}
			if (p_y > 0) {
				this.neighborsGrid[p_y-1][p_x].undecided--;	
			}
			if (p_x <= this.xLength-2) {
				this.neighborsGrid[p_y][p_x+1].undecided--;	
			}
			if (p_y <= this.yLength-2) {
				this.neighborsGrid[p_y+1][p_x].undecided--;	
			}
		}
		return EVENT_RESULT.SUCCESS;
	}
	if (this.answerGrid[p_y][p_x] != p_symbol){
		return EVENT_RESULT.FAILURE;
	}
}

undoEventClosure = function(p_solver) {
	return function(eventToUndo) {
		x = eventToUndo.x;
		y = eventToUndo.y;
		var indexRegion = p_solver.regionArray[y][x];
		var symbol = p_solver.answerGrid[y][x];
		p_solver.answerGrid[y][x] = FILLING.UNDECIDED;
		autoLogDeduction("Removing the following : "+x+" "+y+" "+symbol);
		if (symbol == FILLING.YES){
			p_solver.notPlacedYetByRegion[indexRegion].Os++;
			if (x > 0){
				p_solver.neighborsGrid[y][x-1].Os--;
				p_solver.neighborsGrid[y][x-1].undecided++;	
			}if (y > 0){
				p_solver.neighborsGrid[y-1][x].Os--;
				p_solver.neighborsGrid[y-1][x].undecided++;	
			}if (x < p_solver.xLength-1){
				p_solver.neighborsGrid[y][x+1].Os--;
				p_solver.neighborsGrid[y][x+1].undecided++;	
			}if (y < p_solver.yLength-1){
				p_solver.neighborsGrid[y+1][x].Os--;
				p_solver.neighborsGrid[y+1][x].undecided++;	
			}
		}
		if (symbol == FILLING.NO){
			p_solver.notPlacedYetByRegion[indexRegion].Xs++;
			if (x > 0){
				p_solver.neighborsGrid[y][x-1].undecided++;	
			}if (y > 0){
				p_solver.neighborsGrid[y-1][x].undecided++;	
			}if (x < p_solver.xLength-1){
				p_solver.neighborsGrid[y][x+1].undecided++;	
			}if (y < p_solver.yLength-1){
				p_solver.neighborsGrid[y+1][x].undecided++;	
			}
		}	
	}
}

//--------------------------------

// Central method
SolverNorinori.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	methodPack = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.tryToApplyHypothesis(new SpaceEvent(p_symbol, p_x, p_y), methodPack);
}

//--------------
// Intelligence

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const symbol = p_eventBeingApplied.symbol;
		r = p_solver.getRegion(x,y); //(y,x) might be out of bounds, if so the putNewResult isn't supposed to be EVENT_RESULT.SUCCESS. Hence the check only here.
		//Final alert on region
		if (p_solver.notPlacedYetByRegion[r].Os == 0) {
			var spaceInRegion;
			for(var si=0;si< p_solver.spacesByRegion[r].length;si++) {
				spaceInRegion = p_solver.spacesByRegion[r][si];
				if (p_solver.answerGrid[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED) {
					p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,spaceInRegion.x,spaceInRegion.y)));
				}
			}
		}
		if (p_solver.notPlacedYetByRegion[r].Xs == 0) {
			var spaceInRegion;
			for(var si=0;si< p_solver.spacesByRegion[r].length;si++) {
				spaceInRegion = p_solver.spacesByRegion[r][si];
				if (p_solver.answerGrid[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED) {
					p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES,spaceInRegion.x,spaceInRegion.y)));
				}
			}
		}
		
		var upward = (y>0);
		var leftward = (x>0);
		var rightward = (x<p_solver.xLength-1);
		var downward = (y<p_solver.yLength-1);
		if (symbol == FILLING.YES){
			//Alert on formed domino (down & up)
			//If not, if neighbors are undecided and now have exactly 2 Os neighbors (reminder : they are added one by one)
			//If this space has exactly one undecided neighbor and no O : add an O here.
			//Cornered O : the diagonally-opposite X.
			var notPartOfDomino = (p_solver.neighborsGrid[y][x].Os == 0);
			var exactlyOneUndecidedNeighbor = (p_solver.neighborsGrid[y][x].undecided == 1);
			var toBeMerged = (notPartOfDomino && exactlyOneUndecidedNeighbor);

			KnownDirections.forEach(direction =>{
				if (p_solver.existentDirection(direction, x, y)){
					var alterX = x + DeltaX[direction]; 
					var alterY = y + DeltaY[direction];
					if(p_solver.answerGrid[alterY][alterX] == FILLING.YES){
						switch(direction) {
							case(DIRECTION.UP):
								p_listEventsToApply=pushEventsDominoMadeVertical(p_listEventsToApply,x,y-1);break;
							case(DIRECTION.RIGHT):
								p_listEventsToApply=pushEventsDominoMadeHorizontal(p_listEventsToApply,x,y);break;
							case(DIRECTION.DOWN):
								p_listEventsToApply=pushEventsDominoMadeVertical(p_listEventsToApply,x,y);break;
							case(DIRECTION.LEFT):
								p_listEventsToApply=pushEventsDominoMadeHorizontal(p_listEventsToApply,x-1,y);break;
						}
					} else if (p_solver.neighborsGrid[alterY][alterX].Os == 2){
						p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,alterX,alterY)));
					}
					if(toBeMerged && p_solver.answerGrid[alterY][alterX] == FILLING.UNDECIDED){
						p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES,alterX,alterY)));
					}
				}
			});
			//First O of a region
			if (p_solver.notPlacedYetByRegion[r].Os == 1){ 
				if (!(p_solver.hasNeighborQualifiable(r,x,y))){ //If we have put an O into a space without a foreign undecided neighbor OR a X (a non-"qualifiable" O, word subject to change) :
					autoLogDeduction("Well, this has no neighbor qualifiable");
					for(var si=0;si< p_solver.spacesByRegion[r].length;si++){ // Fill all unreachable spaces with X.
						spaceInRegion = p_solver.spacesByRegion[r][si];
						if (p_solver.answerGrid[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED && (!adjacentOrIdentical(spaceInRegion.x,spaceInRegion.y,x,y))){
							p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,spaceInRegion.x,spaceInRegion.y)));
						}
					}
				}
				else{
					autoLogDeduction("This has neighbor qualifiable");
					for(var si=0;si< p_solver.spacesByRegion[r].length;si++){ //Fill all spaces that won't be part of a domino with X
						spaceInRegion = p_solver.spacesByRegion[r][si];
						if ((p_solver.answerGrid[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED) && (!p_solver.hasNeighborQualifiable(r,spaceInRegion.x,spaceInRegion.y))){
							p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,spaceInRegion.x,spaceInRegion.y)));
						}
					}
				}
			}
			p_listEventsToApply = p_solver.pushEventsIfAloneAndCornered(p_listEventsToApply,leftward,upward,rightward,downward,x,y);
		}
		if (symbol == FILLING.NO){
			var alterX; 
			var alterY;
			//Four checks per direction :
			//If the neighbor cell is fully isolated => X
			//If the neighbor cell has only one undecided neighbor and is a single half of domino => O in the correct neighbor
			//If the neighbor cell belongs to a region with only one O and cannot be linked to any O => X into it.
			//If the neighbor cell is O => check if it is cornered and if yes add Xs in angles opposite to the corners
			KnownDirections.forEach(direction =>{
				if (p_solver.existentDirection(direction,x,y)){
					alterX = x + DeltaX[direction];
					alterY = y + DeltaY[direction];
					if ((p_solver.neighborsGrid[alterY][alterX].undecided == 0) &&
						(p_solver.neighborsGrid[alterY][alterX].Os == 0)){
						p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,alterX,alterY)));
					}
					if (p_solver.isNotQualifiablePostPutX(alterX,alterY)){
						p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.NO,alterX,alterY)));
					}
					if ((p_solver.answerGrid[alterY][alterX] == FILLING.YES) && (p_solver.furtherExistentDirection(direction,alterX,alterY))){
						p_listEventsToApply = p_solver.pushEventsIfAloneAndCornered(p_listEventsToApply,leftward,upward,rightward,downward,alterX,alterY);
					}
					if (p_solver.readyToBeCompletedDomino(alterX, alterY)){
						KnownDirections.forEach(direction2 => {
							if(direction2 != OppositeDirection[direction]){
								if (p_solver.existentDirection(direction2, alterX, alterY) &&
									p_solver.answerGrid[alterY + DeltaY[direction2]][alterX + DeltaX[direction2]] == FILLING.UNDECIDED) {
										p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(FILLING.YES, alterX + DeltaX[direction2], alterY + DeltaY[direction2])));	
									}	
							}
						});
					}
				}
			});
		}		
		return p_listEventsToApply;
	}
}

/**
Pushes six events corresponding to the surroundings of an horizontal domino given the left space
*/
function pushEventsDominoMadeHorizontal(p_eventsToAdd, p_xLeft, p_yLeft){
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

SolverNorinori.prototype.emptyUpwards = function(p_x,p_y){
	return ((p_y > 0) &&  this.answerGrid[p_y-1][p_x] == FILLING.UNDECIDED);
}
SolverNorinori.prototype.emptyDownwards = function(p_x,p_y){
	return ((p_y < this.yLength-1) && this.answerGrid[p_y+1][p_x] == FILLING.UNDECIDED);
}
SolverNorinori.prototype.emptyLeftwards = function(p_x,p_y){
	return ((p_x > 0) && this.answerGrid[p_y][p_x-1] == FILLING.UNDECIDED);
}
SolverNorinori.prototype.emptyRightwards = function(p_x,p_y){
	return ((p_x < this.xLength-1) && this.answerGrid[p_y][p_x+1] == FILLING.UNDECIDED);
}
SolverNorinori.prototype.readyToBeCompletedDomino = function(p_x,p_y){
	return (this.answerGrid[p_y][p_x] == FILLING.YES) && (this.neighborsGrid[p_y][p_x].undecided == 1) && (this.neighborsGrid[p_y][p_x].Os == 0);
}

SolverNorinori.prototype.isNeighborQualifiable = function(p_indexRegion,p_x,p_y){
	return ((this.answerGrid[p_y][p_x] == FILLING.YES) || ((this.regionArray[p_y][p_x] != p_indexRegion) && (this.answerGrid[p_y][p_x] == FILLING.UNDECIDED)));
}

SolverNorinori.prototype.hasNeighborQualifiable = function(p_indexRegion,p_x,p_y){
	return ((p_x > 0 && this.isNeighborQualifiable(p_indexRegion,p_x-1,p_y)) ||
		   (p_y > 0 && this.isNeighborQualifiable(p_indexRegion,p_x,p_y-1)) ||
		   ((p_x < this.xLength - 1) && this.isNeighborQualifiable(p_indexRegion,p_x+1,p_y)) ||
		   ((p_y < this.yLength - 1) && this.isNeighborQualifiable(p_indexRegion,p_x,p_y+1)));
}

/**
Tests if an X should be put into a neighbor space of a newly put X because it is unqualifiable and in a region with already one O.
*/
SolverNorinori.prototype.isNotQualifiablePostPutX = function(p_x,p_y){
	var indexRegion = this.regionArray[p_y][p_x];
	return ((this.answerGrid[p_y][p_x] == FILLING.UNDECIDED) && (this.notPlacedYetByRegion[indexRegion].Os == 1) && !this.hasNeighborQualifiable(indexRegion,p_x,p_y));
}


SolverNorinori.prototype.isBlockedLeft = function(p_x,p_y){
	return (p_x == 0 || this.answerGrid[p_y][p_x-1] == FILLING.NO);
}

SolverNorinori.prototype.isBlockedUp = function(p_x,p_y){
	return (p_y == 0 || this.answerGrid[p_y-1][p_x] == FILLING.NO);
}

SolverNorinori.prototype.isBlockedRight = function(p_x,p_y){
	return (p_x == (this.xLength-1) || this.answerGrid[p_y][p_x+1] == FILLING.NO);
}

SolverNorinori.prototype.isBlockedDown = function(p_x,p_y){
	return (p_y == (this.yLength-1) || this.answerGrid[p_y+1][p_x] == FILLING.NO);
}



/**
Tests if an O in a space is alone and "cornered" (for all four corners)
The (p_x,p_y) space must contain an O.
*/
SolverNorinori.prototype.pushEventsIfAloneAndCornered = function(p_eventsToAdd,p_leftward, p_upward, p_rightward, p_downward, p_x,p_y){
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
SolverNorinori.prototype.existentDirection = function(p_direction,p_x,p_y){
	switch(p_direction){
		case DIRECTION.LEFT : return (p_x > 0);
		case DIRECTION.UP : return (p_y > 0);
		case DIRECTION.RIGHT : return (p_x < (this.xLength-1));
		case DIRECTION.DOWN : return (p_y < (this.yLength-1));
	}
}

SolverNorinori.prototype.furtherExistentDirection = function(p_direction,p_x,p_y){
	switch(p_direction){
		case DIRECTION.LEFT : return (p_x > 1);
		case DIRECTION.UP : return (p_y > 1);
		case DIRECTION.RIGHT : return (p_x < (this.xLength-2));
		case DIRECTION.DOWN : return (p_y < (this.yLength-2));
	}
}

/**Tests if two pairs of coordinates are orthogonally adjacent or identical
*/
function adjacentOrIdentical(p_x1,p_y1,p_x2,p_y2) {
	var dy = Math.abs(p_y1-p_y2);
	var dx = Math.abs(p_x1-p_x2);
	return (dx+dy <= 1);
}

//--------------
// Passing

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexRegion) {
		return p_solver.generateEventsForRegionPass(p_indexRegion);
	}
}

SolverNorinori.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var eventList = [];
	this.spacesByRegion[p_indexRegion].forEach(space => {
		if (this.answerGrid[space.y][space.x] == FILLING.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([new SpaceEvent(FILLING.YES, space.x, space.y), new SpaceEvent(FILLING.NO, space.x, space.y)]);
		}			 
	});
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	if (p_event2.y > p_event1.y) {
		return -1;
	} else if (p_event2.y < p_event1.y) {
		return 1;
	} else if (p_event2.x > p_event1.x) {
		return -1;
	} else if (p_event2.x < p_event1.x) {
		return 1;
	} else {
		const c1 = (p_event1.symbol == FILLING.YES ? 1 : 0);
		const c2 = (p_event2.symbol == FILLING.YES ? 1 : 0); // Works because only two values are admitted
		return c1-c2;
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		var values = [];
		for (var i = 0; i < p_solver.spacesByRegion.length ; i++) {
			if (p_solver.notPlacedYetByRegion[i].Os > 0) {
				indexList.push(i);
				values.push(p_solver.uncertainity(i));
			} else {
				values.push(-1); // There MUST be one of these per region.
			}
		}
		indexList.sort(function(p_i1, p_i2) {
			return values[p_i1]-values[p_i2];
		});
		return indexList;
	}
}

SolverNorinori.prototype.uncertainity = function(p_ir) {
	return this.notPlacedYetByRegion[p_ir].Xs - this.notPlacedYetByRegion[p_ir].Os*3;
}

skipPassClosure = function(p_solver) {
	return function (p_indexRegion) {
		return p_solver.uncertainity(p_indexRegion) > 5; // Arbitrary value
	}
}

//--------------
// "To string" and logs

/**
Logs that a space event is pushed into a list (in the calling function !) and returns the space event !
*/
function loggedSpaceEvent(spaceEvt){
	autoLogTryToPutNewGold("Event pushed : "+spaceEvt.toString());
	return spaceEvt
}

function answerGridToString(p_grid){
	for(yi=0;yi<p_grid.length;yi++){
		row = "";
		for(xi=0;xi<p_grid.length;xi++){
			row+=p_grid[yi][xi];
		}
		console.log(row);
	}
}

/*
Pour aller plus loin :
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