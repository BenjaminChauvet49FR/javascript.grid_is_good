// Initialization
// const SPACE is used in the main solver

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
	this.makeItGeographical(this.xLength, this.yLength);
	this.methodSet = new ApplyEventMethodGeographicalPack(
			applyEventClosure(this), 
			deductionsClosure(this), 
			adjacencyClosure(this), 
			transformClosure(this), 
			undoEventClosure(this));
	this.methodTools = {
		comparisonMethod : comparison,
		copyMethod : copying
		//argumentToLabelMethod : namingCategoryClosure(this)
		};
	this.methodsMultiPass = {
		generatePassEventsMethod : generateEventsForStripesAndUnionsClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};

	this.answerArray = [];
	this.clueGrid = Grid_data(p_combinationArray);
	var ix,iy;

	this.stripesArray = []; // Space with a clue ? Contains number of the clue. Otherwise, contains index of the clue. (Offensive programming : checks must have been already made !)
	this.cluesSpacesList = [];
	this.unionsStripesList = []; // TODO better names ?

	// Initialize answerArray purified + geographical purification through "addBannedSpace"
	for(iy = 0;iy < this.yLength ; iy++) {
		this.answerArray.push([]);
		for(ix = 0;ix < this.xLength ; ix++) {
			if (this.clueGrid.get(ix, iy) != null) {
				this.addBannedSpace(ix, iy);
				this.answerArray[iy].push(SPACE.CLOSED);
			} else {
				this.answerArray[iy].push(SPACE.UNDECIDED);
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
	
	var finalCoor, numberEmptySpaces, x, y, xx, yy, openSpacesInStrip;
	for (var i = 0; i < this.cluesSpacesList.length ; i++) {
		x = this.cluesSpacesList[i].x;
		y = this.cluesSpacesList[i].y;
		dir = this.cluesSpacesList[i].direction;
		numberEmptySpaces = 0;
		if ((dir == DIRECTION.LEFT) || (dir == DIRECTION.RIGHT)) {
			xx = x + DeltaX[dir];
			finalCoor = xx;
			while (testExistingCoordinate(xx, dir, this.xLength, this.yLength) && (!this.isNumeric(xx, y) || (this.getDirection(xx, y) != dir) )) {
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
			if (testExistingCoordinate(xx, dir, this.xLength, this.yLength) && this.isNumeric(xx, y)) { // Premature end of strip
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
			while (testExistingCoordinate(yy, dir, this.xLength, this.yLength) && (!this.isNumeric(x, yy) || (this.getDirection(x, yy) != dir) )) {
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
			if (testExistingCoordinate(yy, dir, this.xLength, this.yLength) && this.isNumeric(x, yy)) { // Premature end of strip
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

//--------------------------------
// Misc. inner methods 

function testExistingCoordinate(coor, dir, xMax, yMax) {
	switch (dir) {
		case DIRECTION.LEFT : 
		case DIRECTION.UP : return coor >= 0; break;
		case DIRECTION.RIGHT : return coor < xMax; break;
		case DIRECTION.DOWN : return coor < yMax; break;
	}
}

// -------------------------------

// Warning : values in hard. Part was copy-colled on Yajilin.

//Offensive !
SolverYajikabe.prototype.getDirection = function(p_x, p_y) { 
	return getDirectionString(this.clueGrid.get(p_x, p_y));
}

SolverYajikabe.prototype.getNumber = function(p_x, p_y) {
	return getNumberString(this.clueGrid.get(p_x, p_y));
}

function getDirectionString(p_valueString) {
	switch (p_valueString.charAt(0)) {
		case 'L' : return DIRECTION.LEFT; break;
		case 'U' : return DIRECTION.UP; break;
		case 'R' : return DIRECTION.RIGHT; break;
		case 'D' : return DIRECTION.DOWN; break;
		default : return null;
	}
}

function getNumberString(p_valueString) {
	return parseInt(p_valueString.substring(1),10);
}

//--------------------------------

// Input methods
SolverYajikabe.prototype.emitHypothesis = function(p_x, p_y, p_symbol){
	this.tryToPutNew(p_x, p_y, p_symbol);
}

SolverYajikabe.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverYajikabe.prototype.quickStart = function() {
	this.initiateQuickStart();
	var eventList = [];
	this.cluesSpacesList.forEach(clue => {
		if (clue.notPlacedClosedsYet == 0) {
			eventList = this.fillWithBlanks(eventList, clue, SPACE.OPEN);
		}
		if (clue.notPlacedOpensYet == 0) {
			eventList = this.fillWithBlanks(eventList, clue, SPACE.CLOSED);
		}
	});
	eventList.forEach(event_ => {
		this.tryToPutNew(event_.coorX, event_.coorY, event_.symbol);
	});
	this.terminateQuickStart();
}

SolverYajikabe.prototype.passStripFromSpace = function(p_x, p_y) {
	if (this.isNumeric(p_x, p_y)) {
		const index = this.stripesArray[p_y][p_x];
		const unionIndex = this.cluesSpacesList[index].union;
		var generatedEvents;
		if (unionIndex != null) {
			generatedEvents = this.generateEventsForUnionStripPass(unionIndex);
		} else {
			generatedEvents = this.generateEventsForSingleStripPass(index);
		}
		this.passEvents(generatedEvents, this.methodSet, this.methodTools, p_x + "," + p_y + "," + this.cluesSpacesList[index].direction); 
	}
}

SolverYajikabe.prototype.makeMultiPass = function() {	
	this.multiPass(this.methodSet, this.methodTools, this.methodsMultiPass);
}

//--------------------------------

// Central method

SolverYajikabe.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	// If we directly passed methods and not closures, we would be stuck because "this" would refer to the Window object which of course doesn't define the properties we want, e.g. the properties of the solvers.
	// All the methods pass the solver as a parameter because they can't be prototyped by it (problem of "undefined" things). 
	this.tryToApplyHypothesis(
		SpaceEvent(p_x, p_y, p_symbol),
		this.methodSet
	);
}

//--------------------------------

// Doing, undoing and transforming

// Offensive programming : the coordinates are assumed to be in limits
SolverYajikabe.prototype.putNew = function(p_x,p_y,p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] != SPACE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	this.answerArray[p_y][p_x] = p_symbol;	
	if (p_symbol == SPACE.OPEN) {
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
		return p_solver.putNew(eventToApply.x(), eventToApply.y(), eventToApply.symbol);
	}
}

undoEventClosure = function(p_solver) {
	return function(eventToApply) {
		const x = eventToApply.x(); //Décidément il y en a eu à faire, des changements de x en x() depuis qu'on a mis en commun les solvers de puzzles d'adjacences
		const y = eventToApply.y();
		const symbol = eventToApply.symbol;
		if (symbol == SPACE.OPEN) {
			p_solver.stripesArray[y][x].forEach(index => {
				p_solver.cluesSpacesList[index].notPlacedOpensYet++;
			})
		} else {
			p_solver.stripesArray[y][x].forEach(index => {
				p_solver.cluesSpacesList[index].notPlacedClosedsYet++;
			})
		}
		p_solver.answerArray[y][x] = SPACE.UNDECIDED;
	}
}

//--------------------------------

// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SolveEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, p_geographicalDeduction.opening);
    }
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
        return standardSpaceOpeningToAdjacencyConversion(p_solver.answerArray[p_y][p_x]);
    }
}

//--------------------------------
// Intelligence
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x();
		const y = p_eventBeingApplied.y();
		const symbol = p_eventBeingApplied.symbol;
		if (symbol == SPACE.OPEN) {
			p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, p_solver.methodSet, x, y); 
			p_solver.stripesArray[y][x].forEach(index => { //Alert on strip
				const clue = p_solver.cluesSpacesList[index];
				if (clue.notPlacedOpensYet == 0) {
					p_listEventsToApply = p_solver.fillWithBlanks(p_listEventsToApply, clue, SPACE.CLOSED);
				}
			});
		} else {
			p_solver.stripesArray[y][x].forEach(index => { //Alert on strip
				const clue = p_solver.cluesSpacesList[index];
				if (clue.notPlacedClosedsYet == 0) {
					p_listEventsToApply = p_solver.fillWithBlanks(p_listEventsToApply, clue, SPACE.OPEN);
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
			if (!this.isBanned(x, y) && (this.answerArray[y][x] == SPACE.UNDECIDED)) {
				p_listEventsToApply.push(new SpaceEvent(x, y, p_spaceToFill));
			}
		}
	} else {
		const x = p_clue.x;
		for (var y = p_clue.yMin ; y <= p_clue.yMax ; y++) {
			if (!this.isBanned(x, y) && (this.answerArray[y][x] == SPACE.UNDECIDED)) {
				p_listEventsToApply.push(new SpaceEvent(x, y, p_spaceToFill));
			}
		}
	}
	
	return p_listEventsToApply;
}

// --------------------
// Passing

/*generateEventsForSingleStripPassClosure = function(p_solver) {
	return function(p_indexStrip) {
		return p_solver.generateEventsForSingleStripPass(p_indexStrip);
	}
}*/

// Index strip must match the index of a strip WITHOUT UNION !
SolverYajikabe.prototype.generateEventsForSingleStripPass = function(p_indexStrip) {
	const clue = this.cluesSpacesList[p_indexStrip];
	var eventList = [];
	if ((clue.direction == DIRECTION.LEFT) || (clue.direction == DIRECTION.RIGHT)) {
		const y = clue.y;
		for (var x = clue.xMin ; x <= clue.xMax ; x++) {
			if (this.answerArray[y][x] == SPACE.UNDECIDED) {
				eventList.push([SpaceEvent(x, y, SPACE.OPEN), SpaceEvent(x, y, SPACE.CLOSED)]);		
			}
		}
	} else {
		const x = clue.x;
		for (var y = clue.yMin ; y <= clue.yMax ; y++) {
			if (this.answerArray[y][x] == SPACE.UNDECIDED) {
				eventList.push([SpaceEvent(x, y, SPACE.OPEN), SpaceEvent(x, y, SPACE.CLOSED)]);		
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
			if (this.answerArray[y][x] == SPACE.UNDECIDED) {
				eventList.push([SpaceEvent(x, y, SPACE.OPEN), SpaceEvent(x, y, SPACE.CLOSED)]);		
			}
		}
	} else {
		const x = clue.x;
		for (var y = clue.yMin ; y <= clue.yMax ; y++) {
			if (this.answerArray[y][x] == SPACE.UNDECIDED) {
				eventList.push([SpaceEvent(x, y, SPACE.OPEN), SpaceEvent(x, y, SPACE.CLOSED)]);		
			}
		}
	}
	return eventList;
}


copying = function(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	if (p_event2.coorY > p_event1.coorY) {
		return -1;
	} else if (p_event2.coorY < p_event1.coorY) {
		return 1;
	} else if (p_event2.coorX > p_event1.coorX) {
		return -1;
	} else if (p_event2.coorX < p_event1.coorX) {
		return 1;
	} else {
		var c1 = (p_event1.symbol == SPACE.OPEN ? 1 : 0);
		var c2 = (p_event2.symbol == SPACE.OPEN ? 1 : 0); // Unstable : works because only "O" and "C" values are admitted
		return c1-c2;
	}
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

/*namingCategoryClosure = function(p_solver) {
	return function (p_indexRegion) {
		return "Region "+ p_indexRegion + " (" + p_solver.getFirstSpaceRegion(p_indexRegion).x +" "+ p_solver.getFirstSpaceRegion(p_indexRegion).y + ")"; 
	}
}


skipPassClosure = function(p_solver) {
	return function (p_indexRegion) {
		return p_solver.incertainity(p_indexRegion) > 500; // Arbitrary value
	}
}*/