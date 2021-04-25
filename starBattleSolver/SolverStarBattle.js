// ---------------------
// A few constants

const SYMBOL ={
	STAR : 'O',
	NO_STAR : 'X',
	UNDECIDED : '-'	
}

const STAR_BATTLE_CATEGORY = {
	REGION : 1,
	ROW : 2,
	COLUMN : 3
};

// ---------------------
// Setup

function SolverStarBattle(p_wallArray, p_starNumber) {
	GeneralSolver.call(this);
	this.construct(p_wallArray,p_starNumber);
}

SolverStarBattle.prototype = Object.create(GeneralSolver.prototype);
SolverStarBattle.prototype.constructor = SolverStarBattle;

function DummySolver() {
	return new SolverStarBattle(generateWallArray(1, 1), 1);
}

SolverStarBattle.prototype.construct = function(p_wallArray, p_starNumber) { 
	this.generalConstruct();
	this.answerArray = [];
	this.notPlacedYet = {regions:[], rows:[], columns:[]};
	this.happenedEventsSeries = [];	
	this.gridWall = WallGrid_data(p_wallArray);
	this.regionArray = this.gridWall.toRegionArray();
	this.spacesByRegion = listSpacesByRegion(this.regionArray);
	this.xyLength = p_wallArray.length; 
	this.xLength = this.xyLength; // Mandatory for some puzzles
	this.yLength = this.xyLength;
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetPass = {comparisonMethod : comparing, copyMethod : copying,  argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultiPass = {
		generatePassEventsMethod : generateEventsForRLCPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	
	this.buildPossibilities(p_starNumber); //notPlacedYet
	this.buildAnswerArray(); //answerArray
	this.purifyAnswerArray(); 
}

/**
Puts the number of remaining Stars (Os) and non-stars (Xs) in each region, row and column, assuming we start from scratch.
Precondition : this.spacesByRegion must be refreshed, since it will be needed for region.
*/
SolverStarBattle.prototype.buildPossibilities = function(p_numberStarsPer) {
	this.notPlacedYet = {regions:[],rows:[],columns:[]};
	const complement = this.xyLength - p_numberStarsPer;
	for(var i=0 ; i<this.xyLength ; i++) {
		this.notPlacedYet.rows.push({Os : p_numberStarsPer, Xs : complement});
		this.notPlacedYet.columns.push({Os : p_numberStarsPer, Xs : complement});
	}
	for(var i=0; i < this.spacesByRegion.length;i++) {
		this.notPlacedYet.regions.push({Os:p_numberStarsPer, Xs:this.spacesByRegion[i].length-p_numberStarsPer});
	}
}

/**
Starts the answerArray
*/
SolverStarBattle.prototype.buildAnswerArray = function() {
	this.answerArray = [];
	for(iy = 0; iy < this.xyLength ; iy++){
		this.answerArray.push([]);
		for(ix = 0; ix < this.xyLength ; ix++){
			this.answerArray[iy].push(SYMBOL.UNDECIDED);
		}
	}
}

/**
Puts Xs into the answerArray corresponding to banned spaces 
Precondition : both spacesByRegion and notPlacedYet have been refreshed and answerArray is ok.
*/
SolverStarBattle.prototype.purifyAnswerArray = function() {
	//Removing banned spaces (hence the necessity to have things already updated)
	for(iy = 0; iy < this.xyLength ; iy++) {
		for(ix = 0; ix < this.xyLength ; ix++) {
			if (this.regionArray[iy][ix] == WALLGRID.OUT_OF_REGIONS) {
				this.putNew(ix, iy, SYMBOL.NO_STAR);
			}
		}
	}
}

//----------------------
// Misc methods (may be used for drawing and intelligence)

SolverStarBattle.prototype.getAnswer = function(p_x, p_y){return this.answerArray[p_y][p_x];}
SolverStarBattle.prototype.getRegion = function(p_x, p_y){return this.regionArray[p_y][p_x];}
SolverStarBattle.prototype.getFirstSpaceRegion = function(p_i){return this.spacesByRegion[p_i][0];}

//------------------
// Input methods 

SolverStarBattle.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToPutNew(p_x, p_y, p_symbol);
}

SolverStarBattle.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverStarBattle.prototype.emitPassRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, {family : STAR_BATTLE_CATEGORY.REGION, index : p_indexRegion}); 
}

SolverStarBattle.prototype.emitPassRow = function(p_y) {
	const generatedEvents = this.generateEventsForRowPass(p_y);
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, {family : STAR_BATTLE_CATEGORY.ROW, index : p_y}); 
}

SolverStarBattle.prototype.emitPassColumn = function(p_x) {
	const generatedEvents = this.generateEventsForColumnPass(p_x);
	this.passEvents(generatedEvents, this.methodsSetDeductions, this.methodsSetPass, {family : STAR_BATTLE_CATEGORY.COLUMN, index : p_x}); 
}

SolverStarBattle.prototype.makeMultiPass = function() {	
	this.multiPass(this.methodsSetDeductions, this.methodsSetPass, this.methodsSetMultiPass);
}

namingCategoryClosure = function(p_solver) {
	return function(p_indexAndFamily) {
		const index = p_indexAndFamily.index;
		switch (p_indexAndFamily.family) {
			case STAR_BATTLE_CATEGORY.REGION : return "Region "+ index + " (" + p_solver.getFirstSpaceRegion(index).x +" "+ p_solver.getFirstSpaceRegion(index).y + ")"; break;
			case STAR_BATTLE_CATEGORY.ROW : return "Row " + index; break;
			case STAR_BATTLE_CATEGORY.COLUMN : return "Column " + index; break;
			default : return "";
		}
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
EVENT_RESULT.SUCCESS : it was indeed put into the grid ; the number of Os and Xs for this region, row and column are also updated.
EVENT_RESULT.HARMLESS : said symbol was either already put into that space OUT out of bounds beacuse of automatic operation. Don't change anything to the grid and remaining symbols
EVENT_RESULT.ERROR : there is a different symbol in that space. We have done a wrong hypothesis somewhere ! (or the grid was wrong at the basis !)
This is also used at grid start in order to put Xs in banned spaces, hence the check in the SYMBOL.NO_STAR part.
*/
SolverStarBattle.prototype.putNew = function(p_x, p_y, p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] == SYMBOL.UNDECIDED){
		this.answerArray[p_y][p_x] = p_symbol;
		var indexRegion = this.getRegion(p_x,p_y);
		if (p_symbol == SYMBOL.STAR){
			this.notPlacedYet.regions[indexRegion].Os--;
			this.notPlacedYet.rows[p_y].Os--;
			this.notPlacedYet.columns[p_x].Os--;
		}
		if (p_symbol == SYMBOL.NO_STAR){
			if (indexRegion >= 0){
				this.notPlacedYet.regions[indexRegion].Xs--;				
			}
			this.notPlacedYet.rows[p_y].Xs--;
			this.notPlacedYet.columns[p_x].Xs--;	
		}
		return EVENT_RESULT.SUCCESS;
	}
	if (this.answerArray[p_y][p_x] != p_symbol){
		autoLogDeduction("NOOOO !");
		return EVENT_RESULT.FAILURE;
	}
}

/**
When you want to remove a symbol from a space !
*/
undoEventClosure = function(p_solver) {
	return function(eventToUndo) {
		y = eventToUndo.y;
		x = eventToUndo.x;
		var indexRegion = p_solver.regionArray[y][x];
		var symbol = p_solver.answerArray[y][x];
		p_solver.answerArray[y][x] = SYMBOL.UNDECIDED;
		autoLogDeduction("Removing the following : "+x+" "+y+" "+symbol);
		if (symbol == SYMBOL.STAR){
			p_solver.notPlacedYet.regions[indexRegion].Os++;
			p_solver.notPlacedYet.rows[y].Os++;
			p_solver.notPlacedYet.columns[x].Os++;
		}
		if (symbol == SYMBOL.NO_STAR){
			p_solver.notPlacedYet.regions[indexRegion].Xs++;
			p_solver.notPlacedYet.rows[y].Xs++;
			p_solver.notPlacedYet.columns[x].Xs++;	
		}
	}
}

//--------------------------------

// Central method
SolverStarBattle.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	this.tryToApplyHypothesis(new SpaceEvent(p_symbol, p_x, p_y), this.methodsSetDeductions);
}

//--------------------------------

// Intelligence

/**
Tries to put a new symbol into a grid and then forces the filling of all stars and Xs that can be deduced logically without breaking the rules : 
-if a star is placed, all Xs around it
-if a star or an X is placed and it causes to have all the stars/Xs in that region/row/column deduced, fill this region/row/column with the missing symbols
-repeat until either new can be newly deduced (good, although this may be a wrong answer) or there is an absurd situation with two opposite symbols deduced in the same space (bad). 
If the end is successful, the list of spaces will be put into eventsApplied. But this doesn't mean they are all fine !
*/
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		x = p_eventBeingApplied.x;
		y = p_eventBeingApplied.y;
		symbol = p_eventBeingApplied.symbol;
		r = p_solver.getRegion(x,y); 
		if (symbol == SYMBOL.STAR) {
			//Add to all 7 neighbors (no one should be star if solved correctly)
			/*for(roundi = 0 ; roundi <= 7 ; roundi++) {
				spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR, x+ROUND_X_COORDINATES[roundi], y+ROUND_Y_COORDINATES[roundi]);
				p_listEventsToApply.push(spaceEventToAdd);
				autoLogDeduction("Event pushed : "+spaceEventToAdd.toString());
				
			}*/
			p_solver.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {
				spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR, coors.x, coors.y);
				p_listEventsToApply.push(spaceEventToAdd);
				autoLogDeduction("Event pushed : "+spaceEventToAdd.toString());
			});
			//Final alert on column : fill the missing spaces in the column 
			if (p_solver.notPlacedYet.columns[x].Os == 0) {
				for(yi = 0 ; yi < p_solver.xyLength ; yi++) {
					//there may be stars already, hence the (if SYMBOL.UNDECIDED) guard
					if (p_solver.answerArray[yi][x] == SYMBOL.UNDECIDED) {
						spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR, x, yi);
						p_listEventsToApply.push(spaceEventToAdd);
						autoLogDeduction("Event pushed : "+spaceEventToAdd.toString()); 
					}
				}
			}
			//Final alert on row
			if (p_solver.notPlacedYet.rows[y].Os == 0) {
				for(xi=0 ; xi < p_solver.xyLength ; xi++) {
					if (p_solver.answerArray[y][xi] == SYMBOL.UNDECIDED){
						spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR,xi,y);
						p_listEventsToApply.push(spaceEventToAdd);
						autoLogDeduction("Event pushed : "+spaceEventToAdd.toString());
					}
				}
			}
			//Final alert on region
			if (p_solver.notPlacedYet.regions[r].Os == 0){
				var spaceInRegion;
				for(var si=0;si< p_solver.spacesByRegion[r].length;si++){
					spaceInRegion = p_solver.spacesByRegion[r][si];
					if (p_solver.answerArray[spaceInRegion.y][spaceInRegion.x] == SYMBOL.UNDECIDED){
						spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR,spaceInRegion.x,spaceInRegion.y);
						p_listEventsToApply.push(spaceEventToAdd);
						autoLogDeduction("Event pushed : "+spaceEventToAdd.toString());
					}
				}
			}
		}
		if (symbol == SYMBOL.NO_STAR){
			//Final alert on column : fill the missing spaces in the column 
			if (p_solver.notPlacedYet.columns[x].Xs == 0){
				for(yi=0;yi<p_solver.xyLength;yi++){
					//there may be stars already, hence the (if SYMBOL.UNDECIDED) guard
					if (p_solver.answerArray[yi][x] == SYMBOL.UNDECIDED){
						spaceEventToAdd = new SpaceEvent(SYMBOL.STAR,x,yi);
						p_listEventsToApply.push(spaceEventToAdd);
						autoLogDeduction("Event pushed : "+spaceEventToAdd.toString());
					}
				}
			}
			//Final alert on row
			if (p_solver.notPlacedYet.rows[y].Xs == 0){
				for(xi=0;xi<p_solver.xyLength;xi++){
					if (p_solver.answerArray[y][xi] == SYMBOL.UNDECIDED){
						spaceEventToAdd = new SpaceEvent(SYMBOL.STAR,xi,y);
						p_listEventsToApply.push(spaceEventToAdd);
						autoLogDeduction("Event pushed : "+spaceEventToAdd.toString());
					}
				}
			}
			//Final alert on region
			if (p_solver.notPlacedYet.regions[r].Xs == 0){
				var spaceInRegion;
				for(var si=0;si< p_solver.spacesByRegion[r].length;si++){
					spaceInRegion = p_solver.spacesByRegion[r][si];
					if (p_solver.answerArray[spaceInRegion.y][spaceInRegion.x] == SYMBOL.UNDECIDED){
						spaceEventToAdd = new SpaceEvent(SYMBOL.STAR,spaceInRegion.x,spaceInRegion.y);
						p_listEventsToApply.push(spaceEventToAdd);
						autoLogDeduction("Event pushed : "+spaceEventToAdd.toString());
					}
				}
			}
		}
		return p_listEventsToApply;
	}
}

//------------------
//Passing

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexRegion) {
		return p_solver.generateEventsForRegionPass(p_indexRegion);
	}
}

generateEventsForRegionRowClosure = function(p_solver) {
	return function(p_y) {
		return p_solver.generateEventsForRowPass(p_y);
	}
}

generateEventsForRegionColumnClosure = function(p_solver) {
	return function(p_x) {
		return p_solver.generateEventsForColumnPass(p_x);
	}
}

generateEventsForRLCPassClosure = function(p_solver) {
	return function(p_indexAndFamily) {
		switch (p_indexAndFamily.family) {
			case STAR_BATTLE_CATEGORY.ROW : return p_solver.generateEventsForRowPass(p_indexAndFamily.index); break;
			case STAR_BATTLE_CATEGORY.COLUMN : return p_solver.generateEventsForColumnPass(p_indexAndFamily.index); break;
			case STAR_BATTLE_CATEGORY.REGION : return p_solver.generateEventsForRegionPass(p_indexAndFamily.index); break;
		}
		return [];
	}
}

SolverStarBattle.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var eventList = [];
	this.spacesByRegion[p_indexRegion].forEach(space => {
		if (this.answerArray[space.y][space.x] == SYMBOL.UNDECIDED) { 
			eventList.push([new SpaceEvent(SYMBOL.STAR, space.x, space.y), new SpaceEvent(SYMBOL.NO_STAR, space.x, space.y)]);
		}			 
	});
	return eventList;
}

SolverStarBattle.prototype.generateEventsForRowPass = function(p_y) {
	var eventList = [];
	for (var x = 0; x < this.xyLength ; x++) {
		if (this.answerArray[p_y][x] == SYMBOL.UNDECIDED) { 
			eventList.push([new SpaceEvent(SYMBOL.STAR, x, p_y), new SpaceEvent(SYMBOL.NO_STAR, x, p_y)]);
		}
	}
	return eventList;
}

SolverStarBattle.prototype.generateEventsForColumnPass = function(p_x) {
	var eventList = [];
	for (var y = 0; y < this.xyLength ; y++) {
		if (this.answerArray[y][p_x] == SYMBOL.UNDECIDED) { 
			eventList.push([new SpaceEvent(SYMBOL.STAR, p_x, y), new SpaceEvent(SYMBOL.NO_STAR, p_x, y)]);
		}
	}
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}

comparing = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol],
	[p_event2.y, p_event2.x, p_event2.symbol]]);
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var iafList = [];
		for (var i = 0; i < p_solver.spacesByRegion.length ; i++) {
			iafList.push({index : i, family : STAR_BATTLE_CATEGORY.REGION}); // , value : p_solver.notPlacedYet.regions[i]
		} 
		for (var i = 0; i < p_solver.xyLength ; i++) {
			iafList.push({index : i, family : STAR_BATTLE_CATEGORY.ROW}); //, value : p_solver.notPlacedYet.rows[i]
			iafList.push({index : i, family : STAR_BATTLE_CATEGORY.COLUMN}); //, value : p_solver.notPlacedYet.columns[i]
		}
		iafList.sort(function(p_iaf1, p_iaf2) {
			return p_solver.uncertainity(p_iaf1)-p_solver.uncertainity(p_iaf2); // TODO too lazy to improve it like it is on the other solvers. 
		});
		return iafList;
	}
}

SolverStarBattle.prototype.getNotPlacedYetSet = function(p_indexAndFamily) {
	switch (p_indexAndFamily.family) {
		case STAR_BATTLE_CATEGORY.ROW : return this.notPlacedYet.rows[p_indexAndFamily.index];
		case STAR_BATTLE_CATEGORY.COLUMN : return this.notPlacedYet.columns[p_indexAndFamily.index];
		case STAR_BATTLE_CATEGORY.REGION : return this.notPlacedYet.regions[p_indexAndFamily.index];
	}
}

SolverStarBattle.prototype.uncertainity = function(p_iaf) {
	return this.getNotPlacedYetSet(p_iaf).Xs - this.getNotPlacedYetSet(p_iaf).Os*2;
}

skipPassClosure = function(p_solver) {
	return function (p_iaf) {
		return p_solver.uncertainity(p_iaf) > 5; // Arbitrary value
	}
}

//--------------
// It's "to string" time !

function answerArrayToString(p_grid){
	for(yi=0;yi<p_grid.length;yi++){
		row = "";
		for(xi=0;xi<p_grid.length;xi++){
			row+=p_grid[yi][xi];
		}
		console.log(row);
	}
}