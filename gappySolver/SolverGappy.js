// ---------------------
// A few constants

const STAR = {
	YES : 2,
	NO : 1,
	UNDECIDED : 0	
}

const stringStarArray = ['-', 'N', 'Y'];
function stringStar(p_star) {
	return stringStarArray[p_star];
}

const GAPPY_PASS_CATEGORY = {
	ROW : 1,
	COLUMN : 2
};

// ---------------------
// Setup

function SolverGappy(p_marginLeft, p_marginUp) {
	GeneralSolver.call(this);
	this.construct(p_marginLeft, p_marginUp);
}

SolverGappy.prototype = Object.create(GeneralSolver.prototype);
SolverGappy.prototype.constructor = SolverGappy;

function DummySolver() {
	return new SolverGappy([null], [null]);
}

SolverGappy.prototype.construct = function(p_marginLeft, p_marginUp) { 
	this.generalConstruct();
	this.answerArray = [];
	this.happenedEventsSeries = [];	
	this.xyLength = p_marginLeft.length; 
	this.xLength = this.xyLength; // Mandatory for some puzzles
	this.yLength = this.xyLength;
	this.numbersMarginsLeft = p_marginLeft;
	this.numbersMarginsUp = p_marginUp;
	this.notPlacedYetRows = [];
	this.notPlacedYetColumns = [];
	for (var i = 0; i < this.xyLength ; i++) {
		this.notPlacedYetRows.push({Xs : this.xyLength-2, Os : 2});
		this.notPlacedYetColumns.push({Xs : this.xyLength-2, Os : 2});
	}
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetPass = {comparisonMethod : comparing, copyMethod : copying,  argumentToLabelMethod : namingCategoryPassClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRCPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	
	this.answerArray = generateValueArray(this.xyLength, this.xyLength, STAR.UNDECIDED);
}

//----------------------
// Misc methods (may be used for drawing and intelligence)

SolverGappy.prototype.getAnswer = function(p_x, p_y){return this.answerArray[p_y][p_x];}

//------------------
// Input methods 

SolverGappy.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverGappy.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverGappy.prototype.emitPassRow = function(p_y) {
	const listPassNow = this.generateEventsForRowPass(p_y);
	this.passEventsSafe(listPassNow, {category : GAPPY_PASS_CATEGORY.ROW, index : p_y}); 
}

SolverGappy.prototype.emitPassColumn = function(p_x) {
	const listPassNow = this.generateEventsForColumnPass(p_x);
	this.passEventsSafe(listPassNow, {category : GAPPY_PASS_CATEGORY.COLUMN, index : p_x}); 
}

SolverGappy.prototype.makeMultiPass = function() {	
	this.multiPassSafe(this.methodsSetMultipass);
}

SolverGappy.prototype.makeQuickStart = function() { 
	this.quickStart();
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_indexPass) {
		const index = p_indexPass.index;
		switch (p_indexPass.category) {
			case GAPPY_PASS_CATEGORY.ROW : return "Row " + index; break;
			case GAPPY_PASS_CATEGORY.COLUMN : return "Column " + index; break;
			default : return "";
		}
	}
}

//------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		return p_solver.putNew(p_eventToApply.x, p_eventToApply.y, p_eventToApply.symbol);
	}
}

/**Tries to put a symbol into the space of a grid. 3 possibilities :
EVENT_RESULT.SUCCESS : it was indeed put into the grid ; the number of Os and Xs for this region, row and column are also updated.
EVENT_RESULT.HARMLESS : said symbol was either already put into that space OUT out of bounds beacuse of automatic operation. Don't change anything to the grid and remaining symbols
EVENT_RESULT.ERROR : there is a different symbol in that space. We have done a wrong hypothesis somewhere ! (or the grid was wrong at the basis !)
This is also used at grid start in order to put Xs in banned spaces, hence the check in the STAR.NO part.
*/
SolverGappy.prototype.putNew = function(p_x, p_y, p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != STAR.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;
	// A few deductions...
	if (p_symbol == STAR.YES) {
		this.notPlacedYetRows[p_y].Os--;
		this.notPlacedYetColumns[p_x].Os--;
	} else {
		this.notPlacedYetRows[p_y].Xs--;
		this.notPlacedYetColumns[p_x].Xs--;
	}
	return EVENT_RESULT.SUCCESS;
}

/**
When you want to remove a symbol from a space !
*/
undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		y = p_eventToUndo.y;
		x = p_eventToUndo.x;
		var symbol = p_solver.answerArray[y][x];
		p_solver.answerArray[y][x] = STAR.UNDECIDED;
		if (symbol == STAR.YES) {
			p_solver.notPlacedYetRows[y].Os++;
			p_solver.notPlacedYetColumns[x].Os++;
		} else {
			p_solver.notPlacedYetRows[y].Xs++;
			p_solver.notPlacedYetColumns[x].Xs++;
		}
	}
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		return [{quickStartLabel : "Directly go through multipass ;)"}];
	}
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

closureSpace = function(p_solver) { return function(p_x, p_y) {return p_solver.answerArray[p_y][p_x]}}
closureEvent = function(p_state) { return function(p_x, p_y) {return new SpaceEvent(p_x, p_y, p_state)}}

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		x = p_eventBeingApplied.x;
		y = p_eventBeingApplied.y;
		symbol = p_eventBeingApplied.symbol;
		var gap, newXY, symetricXY;
		if (symbol == STAR.YES) {
			//Add to all 7 neighbors (no one should be star if solved correctly)
			p_solver.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {
				spaceEventToAdd = new SpaceEvent(coors.x, coors.y, STAR.NO);
				p_listEventsToApply.push(spaceEventToAdd);
			});
			if (p_solver.notPlacedYetColumns[x].Os == 0) {				
				p_solver.deductionsFillingColumn(p_listEventsToApply, x, closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.NO));
			}
			if (p_solver.notPlacedYetRows[y].Os == 0) {				
				p_solver.deductionsFillingRow(p_listEventsToApply, y, closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.NO));
			}
			gap = p_solver.numbersMarginsLeft[y];
			if (gap != null) {				
				for (var xx = 0 ; xx < p_solver.xyLength ; xx++) {
					if ((x != xx) && Math.abs(xx - x) - 1 != gap) {
						p_listEventsToApply.push(new SpaceEvent(xx, y, STAR.NO));
					}
				}
			}
			gap = p_solver.numbersMarginsUp[x];
			if (gap != null) {				
				for (var yy = 0 ; yy < p_solver.xyLength ; yy++) {
					if ((y != yy) && Math.abs(yy - y) - 1 != gap) {
						p_listEventsToApply.push(new SpaceEvent(x, yy, STAR.NO));
					}
				}
			}
		}
		if (symbol == STAR.NO) {
			if (p_solver.notPlacedYetColumns[x].Xs == 0) {				
				p_solver.deductionsFillingColumn(p_listEventsToApply, x, closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.YES));
			}
			if (p_solver.notPlacedYetRows[y].Xs == 0) {				
				p_solver.deductionsFillingRow(p_listEventsToApply, y, closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.YES));
			}
			// -smart deductions- X newly added : some stars in corresponding rows and columns cannot make a pair anymore
			gap = p_solver.numbersMarginsLeft[y];
			if (gap != null) {
				newXY = x - (gap + 1);
				if (newXY >= 0) {
					symetricXY = x - (gap + 1) * 2;
					if (symetricXY < 0 || p_solver.answerArray[y][symetricXY] == STAR.NO) {
						p_listEventsToApply.push(new SpaceEvent(newXY, y, STAR.NO));
					}
				}
				newXY = x + gap + 1;
				if (newXY < p_solver.xyLength) {
					symetricXY = x + (gap + 1) * 2;
					if (symetricXY >= p_solver.xyLength || p_solver.answerArray[y][symetricXY] == STAR.NO) {
						p_listEventsToApply.push(new SpaceEvent(newXY, y, STAR.NO));
					}
				}
			}
			gap = p_solver.numbersMarginsUp[x];
			if (gap != null) {				
				newXY = y - (gap + 1);
				if (newXY >= 0) {
					symetricXY = y - (gap + 1) * 2;
					if (symetricXY < 0 || p_solver.answerArray[symetricXY][x] == STAR.NO) {
						p_listEventsToApply.push(new SpaceEvent(x, newXY, STAR.NO));
					}
				}
				newXY = y + gap + 1;
				if (newXY < p_solver.xyLength) {
					symetricXY = y + (gap + 1) * 2;
					if (symetricXY >= p_solver.xyLength || p_solver.answerArray[symetricXY][x] == STAR.NO) {
						p_listEventsToApply.push(new SpaceEvent(x, newXY, STAR.NO));
					}
				}
			}
		}
	}
}

function closureSpace(p_solver) {
	return function(p_x, p_y) {
		return p_solver.answerArray[p_y][p_x];
	}
}

function closureEvent(p_symbol) {
	return function(p_x, p_y) {
		return new SpaceEvent(p_x, p_y, p_symbol);
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

generateEventsForRCPassClosure = function(p_solver) {
	return function(p_indexPass) {
		switch (p_indexPass.category) {
			case GAPPY_PASS_CATEGORY.COLUMN : return p_solver.generateEventsForColumnPass(p_indexPass.index); break;
			case GAPPY_PASS_CATEGORY.REGION : return p_solver.generateEventsForRegionPass(p_indexPass.index); break;
		}
		return [];
	}
}

SolverGappy.prototype.generateEventsForRowPass = function(p_y) {
	var eventList = [];
	for (var x = 0; x < this.xyLength ; x++) {
		if (this.answerArray[p_y][x] == STAR.UNDECIDED) { 
			eventList.push([new SpaceEvent(x, p_y, STAR.YES), new SpaceEvent(x, p_y, STAR.NO)]);
		}
	}
	return eventList;
}

SolverGappy.prototype.generateEventsForColumnPass = function(p_x) {
	var eventList = [];
	for (var y = 0; y < this.xyLength ; y++) {
		if (this.answerArray[y][p_x] == STAR.UNDECIDED) { 
			eventList.push([new SpaceEvent(p_x, y, STAR.YES), new SpaceEvent(p_x, y, STAR.NO)]);
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
		var listIndexesPass = [];
		for (var i = 0; i < p_solver.xyLength ; i++) {
			listIndexesPass.push({index : i, category : GAPPY_PASS_CATEGORY.ROW}); //, value : p_solver.notPlacedYet.rows[i]
			listIndexesPass.push({index : i, category : GAPPY_PASS_CATEGORY.COLUMN}); //, value : p_solver.notPlacedYet.columns[i]
		}
		listIndexesPass.sort(function(p_iaf1, p_iaf2) {
			return p_solver.uncertainity(p_iaf1)-p_solver.uncertainity(p_iaf2); // TODO too lazy to improve it like it is on the other solvers. 
		});
		return listIndexesPass;
	}
}

SolverGappy.prototype.getNotPlacedYetSet = function(p_indexPass) {
	switch (p_indexPass.category) {
		case GAPPY_PASS_CATEGORY.COLUMN : return this.notPlacedYetColumns[p_indexPass.index];
		case GAPPY_PASS_CATEGORY.ROW : return this.notPlacedYetRows[p_indexPass.index];
	}
}

SolverGappy.prototype.uncertainity = function(p_iaf) {
	return this.getNotPlacedYetSet(p_iaf).Xs - this.getNotPlacedYetSet(p_iaf).Os*2;
}

skipPassClosure = function(p_solver) {
	return function (p_iaf) {
		return p_solver.uncertainity(p_iaf) > 5; // Arbitrary value
	}
}

//--------------
// It's "to string" time !

function answerArrayToString(p_array) {
	for(yi=0 ; yi < p_array.length ; yi++) {
		row = "";
		for(xi=0 ; xi< p_array.length ; xi++) {
			row += p_array[yi][xi];
		}
		console.log(row);
	}
}