function SolverNorinori(p_wallArray) {
	GeneralSolver.call(this);
	this.construct(p_wallArray);
}

SolverNorinori.prototype = Object.create(GeneralSolver.prototype);
SolverNorinori.prototype.constructor = SolverNorinori;

function DummySolver() {
	return new SolverNorinori(generateWallArray(1, 1), 1);
}

SolverNorinori.prototype.construct = function(p_wallArray) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionArray = this.gridWall.toRegionArray(); 
	this.answerArray = [];
	this.notPlacedYetByRegion = [];
	this.neighborsArray = [];
	//Build intelligence !
	this.spacesByRegion = listSpacesByRegion(this.regionArray);
	this.buildPossibilities(); //notPlacedYetByRegion
	this.buildAnswerArray(); //answerArray
	this.buildNeighborsArray(); //neighborsArray
	this.purifyanswerArray(); 
	this.indexRegionsSortedBySize = null; //Will be initialized in the first use of multipass.
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryClosure(this)};

}

/**
Starts the answerArray
*/
SolverNorinori.prototype.buildAnswerArray = function() {
	this.answerArray = [];
	for(iy = 0; iy < this.yLength ; iy++) {
		this.answerArray.push([]);
		for(ix = 0; ix < this.xLength ; ix++) {
			this.answerArray[iy].push(FILLING.UNDECIDED);
		}
	}
}

/**
Puts NOs into the answerArray corresponding to banned spaces 
Precondition : both spacesByRegion and notPlacedYetByRegion have been refreshed and answerArray is ok.
*/
SolverNorinori.prototype.purifyanswerArray = function(){
	//Removing banned spaces (hence the necessity to have things already updated)
	for(iy = 0; iy < this.yLength ; iy++) {
		for(ix = 0; ix < this.xLength ; ix++) {
			if (this.regionArray[iy][ix] == WALLGRID.OUT_OF_REGIONS) {
				this.putNew(ix, iy, FILLING.NO);
			}
		}
	}
}

/**
Sets up the neighbor grid
Precondition : xLength and yLength are known
*/
SolverNorinori.prototype.buildNeighborsArray = function(){
	this.neighborsArray = [];
	for(var iy=0;iy<this.yLength;iy++) {
		this.neighborsArray.push([]);
		for(var ix=0;ix<this.xLength;ix++) {
			this.neighborsArray[iy].push({undecided : 4, Os : 0});
		}
	}
	for(var iy=1;iy<this.yLength-1;iy++){
		this.neighborsArray[iy][0].undecided = 3;
		this.neighborsArray[iy][this.xLength-1].undecided = 3;
	}
	for(var ix=1;ix<this.xLength-1;ix++){
		this.neighborsArray[0][ix].undecided =  3;
		this.neighborsArray[this.yLength-1][ix].undecided = 3;
	}
	this.neighborsArray[0][0].undecided = 2;
	this.neighborsArray[0][this.xLength-1].undecided = 2;
	this.neighborsArray[this.yLength-1][0].undecided = 2;
	this.neighborsArray[this.yLength-1][this.xLength-1].undecided = 2;
}

/**
Puts the number of remaining spaces to fill (Os) and to remain white (Xs) in each region, row and column, assuming we start from scratch.
Precondition : this.spacesByRegion must be refreshed, since it will be needed for region.
*/
SolverNorinori.prototype.buildPossibilities = function(p_numberStarsPer) {
	this.notPlacedYetByRegion = [];
	for(var i=0 ; i < this.spacesByRegion.length ; i++) {
		this.notPlacedYetByRegion.push({Os:2, Xs:this.spacesByRegion[i].length-2});
	}
}

//----------------------
// Misc methods (may be used for drawing and intelligence)

SolverNorinori.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverNorinori.prototype.getOsRemainRegion = function(p_i){return this.notPlacedYetByRegion[p_i].Os;}
SolverNorinori.prototype.getXsRemainRegion = function(p_i){return this.notPlacedYetByRegion[p_i].Xs;}
SolverNorinori.prototype.getFirstSpaceRegion = function(p_i){return this.spacesByRegion[p_i][0];}
SolverNorinori.prototype.getRegionsNumber = function(){return this.spacesByRegion.length;}

SolverNorinori.prototype.getRegion = function(p_x, p_y) {
	return this.regionArray[p_y][p_x];
}

//------------------
// Input methods
/**
Admits that this space could be filled or not...
*/
SolverNorinori.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
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
SolverNorinori.prototype.quickStart = function() {
	var space;
	this.initiateQuickStart();
	for(var i=0 ; i < this.spacesByRegion.length ; i++){
		if(this.spacesByRegion[i].length == 2){
			space = this.spacesByRegion[i][0];
			this.emitHypothesis(space.x, space.y, FILLING.YES);
		}
	}
	this.terminateQuickStart();
}

SolverNorinori.prototype.emitPassRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.passEvents(generatedEvents, p_indexRegion, "Region " + p_indexRegion); 
}

SolverNorinori.prototype.makeMultiPass = function() {
	this.multiPass(this.methodsSetMultiPass);
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
	(this.answerArray[p_y][p_x] == p_symbol)){
		return EVENT_RESULT.HARMLESS;
	}
	autoLogTryToPutNewGold("Putting into grid : "+p_x+" "+p_y+" "+p_symbol);
	if (this.answerArray[p_y][p_x] == FILLING.UNDECIDED) {
		this.answerArray[p_y][p_x] = p_symbol;
		var indexRegion = this.getRegion(p_x,p_y);
		if (p_symbol == FILLING.YES){
			this.notPlacedYetByRegion[indexRegion].Os--;
			this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
				this.neighborsArray[coorsDir.y][coorsDir.x].Os++;
				this.neighborsArray[coorsDir.y][coorsDir.x].undecided--;
			});
		} else if (p_symbol == FILLING.NO){
			if (indexRegion >= 0){
				this.notPlacedYetByRegion[indexRegion].Xs--;				
			}
			this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
				this.neighborsArray[coorsDir.y][coorsDir.x].undecided--;
			});
		}
		return EVENT_RESULT.SUCCESS;
	}
	if (this.answerArray[p_y][p_x] != p_symbol){
		return EVENT_RESULT.FAILURE;
	}
}

undoEventClosure = function(p_solver) {
	return function(eventToUndo) {
		x = eventToUndo.x;
		y = eventToUndo.y;
		var indexRegion = p_solver.regionArray[y][x];
		var symbol = p_solver.answerArray[y][x];
		p_solver.answerArray[y][x] = FILLING.UNDECIDED;
		autoLogDeduction("Removing the following : "+x+" "+y+" "+symbol);
		if (symbol == FILLING.YES){
			p_solver.notPlacedYetByRegion[indexRegion].Os++;
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
				p_solver.neighborsArray[coorsDir.y][coorsDir.x].Os--;
				p_solver.neighborsArray[coorsDir.y][coorsDir.x].undecided++;
			});
		}
		if (symbol == FILLING.NO) {
			p_solver.notPlacedYetByRegion[indexRegion].Xs++;
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
				p_solver.neighborsArray[coorsDir.y][coorsDir.x].undecided++;
			});
		}	
	}
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
			for(var si=0 ; si < p_solver.spacesByRegion[r].length ; si++) {
				spaceInRegion = p_solver.spacesByRegion[r][si];
				if (p_solver.answerArray[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED) {
					p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(spaceInRegion.x, spaceInRegion.y, FILLING.NO)));
				}
			}
		}
		if (p_solver.notPlacedYetByRegion[r].Xs == 0) {
			var spaceInRegion;
			for(var si=0;si< p_solver.spacesByRegion[r].length;si++) {
				spaceInRegion = p_solver.spacesByRegion[r][si];
				if (p_solver.answerArray[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED) {
					p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(spaceInRegion.x, spaceInRegion.y, FILLING.YES)));
				}
			}
		}
		
		if (symbol == FILLING.YES){
			//Alert on formed domino (down & up)
			//If not, if neighbors are undecided and now have exactly 2 Os neighbors (reminder : they are added one by one)
			//If this space has exactly one undecided neighbor and no O : add an O here.
			//Cornered O : the diagonally-opposite X.
			var notPartOfDomino = (p_solver.neighborsArray[y][x].Os == 0);
			var exactlyOneUndecidedNeighbor = (p_solver.neighborsArray[y][x].undecided == 1);
			var toBeMerged = (notPartOfDomino && exactlyOneUndecidedNeighbor);
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
				const dx = coorsDir.x; 
				const dy = coorsDir.y;
				if(p_solver.answerArray[dy][dx] == FILLING.YES){
					switch(coorsDir.direction) {
						case(DIRECTION.UP) :
							p_listEventsToApply = pushEventsDominoMadeVertical(p_listEventsToApply, x, y-1);break;
						case(DIRECTION.RIGHT) :
							p_listEventsToApply = pushEventsDominoMadeHorizontal(p_listEventsToApply, x, y);break;
						case(DIRECTION.DOWN) :
							p_listEventsToApply = pushEventsDominoMadeVertical(p_listEventsToApply, x, y);break;
						case(DIRECTION.LEFT) :
							p_listEventsToApply = pushEventsDominoMadeHorizontal(p_listEventsToApply, x-1, y);break;
					}
				} else if (p_solver.neighborsArray[dy][dx].Os == 2) {
					p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(dx, dy, FILLING.NO)));
				}
				if(toBeMerged && p_solver.answerArray[dy][dx] == FILLING.UNDECIDED) {
					p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(dx, dy, FILLING.YES)));
				}
			});
			
			//First O of a region
			if (p_solver.notPlacedYetByRegion[r].Os == 1){ 
				if (!(p_solver.hasNeighborQualifiable(r, x, y))) { //If we have put an O into a space without a foreign undecided neighbor OR a X (a non-"qualifiable" O, word subject to change) :
					autoLogDeduction("Well, this has no neighbor qualifiable");
					for(var si=0 ; si < p_solver.spacesByRegion[r].length ; si++) { // Fill all unreachable spaces with X.
						spaceInRegion = p_solver.spacesByRegion[r][si];
						if (p_solver.answerArray[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED && (!adjacentOrIdentical(spaceInRegion.x,spaceInRegion.y, x, y))) {
							p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(spaceInRegion.x, spaceInRegion.y, FILLING.NO)));
						}
					}
				}
				else{
					autoLogDeduction("This has neighbor qualifiable");
					for(var si=0 ; si < p_solver.spacesByRegion[r].length ; si++) { //Fill all spaces that won't be part of a domino with X
						spaceInRegion = p_solver.spacesByRegion[r][si];
						if ((p_solver.answerArray[spaceInRegion.y][spaceInRegion.x] == FILLING.UNDECIDED) && (!p_solver.hasNeighborQualifiable(r, spaceInRegion.x, spaceInRegion.y))){
							p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(spaceInRegion.x, spaceInRegion.y, FILLING.NO)));
						}
					}
				}
			}
			p_listEventsToApply = p_solver.deductionsIfAloneAndCornered(p_listEventsToApply, x, y);
		}
		if (symbol == FILLING.NO) {
			var alterX; 
			var alterY;
			//Four checks per direction :
			//If the neighbor cell is fully isolated => X
			//If the neighbor cell has only one undecided neighbor and is a single half of domino => O in the correct neighbor
			//If the neighbor cell belongs to a region with only one O and cannot be linked to any O => X into it.
			//If the neighbor cell is O => check if it is cornered and if yes add Xs in angles opposite to the corners
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
				const dx = coorsDir.x;
				const dy = coorsDir.y;
				const dir = coorsDir.direction;
				if ((p_solver.neighborsArray[dy][dx].undecided == 0) &&
					(p_solver.neighborsArray[dy][dx].Os == 0)){
					p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(dx, dy, FILLING.NO)));
				}
				if (p_solver.isNotQualifiablePostPutX(dx,dy)){
					p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(dx, dy, FILLING.NO)));
				}
				if ((p_solver.answerArray[dy][dx] == FILLING.YES) && (p_solver.distantNeighborExists(dx, dy, 2, dir))){
					p_listEventsToApply = p_solver.deductionsIfAloneAndCornered(p_listEventsToApply, dx, dy);
				}
				if (p_solver.readyToBeCompletedDomino(dx, dy)){
					KnownDirections.forEach(direction2 => {
						if(direction2 != OppositeDirection[dir]){
							if (p_solver.neighborExists(dx, dy, direction2) &&
								p_solver.answerArray[dy + DeltaY[direction2]][dx + DeltaX[direction2]] == FILLING.UNDECIDED) {
									p_listEventsToApply.push(loggedSpaceEvent(new SpaceEvent(dx + DeltaX[direction2], dy + DeltaY[direction2], FILLING.YES)));	
								}	
						}
					});
				}
			});
		}		
		return p_listEventsToApply;
	}
}

/**
Pushes six events corresponding to the surroundings of an horizontal domino given the left space
*/
function pushEventsDominoMadeHorizontal(p_eventsToAdd, p_xLeft, p_yLeft) {
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xLeft+2, p_yLeft, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xLeft-1, p_yLeft, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xLeft, p_yLeft-1, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xLeft, p_yLeft+1, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xLeft+1, p_yLeft-1, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xLeft+1, p_yLeft+1, FILLING.NO)));
	return p_eventsToAdd;
}


/**
Pushes six events corresponding to the surroundings of a vertical domino given the up space
*/
function pushEventsDominoMadeVertical(p_eventsToAdd, p_xUp, p_yUp) {
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xUp, p_yUp+2, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xUp, p_yUp-1, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xUp-1, p_yUp+1, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xUp+1, p_yUp+1, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xUp-1, p_yUp, FILLING.NO)));
	p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_xUp+1, p_yUp, FILLING.NO)));
	return p_eventsToAdd;
}

SolverNorinori.prototype.readyToBeCompletedDomino = function(p_x, p_y) {
	return (this.answerArray[p_y][p_x] == FILLING.YES) && (this.neighborsArray[p_y][p_x].undecided == 1) && (this.neighborsArray[p_y][p_x].Os == 0);
}

SolverNorinori.prototype.isNeighborQualifiable = function(p_indexRegion, p_x, p_y) {
	return ((this.answerArray[p_y][p_x] == FILLING.YES) || ((this.regionArray[p_y][p_x] != p_indexRegion) && (this.answerArray[p_y][p_x] == FILLING.UNDECIDED)));
}

SolverNorinori.prototype.hasNeighborQualifiable = function(p_indexRegion, p_x, p_y) {
	var answer = true;
	KnownDirections.forEach(dir => {
		answer |= (this.neighborExists(p_x, p_y, dir) && this.isNeighborQualifiable(p_indexRegion, p_x + DeltaX[dir], p_y + DeltaY[dir]));
	});
	return answer;
}

/**
Tests if an X should be put into a neighbor space of a newly put X because it is unqualifiable and in a region with already one O.
*/
SolverNorinori.prototype.isNotQualifiablePostPutX = function(p_x, p_y) {
	var indexRegion = this.regionArray[p_y][p_x];
	return ((this.answerArray[p_y][p_x] == FILLING.UNDECIDED) && (this.notPlacedYetByRegion[indexRegion].Os == 1) && !this.hasNeighborQualifiable(indexRegion, p_x, p_y));
}

SolverNorinori.prototype.directionFillingNo = function(p_x, p_y, p_dir) {
	return this.answerArray[p_y + DeltaY[p_dir]][p_x + DeltaX[p_dir]] == FILLING.NO;
}

/**
Tests if an O in a space is alone and "cornered" (for all four corners)
The (p_x,p_y) space must contain an O.
*/
SolverNorinori.prototype.deductionsIfAloneAndCornered = function(p_eventsToAdd, p_x, p_y) {
	if (this.neighborsArray[p_y][p_x].Os == 1) {
		return p_eventsToAdd;
	}
	const leftward = this.neighborExists(p_x, p_y, DIRECTION.LEFT);
	const upward = this.neighborExists(p_x, p_y, DIRECTION.UP);
	const rightward = this.neighborExists(p_x, p_y, DIRECTION.RIGHT);
	const downward = this.neighborExists(p_x, p_y, DIRECTION.DOWN);
	const leftBlocked = !leftward || this.directionFillingNo(p_x, p_y, DIRECTION.LEFT);
	const upBlocked = !upward || this.directionFillingNo(p_x, p_y, DIRECTION.UP);
	const rightBlocked = !rightward || this.directionFillingNo(p_x, p_y, DIRECTION.RIGHT);
	const downBlocked = !downward || this.directionFillingNo(p_x, p_y, DIRECTION.DOWN);
	var goDown = upBlocked && downward;
	var goUp = upward && downBlocked;
	if (leftBlocked && rightward){
		if (goDown){
			p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_x+1, p_y+1, FILLING.NO)));
		}                                                             
		if (goUp){                                                    
			p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_x+1, p_y-1, FILLING.NO)));
		}                                                             
	}                                                                 
	if (leftward && rightBlocked){                                    
		if (goDown){                                                  
			p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_x-1, p_y+1, FILLING.NO)));
		}                                                             
		if (goUp){                                                    
			p_eventsToAdd.push(loggedSpaceEvent(new SpaceEvent(p_x-1, p_y-1, FILLING.NO)));
		}
	}
	return p_eventsToAdd;
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
		if (this.answerArray[space.y][space.x] == FILLING.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([new SpaceEvent(space.x, space.y, FILLING.YES), new SpaceEvent(space.x, space.y, FILLING.NO)]);
		}			 
	});
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol],
	[p_event2.y, p_event2.x, p_event2.symbol]]);
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
	autoLogTryToPutNewGold("Event pushed : "+spaceEvt.toLogString());
	return spaceEvt
}

function answerArrayToString(p_grid){
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