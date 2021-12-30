// Initialization

function SolverYajikabe(p_combinationArray) {
	GeneralSolver.call(this);
	this.construct(p_combinationArray);
}

SolverYajikabe.prototype = Object.create(GeneralSolver.prototype);
SolverYajikabe.prototype.constructor = SolverYajikabe;

function DummySolver() {
	return new SolverYajikabe(generateSymbolArray(1, 1));
}

SolverYajikabe.prototype.construct = function(p_combinationArray) {
	this.generalConstruct();
	this.xLength = p_combinationArray[0].length;
	this.yLength = p_combinationArray.length;
	this.makeItGeographical(this.xLength, this.yLength, new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	));
	this.methodsSetPass = {
		comparisonMethod : comparison,
		copyMethod : copying,
		argumentToLabelMethod : namingCategoryClosure(this)
		};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForStripesAndUnionsClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this),
		searchSolutionMethod : searchClosure(this)
	}

	this.answerArray = [];
	this.clueGrid = Grid_data(p_combinationArray);
	var ix,iy;

	this.stripesArray = []; // Space with a clue ? Contains number of the clue. Otherwise, contains index of the clue. (Offensive programming : checks must have been already made !)
	this.cluesSpacesList = [];
	this.unionsStripesList = []; // TODO better names ?

	// Initialize answerArray purified
	for(iy = 0;iy < this.yLength ; iy++) {
		this.answerArray.push([]);
		for(ix = 0;ix < this.xLength ; ix++) {
			if (this.clueGrid.get(ix, iy) != null) {
				this.answerArray[iy].push(ADJACENCY.NO);
			} else {
				this.answerArray[iy].push(ADJACENCY.UNDECIDED);
			}
		}
	}
	
	// Initialize clues (could have been done above but I decided to separate everythin') 
	for(iy = 0;iy < this.yLength ; iy++) {
		this.stripesArray.push([]);
		for(ix = 0;ix < this.xLength ; ix++) {
			if (this.isBanned(ix, iy)) {
				if (this.isNumeric(ix, iy)) {
					this.stripesArray[iy].push(this.cluesSpacesList.length);
					this.cluesSpacesList.push({
						x : ix, 
						y : iy, 
						direction : this.getDirection(ix, iy),
						notPlacedOpensYet : -1,
						notPlacedClosedsYet : -1,
						union : null
					});
				} else {
					this.stripesArray[iy].push(null);
				}
			} else {
				this.stripesArray[iy].push([]);
			}
		}
	}
	
	// Calculate not...yet variables
	var finalCoor, numberEmptySpaces, x, y, xx, yy, openSpacesInStrip;
	for (var i = 0; i < this.cluesSpacesList.length ; i++) {
		x = this.cluesSpacesList[i].x;
		y = this.cluesSpacesList[i].y;
		dir = this.cluesSpacesList[i].direction;
		numberEmptySpaces = 0;
		if ((dir == DIRECTION.LEFT) || (dir == DIRECTION.RIGHT)) {
			xx = x + DeltaX[dir];
			finalCoor = xx;
			while (this.testExistingCoordinate(xx, dir) && (!this.isNumeric(xx, y) || (this.getDirection(xx, y) != dir) )) {
				if (!this.isBanned(xx, y)) {
					this.stripesArray[y][xx].push(i);
					numberEmptySpaces++;
					finalCoor = xx;
				}
				// Union of two opposite stripes
				if (this.cluesSpacesList[i].union == null && this.isNumeric(xx, y) && (this.getDirection(xx, y) == OppositeDirection[dir]) && !this.isBanned(finalCoor, y)) {
					this.cluesSpacesList[i].union = this.stripesArray[y][xx]; 
				}
				xx += DeltaX[dir];
			}
			if (this.testExistingCoordinate(xx, dir) && this.isNumeric(xx, y)) { // Premature end of strip
				openSpacesInStrip = this.getNumber(x, y) - this.getNumber(xx, y);
			} else {
				openSpacesInStrip = this.getNumber(x, y);
			}
			this.cluesSpacesList[i].xMin = Math.min(x + DeltaX[dir], finalCoor);
			this.cluesSpacesList[i].xMax = Math.max(x + DeltaX[dir], finalCoor);
			this.cluesSpacesList[i].notPlacedOpensYet = openSpacesInStrip;
			this.cluesSpacesList[i].notPlacedClosedsYet = numberEmptySpaces - openSpacesInStrip;
			
		} else {
			yy = y + DeltaY[dir];
			finalCoor = yy;
			while (this.testExistingCoordinate(yy, dir) && (!this.isNumeric(x, yy) || (this.getDirection(x, yy) != dir) )) {
				if (!this.isBanned(x, yy)) {
					this.stripesArray[yy][x].push(i);
					numberEmptySpaces++;
					finalCoor = yy;
				} 
				if (this.cluesSpacesList[i].union == null && this.isNumeric(x, yy) && (this.getDirection(x, yy) == OppositeDirection[dir]) && !this.isBanned(x, finalCoor)) {
					this.cluesSpacesList[i].union = this.stripesArray[yy][x];
				}
				yy += DeltaY[dir];
			}
			if (this.testExistingCoordinate(yy, dir) && this.isNumeric(x, yy)) { // Premature end of strip
				openSpacesInStrip = this.getNumber(x, y) - this.getNumber(x, yy);
			} else {
				openSpacesInStrip = this.getNumber(x, y);
			}
			this.cluesSpacesList[i].yMin = Math.min(y + DeltaY[dir], finalCoor);
			this.cluesSpacesList[i].yMax = Math.max(y + DeltaY[dir], finalCoor);
			this.cluesSpacesList[i].notPlacedOpensYet = openSpacesInStrip;
			this.cluesSpacesList[i].notPlacedClosedsYet = numberEmptySpaces - openSpacesInStrip;
		}
	}
	
	var ui, otherClue;
	// Now let's solve unions. Since they are mirrored, we will only do those coming from left or from up.
	for (var i = 0; i < this.cluesSpacesList.length ; i++) {
		clue = this.cluesSpacesList[i];
		ui = clue.union;
		if (ui != null) {
			if (clue.direction == DIRECTION.RIGHT) {
				otherClue = this.cluesSpacesList[ui];
				this.cluesSpacesList[i].union = this.unionsStripesList.length;
				this.cluesSpacesList[ui].union = this.unionsStripesList.length;
				this.unionsStripesList.push({
					orientation : ORIENTATION.HORIZONTAL, 
					y : clue.y, 
					xMin : Math.min(clue.xMin, otherClue.xMin), 
					xMax : Math.max(clue.xMax, otherClue.xMax)
				});
			}
			else if (clue.direction == DIRECTION.DOWN) {
				otherClue = this.cluesSpacesList[ui];
				this.cluesSpacesList[i].union = this.unionsStripesList.length;
				this.cluesSpacesList[ui].union = this.unionsStripesList.length;
				this.unionsStripesList.push({
					orientation : ORIENTATION.VERTICAL, 
					x : clue.x, 
					yMin : Math.min(clue.yMin, otherClue.yMin), 
					yMax : Math.max(clue.yMax, otherClue.yMax)
				});
			}
		}
	}
	this.declarationsOpenAndClosed();
}

//--------------------------------

// Misc. methods
SolverYajikabe.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverYajikabe.prototype.isBanned = function(p_x, p_y) {
	return this.clueGrid.get(p_x, p_y) != null;
}

SolverYajikabe.prototype.isNumeric = function(p_x, p_y) {
	const num = this.clueGrid.get(p_x, p_y);
	return (num != null && num.charAt(0) != "X");
}

SolverYajikabe.prototype.makeResolution = function() { 
	this.resolve();
}

// -------------------------------

// Warning : values in hard. Duplicated in Yajilin.

//Offensive !
SolverYajikabe.prototype.getDirection = function(p_x, p_y) { 
	switch (this.clueGrid.get(p_x, p_y).charAt(0)) {
		case 'L' : return DIRECTION.LEFT; break;
		case 'U' : return DIRECTION.UP; break;
		case 'R' : return DIRECTION.RIGHT; break;
		case 'D' : return DIRECTION.DOWN; break;
		default : return null;
	}
}

SolverYajikabe.prototype.getNumber = function(p_x, p_y) {
	return parseInt(this.clueGrid.get(p_x, p_y).substring(1), 10);
}

//--------------------------------

// Input methods
SolverYajikabe.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	if (!this.isBanned(p_x, p_y)) {
		this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
	}
}

SolverYajikabe.prototype.undo = function() {
	if (this.automaticMode) {	
		this.undoToLastHypothesis(undoEventClosure(this));
	} else {
		this.undoManual(undoEventClosure(this));		
	}
}

SolverYajikabe.prototype.makeQuickStart = function() {
	this.quickStart();
}

SolverYajikabe.prototype.passStripFromSpace = function(p_x, p_y) {
	if (this.isNumeric(p_x, p_y)) {
		const index = this.stripesArray[p_y][p_x];
		const unionIndex = this.cluesSpacesList[index].union;
		var generatedEvents;
		if (unionIndex != null) {
			generatedEvents = this.generateEventsForUnionStripPass(unionIndex);
			this.passEvents(generatedEvents, {category : YAJIKABE_CATEGORY.UNION, index : unionIndex}); 
		} else {
			generatedEvents = this.generateEventsForSingleStripPass(index);
			this.passEvents(generatedEvents, {category : YAJIKABE_CATEGORY.STRIP, index : index}); 
		}
	}
}

SolverYajikabe.prototype.makeMultiPass = function() {	
	this.multiPass(this.methodsSetMultipass);
}

//--------------------------------

// Doing, undoing and transforming

// Offensive programming : the coordinates are assumed to be in limits
SolverYajikabe.prototype.putNew = function(p_x,p_y,p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;	
	if (p_symbol == ADJACENCY.YES) {
		this.stripesArray[p_y][p_x].forEach(index => {
			this.cluesSpacesList[index].notPlacedOpensYet--;
		})
	} else {
		this.stripesArray[p_y][p_x].forEach(index => {
			this.cluesSpacesList[index].notPlacedClosedsYet--;
		})
	}
	return EVENT_RESULT.SUCCESS;
}


applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		return p_solver.putNew(eventToApply.x, eventToApply.y, eventToApply.symbol);
	}
}

undoEventClosure = function(p_solver) {
	return function(eventToApply) {
		const x = eventToApply.x;
		const y = eventToApply.y;
		const symbol = eventToApply.symbol;
		if (symbol == ADJACENCY.YES) {
			p_solver.stripesArray[y][x].forEach(index => {
				p_solver.cluesSpacesList[index].notPlacedOpensYet++;
			})
		} else {
			p_solver.stripesArray[y][x].forEach(index => {
				p_solver.cluesSpacesList[index].notPlacedClosedsYet++;
			})
		}
		p_solver.answerArray[y][x] = ADJACENCY.UNDECIDED;
	}
}

//--------------------------------
// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SpaceEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, p_geographicalDeduction.opening);
    }
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
        return p_solver.answerArray[p_y][p_x];
    }
}

//-------------------------------- 
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Yajikabe"}];
		p_solver.cluesSpacesList.forEach(clue => {
			if (clue.notPlacedClosedsYet == 0) {
				listQSEvts = p_solver.fillWithBlanks(listQSEvts, clue, ADJACENCY.YES);
			}
			if (clue.notPlacedOpensYet == 0) {
				listQSEvts = p_solver.fillWithBlanks(listQSEvts, clue, ADJACENCY.NO);
			}
		});
		return listQSEvts;
	}
}

//--------------------------------
// Intelligence

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const symbol = p_eventBeingApplied.symbol;
		if (symbol == ADJACENCY.YES) {
			p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, p_solver.methodsSetDeductions, x, y); 
			p_solver.stripesArray[y][x].forEach(index => { //Alert on strip
				const clue = p_solver.cluesSpacesList[index];
				if (clue.notPlacedOpensYet == 0) {
					p_listEventsToApply = p_solver.fillWithBlanks(p_listEventsToApply, clue, ADJACENCY.NO);
				}
			});
		} else {
			p_solver.stripesArray[y][x].forEach(index => { //Alert on strip
				const clue = p_solver.cluesSpacesList[index];
				if (clue.notPlacedClosedsYet == 0) {
					p_listEventsToApply = p_solver.fillWithBlanks(p_listEventsToApply, clue, ADJACENCY.YES);
				}
			});
		}
		return p_listEventsToApply;
	}
}

SolverYajikabe.prototype.fillWithBlanks = function(p_listEventsToApply, p_clue, p_spaceToFill) {
	if ((p_clue.direction == DIRECTION.LEFT) || (p_clue.direction == DIRECTION.RIGHT)) {
		const y = p_clue.y;
		for (var x = p_clue.xMin ; x <= p_clue.xMax ; x++) {
			if (!this.isBanned(x, y) && (this.answerArray[y][x] == ADJACENCY.UNDECIDED)) {
				p_listEventsToApply.push(new SpaceEvent(x, y, p_spaceToFill));
			}
		}
	} else {
		const x = p_clue.x;
		for (var y = p_clue.yMin ; y <= p_clue.yMax ; y++) {
			if (!this.isBanned(x, y) && (this.answerArray[y][x] == ADJACENCY.UNDECIDED)) {
				p_listEventsToApply.push(new SpaceEvent(x, y, p_spaceToFill));
			}
		}
	}
	
	return p_listEventsToApply;
}

// --------------------
// Passing

// Index strip must match the index of a strip WITHOUT UNION !
SolverYajikabe.prototype.generateEventsForSingleStripPass = function(p_indexStrip) {
	const clue = this.cluesSpacesList[p_indexStrip];
	var eventList = [];
	if ((clue.direction == DIRECTION.LEFT) || (clue.direction == DIRECTION.RIGHT)) {
		const y = clue.y;
		for (var x = clue.xMin ; x <= clue.xMax ; x++) {
			if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
				eventList.push([new SpaceEvent(x, y, ADJACENCY.YES), new SpaceEvent(x, y, ADJACENCY.NO)]);		
			}
		}
	} else {
		const x = clue.x;
		for (var y = clue.yMin ; y <= clue.yMax ; y++) {
			if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
				eventList.push([new SpaceEvent(x, y, ADJACENCY.YES), new SpaceEvent(x, y, ADJACENCY.NO)]);		
			}
		}
	}
	return eventList;
}

SolverYajikabe.prototype.generateEventsForUnionStripPass = function(p_indexUnion) {
	const clue = this.unionsStripesList[p_indexUnion];
	var eventList = [];
	if ((clue.orientation == ORIENTATION.HORIZONTAL)) {
		const y = clue.y;
		for (var x = clue.xMin ; x <= clue.xMax ; x++) {
			if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
				eventList.push([new SpaceEvent(x, y, ADJACENCY.YES), new SpaceEvent(x, y, ADJACENCY.NO)]);		
			}
		}
	} else {
		const x = clue.x;
		for (var y = clue.yMin ; y <= clue.yMax ; y++) {
			if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
				eventList.push([new SpaceEvent(x, y, ADJACENCY.YES), new SpaceEvent(x, y, ADJACENCY.NO)]);		
			}
		}
	}
	return eventList;
}


copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol],
		[p_event2.y, p_event2.x, p_event2.symbol]]);
}

// -----
// Multipass

generateEventsForStripesAndUnionsClosure = function (p_solver) {
	return function (p_indexFamily) {
		if (p_indexFamily.category == YAJIKABE_CATEGORY.STRIP) {
			return p_solver.generateEventsForSingleStripPass(p_indexFamily.index);
		} else {
			return  p_solver.generateEventsForUnionStripPass(p_indexFamily.index); 
		}
	}
}

const YAJIKABE_CATEGORY = {
	UNION : 0,
	STRIP : 1
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		for (var i = 0 ; i < p_solver.cluesSpacesList.length ; i++) {
			if (p_solver.cluesSpacesList[i].union == null) {
				indexList.push({category : YAJIKABE_CATEGORY.STRIP, index : i}); // TODO possibility of adding more details for incertainity
			} 
		}
		for (var i = 0 ; i < p_solver.unionsStripesList.length ; i++) {
			indexList.push({category : YAJIKABE_CATEGORY.UNION, index : i});
		}
		return indexList;
	}
}

namingCategoryClosure = function(p_solver) {
	return function(p_passIndex) {
		if (p_passIndex.passCategory == YAJIKABE_CATEGORY.UNION) {
			const uni = p_solver.unionsStripesList[p_passIndex.index];
			if (uni.orientation == ORIENTATION.VERTICAL) {
				return "(Stripes V " + uni.x + "," + uni.yMin + "-" + uni.yMax +")";
			} else {
				return "(Stripes H " + uni.xMin + "-" + uni.xMax + "," + uni.y +")";
			}
		} else {
			const str = p_solver.cluesSpacesList[p_passIndex.index];
			if (str.direction == DIRECTION.UP || str.direction == DIRECTION.DOWN) {
				return "(Strip V " + str.x + "," + str.yMin + "-" + str.yMax +")";
			} else {
				return "(Strip H " + str.xMin + "-" + str.xMax + "," + str.y +")";
			}
		}
	}
}

// --------------------
// Resolution

SolverYajikabe.prototype.isSolved = function() {
	// Quick check
	for (var i = 0 ; i < this.cluesSpacesList.length ; i++) {
		if (this.cluesSpacesList[i].notPlacedClosedsYet != 0) {
			return false;
		}
	};
	// Complete check
	for (var y = 0 ; y < this.yLength ; y++) { 
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.answerArray[y][x] == ADJACENCY.UNDECIDED) {
				return false;
			}
		}
	}	
	return true;
}

function searchClosure(p_solver) {
	return function() {
		var mp = p_solver.multiPass(p_solver.methodsSetMultipass);
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (p_solver.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}		
		
		// Find index with the most solutions
		var bestIndex = {nbD : -1};
		var nbDeductions;
		var event_;
		var solveResultEvt;
		for (solveX = 0 ; solveX < p_solver.xLength ; solveX++) { // x and y are somehow modified by tryToApplyHypothesis...
			for (solveY = 0 ; solveY < p_solver.yLength ; solveY++) {
				if (p_solver.answerArray[solveY][solveX] == ADJACENCY.UNDECIDED) {
					[ADJACENCY.YES, ADJACENCY.NO].forEach(value => {
						event_ = new SpaceEvent(solveX, solveY, value);
						solveResultEvt = p_solver.tryToApplyHypothesis(event_); 
						if (solveResultEvt == DEDUCTIONS_RESULT.SUCCESS) {
							nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
							if (bestIndex.nbD < nbDeductions) {
								bestIndex = {nbD : nbDeductions , evt : event_.copy()}
							}
							p_solver.undoToLastHypothesis();
						}
					});	
				}
			}
		}
		
		// Naive recursion !
		return p_solver.tryAllPossibilities([bestIndex.evt, new SpaceEvent(bestIndex.evt.x, bestIndex.evt.y, ADJACENCY.YES),
		bestIndex.evt, new SpaceEvent(bestIndex.evt.x, bestIndex.evt.y, ADJACENCY.NO)]);
	}
}