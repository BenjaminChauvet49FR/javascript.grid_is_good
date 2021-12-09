function SolverYajilin(p_valueGrid) {
	LoopSolver.call(this);
	this.construct(p_valueGrid);
}

LOOP_PASS_CATEGORY.YAJI_STRIP = -1;
LOOP_PASS_CATEGORY.YAJI_UNION = -2;

SolverYajilin.prototype = Object.create(LoopSolver.prototype);
SolverYajilin.prototype.constructor = SolverYajilin;

SolverYajilin.prototype.construct = function(p_valueGrid) {
    this.xLength = p_valueGrid[0].length;
	this.yLength = p_valueGrid.length;
	this.loopSolverConstruct( 
	{	setSpaceLinkedPSAtomicDos : setSpaceLinkedPSAtomicDosClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedPSAtomicUndosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedPSAtomicUndosClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedPSDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		PSQuickStart : quickStartClosure(this),
		PSFilters : [filterStripsClosure(this)],
		PSAbortMethods : [abortYajilinClosure(this)],
		
		generateEventsForPassPS : generateEventsForStripesAndUnionsClosure(this),
		orderedListPassArgumentsPS : orderedListPassArgumentsClosureYajilin(this),
		namingCategoryPS : namingCategoryClosure(this),
		multipassPessimismPS : true
	});
	this.declareClosedSpacesActing();
	this.clueGrid = Grid_data(p_valueGrid);
	
	// What follows in the setup is copied onto Yajikabe (created after Yajilin but it handles unions)
	this.stripesArray = []; 
	this.cluesList = [];
	this.unionsStripesList = []; 
	
	// Initialize clues (could have been done above but I decided to separate everythin') 
	for(iy = 0;iy < this.yLength ; iy++) {
		this.stripesArray.push([]);
		for(ix = 0 ; ix < this.xLength ; ix++) {
			if (this.isNotEmpty(ix, iy)) {
				this.banSpace(ix, iy); // Spaces are banned here ! So we can use 'this.isBanned' everywhere.
				if (this.isNumeric(ix, iy)) {
					this.stripesArray[iy].push(this.cluesList.length);
					this.cluesList.push({
						x : ix, 
						y : iy, 
						direction : this.getDirection(ix, iy),
						notLinkedYet : -1,
						notClosedYet : -1,
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
	var finalCoor, numberEmptySpaces, x, y, xx, yy, closedSpacesInStrip;
	for (var i = 0; i < this.cluesList.length ; i++) {
		x = this.cluesList[i].x;
		y = this.cluesList[i].y;
		dir = this.cluesList[i].direction;
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
				if (this.cluesList[i].union == null && this.isNumeric(xx, y) && (this.getDirection(xx, y) == OppositeDirection[dir]) && !this.isBanned(finalCoor, y)) {
					this.cluesList[i].union = this.stripesArray[y][xx]; 
				}
				xx += DeltaX[dir];
			}
			if (this.testExistingCoordinate(xx, dir) && this.isNumeric(xx, y)) { // Premature end of strip
				closedSpacesInStrip = this.getNumber(x, y) - this.getNumber(xx, y);
			} else {
				closedSpacesInStrip = this.getNumber(x, y);
			}
			this.cluesList[i].xMin = Math.min(x + DeltaX[dir], finalCoor);
			this.cluesList[i].xMax = Math.max(x + DeltaX[dir], finalCoor);
			this.cluesList[i].notClosedYet = closedSpacesInStrip;
			this.cluesList[i].notLinkedYet = numberEmptySpaces - closedSpacesInStrip;
			
		} else {
			yy = y + DeltaY[dir];
			finalCoor = yy;
			while (this.testExistingCoordinate(yy, dir) && (!this.isNumeric(x, yy) || (this.getDirection(x, yy) != dir) )) {
				if (!this.isBanned(x, yy)) {
					this.stripesArray[yy][x].push(i);
					numberEmptySpaces++;
					finalCoor = yy;
				} 
				if (this.cluesList[i].union == null && this.isNumeric(x, yy) && (this.getDirection(x, yy) == OppositeDirection[dir]) && !this.isBanned(x, finalCoor)) {
					this.cluesList[i].union = this.stripesArray[yy][x];
				}
				yy += DeltaY[dir];
			}
			if (this.testExistingCoordinate(yy, dir) && this.isNumeric(x, yy)) { // Premature end of strip
				closedSpacesInStrip = this.getNumber(x, y) - this.getNumber(x, yy);
			} else {
				closedSpacesInStrip = this.getNumber(x, y);
			}
			this.cluesList[i].yMin = Math.min(y + DeltaY[dir], finalCoor);
			this.cluesList[i].yMax = Math.max(y + DeltaY[dir], finalCoor);
			this.cluesList[i].notClosedYet = closedSpacesInStrip;
			this.cluesList[i].notLinkedYet = numberEmptySpaces - closedSpacesInStrip;
		}
	}
	
	var ui, otherClue;
	// Now let's solve unions. Since they are mirrored, we will only do those coming from left or from up.
	for (var i = 0; i < this.cluesList.length ; i++) {
		clue = this.cluesList[i];
		ui = clue.union;
		if (ui != null) {
			if (clue.direction == DIRECTION.RIGHT) {
				otherClue = this.cluesList[ui];
				this.cluesList[i].union = this.unionsStripesList.length;
				this.cluesList[ui].union = this.unionsStripesList.length;
				this.unionsStripesList.push({
					orientation : ORIENTATION.HORIZONTAL, 
					y : clue.y, 
					xMin : Math.min(clue.xMin, otherClue.xMin), 
					xMax : Math.max(clue.xMax, otherClue.xMax)
				});
			}
			else if (clue.direction == DIRECTION.DOWN) {
				otherClue = this.cluesList[ui];
				this.cluesList[i].union = this.unionsStripesList.length;
				this.cluesList[ui].union = this.unionsStripesList.length;
				this.unionsStripesList.push({
					orientation : ORIENTATION.VERTICAL, 
					x : clue.x, 
					yMin : Math.min(clue.yMin, otherClue.yMin), 
					yMax : Math.max(clue.yMax, otherClue.yMax)
				});
			}
		}
	}
	
	this.stripesToCheckList = [];
	this.stripesToCheckArray = [];
	var coors;
	for (var i = 0 ; i < this.cluesList.length ; i++) {
		this.stripesToCheckArray.push(false);
		coors = this.cluesList[i];
	}
}

// Warning : values in hard. Duplicated in Yajikabe.

//Offensive !
SolverYajilin.prototype.getDirection = function(p_x, p_y) { 
	switch (this.clueGrid.get(p_x, p_y).charAt(0)) {
		case 'L' : return DIRECTION.LEFT; break;
		case 'U' : return DIRECTION.UP; break;
		case 'R' : return DIRECTION.RIGHT; break;
		case 'D' : return DIRECTION.DOWN; break;
		default : return null;
	}
}

SolverYajilin.prototype.getNumber = function(p_x, p_y) {
	return parseInt(this.clueGrid.get(p_x, p_y).substring(1), 10);
}

// -------------------
// Getters and setters shamelessly taken on Yajikabe

SolverYajilin.prototype.isNotEmpty = function(p_x, p_y) { // "isBanned" is reserved by LoopSolver but serves indeed to check if a space is banned in a loop puzzle
	return this.clueGrid.get(p_x, p_y) != null;
}

SolverYajilin.prototype.isNumeric = function(p_x, p_y) {
	const num = this.clueGrid.get(p_x, p_y);
	return (num != null && num.charAt(0) != "X");
}

// -------------------
// Input methods

SolverYajilin.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverYajilin.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverYajilin.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverYajilin.prototype.passSpace = function(p_x, p_y) {
	var passIndex;
	if (!this.isBanned(p_x, p_y)) {		
		passIndex = {passCategory : LOOP_PASS_CATEGORY.STANDARD_SPACE, x : p_x, y : p_y};
	} else {
		var value = this.stripesArray[p_y][p_x];
		if (value != null) {
			if (this.cluesList[value].union != null) {
				passIndex = {passCategory : LOOP_PASS_CATEGORY.YAJI_UNION, index : value};
			} else {			
				passIndex = {passCategory : LOOP_PASS_CATEGORY.YAJI_STRIP, index : value};
			}
		}
	}
	if (passIndex) {
		this.passLoop(passIndex); 
	}
}

SolverYajilin.prototype.makeMultipass = function() {
	this.multipassLoop();
}


// -------------------
// Atomic closures 

function setSpaceLinkedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.stripesArray[p_space.y][p_space.x].forEach ( stripeIndex => {
			p_solver.cluesList[stripeIndex].notLinkedYet--;
			p_solver.freshStrip(stripeIndex);
		});
	}
}

function setSpaceClosedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		// For banned spaces, a 'if' is necessary
		if (!p_solver.isBanned(p_space.x, p_space.y)) {	
			p_solver.stripesArray[p_space.y][p_space.x].forEach ( stripeIndex => {
				p_solver.cluesList[stripeIndex].notClosedYet--;
				p_solver.freshStrip(stripeIndex);
			});
		}
	}
}

function setSpaceLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.stripesArray[p_space.y][p_space.x].forEach ( stripeIndex => {
			p_solver.cluesList[stripeIndex].notLinkedYet++;
		});
	}
}

function setSpaceClosedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.stripesArray[p_space.y][p_space.x].forEach ( stripeIndex => {
			p_solver.cluesList[stripeIndex].notClosedYet++;
		});
	}
}

// -------------------
// Closure deduction

// Space closed 
function setSpaceClosedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		const indexStripes = p_solver.stripesArray[y][x];
		for (var i = 0; i < indexStripes.length ; i++) {
			if (p_solver.cluesList[indexStripes[i]].notClosedYet < 0) {
				p_listEvents.push(new FailureEvent());
				return p_listEvents;
			}
		}
		p_solver.existingNeighborsCoors(x, y).forEach(coors => {
			if (!p_solver.isBanned(coors.x, coors.y)) {
				p_listEvents.push(new SpaceEvent(coors.x, coors.y, LOOP_STATE.LINKED));
			}
		});
		return p_listEvents;
	}
}

// Space linked
function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const indexStripes = p_solver.stripesArray[p_eventToApply.y][p_eventToApply.x];
		for (var i = 0; i < indexStripes.length ; i++) {
			if (p_solver.cluesList[indexStripes[i]].notLinkedYet < 0) {
				p_listEvents.push(new FailureEvent());
				return p_listEvents;
			}
		}
		return p_listEvents;
	}
}

// Edge closed
function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		// If a space has only 2 "possible neighbors", these neighbors must be opened. (copied from Koburin)
		const x = p_eventToApply.linkX;
		const y = p_eventToApply.linkY;
		const dir = p_eventToApply.direction;
		const dx = p_eventToApply.linkX + DeltaX[dir];
		const dy = p_eventToApply.linkY + DeltaY[dir];
		p_listEvents = p_solver.tryAndCloseBeforeAndAfter2ClosedDeductions(p_listEvents, x, y);
		p_listEvents = p_solver.tryAndCloseBeforeAndAfter2ClosedDeductions(p_listEvents, dx, dy);
		return p_listEvents;
	}
}

/**
Smartness of Yajilin / Koburin ! Tests if (p_x, p_y) space has exactly 2 closed neighbors : since 2 adjacent spaces cannot be closed and a loop is required to cross, the undecided spaces around must be open in any case.
*/
SolverYajilin.prototype.tryAndCloseBeforeAndAfter2ClosedDeductions = function(p_listEvents, p_x, p_y) {
	KnownDirections.forEach(dir => {
		if (this.getClosedEdges(p_x, p_y) == 2) {
			if (this.neighborExists(p_x, p_y, dir) && this.getLink(p_x, p_y, dir) != LOOP_STATE.CLOSED) {
				p_listEvents.push(new SpaceEvent(p_x + DeltaX[dir], p_y + DeltaY[dir], LOOP_STATE.LINKED));
			}
		}
	});
	return p_listEvents;
}

// -------------------
// Filters

SolverYajilin.prototype.freshStrip = function(p_index) {
	if (!this.stripesToCheckArray[p_index]) {
		this.stripesToCheckArray[p_index] = true;
		this.stripesToCheckList.push(p_index);
	}
}

function filterStripsClosure(p_solver) {
	return function() {
		var listEvents = [];
		var strip;
		var x, y;
		var xOrYSpacesToCloseInOdd, xOrYSpacesToCloseInEven, currentChainLength, numberClosableSpaces;
		for (var iCheck = 0 ; iCheck < p_solver.stripesToCheckList.length ; iCheck++) { 
			listEvents = p_solver.testStripDeductions(listEvents, p_solver.cluesList[p_solver.stripesToCheckList[iCheck]]);
			if (listEvents == EVENT_RESULT.FAILURE) {
				return EVENT_RESULT.FAILURE;
			}
		};
		p_solver.cleanCheckStrips();
		return listEvents;
	}
}

SolverYajilin.prototype.testStripDeductions = function(p_listEvents, p_strip) {
	const direction = p_strip.direction;
	if (direction == DIRECTION.UP || direction == DIRECTION.DOWN) {
		if (p_strip.notClosedYet == 0) {
			this.fillVerticalStripDeductions(p_listEvents, p_strip, LOOP_STATE.LINKED);
		} else if (p_strip.notLinkedYet == 0) {
			this.fillVerticalStripDeductions(p_listEvents, p_strip, LOOP_STATE.CLOSED);
		} else {
			x = p_strip.x;
			y = p_strip.yMin;
			undecidedChainTracker = {odd : [], even : [], currentChainLength : 0, numberClosableSpaces : 0};
			// Track all the "undecided chains", that are the chains of spaces that are not decided yet.
			while (y <= p_strip.yMax && undecidedChainTracker.numberClosableSpaces <= p_strip.notClosedYet) {
				undecidedChainTracker = this.sniffNewSpace(undecidedChainTracker, x, y, y);
				y++;
			} 
			// Final chain, for when the last space of the chain is at edge of grid. Same as above.
			if (undecidedChainTracker.currentChainLength > 0) {
				undecidedChainTracker = pushUndecidedChain(undecidedChainTracker, y);
			}
			// Great, we have the right number of spaces to close. Let's close them ! (at least the ones in the odd-length undecided chains ?)
			if (undecidedChainTracker.numberClosableSpaces == p_strip.notClosedYet) {
				undecidedChainTracker.odd.forEach(indicationInOdd => {
					var y = indicationInOdd.first;
					for (i = 0; i < indicationInOdd.number; i++) {
						p_listEvents.push(new SpaceEvent(x, y, LOOP_STATE.CLOSED));
						y+=2;
					}
				});
			}
			// Among the undecided spaces on p_strip, we are not able to close enough spaces to meet the remaining requirement.
			if (undecidedChainTracker.numberClosableSpaces < p_strip.notClosedYet) {
				return EVENT_RESULT.FAILURE;
			} 
		}
	} 
	if (direction == DIRECTION.LEFT || direction == DIRECTION.RIGHT) { //Copied onto vertical !
		if (p_strip.notClosedYet == 0) {
			this.fillHorizontalStripDeductions(p_listEvents, p_strip, LOOP_STATE.LINKED);
		} else if (p_strip.notLinkedYet == 0) {
			this.fillHorizontalStripDeductions(p_listEvents, p_strip, LOOP_STATE.CLOSED);
		} else {
			x = p_strip.xMin;
			y = p_strip.y;
			undecidedChainTracker = {odd : [], even : [], currentChainLength : 0, numberClosableSpaces : 0};
			// Track all the "undecided chains"
			while (x <= p_strip.xMax && undecidedChainTracker.numberClosableSpaces <= p_strip.notClosedYet) {
				undecidedChainTracker = this.sniffNewSpace(undecidedChainTracker, x, y, x);
				x++;
			} 
			// Final chain
			if (undecidedChainTracker.currentChainLength > 0) {
				undecidedChainTracker = pushUndecidedChain(undecidedChainTracker, x);
			}
			// Close them
			if (undecidedChainTracker.numberClosableSpaces == p_strip.notClosedYet) {
				undecidedChainTracker.odd.forEach(indicationInOdd => {
					var x = indicationInOdd.first;
					for (i = 0; i < indicationInOdd.number; i++) {
						p_listEvents.push(new SpaceEvent(x, y, LOOP_STATE.CLOSED));
						x+=2;
					}
				});
			}
			// Fail
			if (undecidedChainTracker.numberClosableSpaces < p_strip.notClosedYet) {
				return EVENT_RESULT.FAILURE;
			} 
		}
	}	
	return p_listEvents;
}

/**
notClosedYet / notLinkedYet is at 0 in a strip, fill the events. One method per orientation.
*/
SolverYajilin.prototype.fillVerticalStripDeductions = function(p_listEvents, p_strip, p_state) {
	const x = p_strip.x;
	for (var y = p_strip.yMin ; y <= p_strip.yMax ; y++) {
		if (this.getLinkSpace(x, y) == LOOP_STATE.UNDECIDED) {
			p_listEvents.push(new SpaceEvent(x, y, p_state));
		}
	}
	return p_listEvents;
}

SolverYajilin.prototype.fillHorizontalStripDeductions = function(p_listEvents, p_strip, p_state) {
	const y = p_strip.y;
	for (x = p_strip.xMin ; x <= p_strip.xMax ; x++) {
		if (this.getLinkSpace(x, y) == LOOP_STATE.UNDECIDED) {
			p_listEvents.push(new SpaceEvent(x, y, p_state));
		}
	}
	return p_listEvents;
}

/**
We are running a strip of Yajilin from left to right or from top to bottom. 
Right now we are examinating space (p_x, p_y) 
p_decidedCoordinate = p_x if horizontal, p_y if vertical.
*/
SolverYajilin.prototype.sniffNewSpace = function(p_undecidedChainTracker, p_x, p_y, p_decidedCoordinate) {
	if (this.getLinkSpace(p_x, p_y) == LOOP_STATE.UNDECIDED) {
		p_undecidedChainTracker.currentChainLength++;
		if (p_undecidedChainTracker.currentChainLength % 2 == 1) {
			p_undecidedChainTracker.numberClosableSpaces++;
		}
	} else if (p_undecidedChainTracker.currentChainLength > 0) {
		// (p_x, p_y) space is NOT undecided (it may be banned.) The first undecided space was back at (p_decidedCoordinate)-(currentChainLength) and the last one at (p_decidedCoordinate) - 1.
		p_undecidedChainTracker = pushUndecidedChain(p_undecidedChainTracker, p_decidedCoordinate);
		p_undecidedChainTracker.currentChainLength = 0;
	}
	return p_undecidedChainTracker;
}

/**
A new undecided chain has been found. The (xOrYEnd) is the moving coordinate (x if horiz strip, y if vert strip) that is the first after the end of an undecided chain. It may be a coordinate right after the end of the grid.
*/
pushUndecidedChain = function(p_undecidedChainTracker, p_xOrYEnd) {
	const ccl = p_undecidedChainTracker.currentChainLength;
	if (ccl % 2 == 1) {
		p_undecidedChainTracker.odd.push({first : p_xOrYEnd - ccl, number : (ccl + 1)/2}); 
	} else {
		p_undecidedChainTracker.even.push({first : p_xOrYEnd - ccl, totalLength : ccl}); 
	}
	return p_undecidedChainTracker;
}

SolverYajilin.prototype.cleanCheckStrips = function() {
	this.stripesToCheckList.forEach(i => {
		this.stripesToCheckArray[i] = false;
	});
	this.stripesToCheckList = [];
}

abortYajilinClosure = function(p_solver) {
	return function() {
		p_solver.cleanCheckStrips();
	}
} // Some wrapping here...


// -------------------
// Quickstart

quickStartClosure = function(p_solver) {
	return function() { 
		p_solver.initiateQuickStart("Yajilin");
		var list = [];
		p_solver.cluesList.forEach(strip => {
			list = p_solver.testStripDeductions(list, strip);
		});
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				// Smartness of Yajilin
				if (!p_solver.isBanned(x, y)) {
					list = p_solver.tryAndCloseBeforeAndAfter2ClosedDeductions(list, x, y);
				}
			}
		}
		list.forEach(p_event => {
			p_solver.tryToPutNewSpace(p_event.x, p_event.y, p_event.state);
		});
		p_solver.terminateQuickStart();
	}
}

// -------------------
// Passing & multipassing (copied onto Yajikabe)
		
generateEventsForStripesAndUnionsClosure = function (p_solver) {
	return function (p_indexFamily) {
		if (p_indexFamily.passCategory == LOOP_PASS_CATEGORY.YAJI_STRIP) {
			return p_solver.generateEventsForSingleStripPass(p_indexFamily.index);
		} else {
			return  p_solver.generateEventsForUnionStripPass(p_indexFamily.index); 
		}
	}
}

SolverYajilin.prototype.generateEventsForSingleStripPass = function(p_indexStrip) {
	const clue = this.cluesList[p_indexStrip];
	var eventList = [];
	if ((clue.direction == DIRECTION.LEFT) || (clue.direction == DIRECTION.RIGHT)) {
		const y = clue.y;
		for (var x = clue.xMin ; x <= clue.xMax ; x++) {
			eventList = this.spacePass(eventList, x, y);
		}
	} else {
		const x = clue.x;
		for (var y = clue.yMin ; y <= clue.yMax ; y++) {
			eventList = this.spacePass(eventList, x, y);
		}
	}
	return eventList;
}

SolverYajilin.prototype.generateEventsForUnionStripPass = function(p_indexUnion) {
	const clue = this.unionsStripesList[p_indexUnion];
	var eventList = [];
	if ((clue.orientation == ORIENTATION.HORIZONTAL)) {
		const y = clue.y;
		for (var x = clue.xMin ; x <= clue.xMax ; x++) {
			eventList = this.spacePass(eventList, x, y);
		}
	} else {
		const x = clue.x;
		for (var y = clue.yMin ; y <= clue.yMax ; y++) {
			eventList = this.spacePass(eventList, x, y);
		}
	}
	return eventList;
}

SolverYajilin.prototype.spacePass = function(p_passList, p_x, p_y) {
	if (this.getLinkSpace(p_x, p_y) == LOOP_STATE.UNDECIDED) {
		p_passList.push([new SpaceEvent(p_x, p_y, LOOP_STATE.LINKED), new SpaceEvent(p_x, p_y, LOOP_STATE.CLOSED)]);		
	}
	return p_passList;
}

orderedListPassArgumentsClosureYajilin = function(p_solver) {
	return function() {
		var indexList = [];
		for (var i = 0 ; i < p_solver.cluesList.length ; i++) {
			if (p_solver.cluesList[i].union == null) {
				indexList.push({passCategory : LOOP_PASS_CATEGORY.YAJI_STRIP, index : i}); // TODO possibility of adding more details for incertainity
			} 
		}
		for (var i = 0 ; i < p_solver.unionsStripesList.length ; i++) {
			indexList.push({passCategory : LOOP_PASS_CATEGORY.YAJI_UNION, index : i});
		}
		return indexList;
	}
}

namingCategoryClosure = function(p_solver) {
	return function(p_passIndex) {
		if (p_passIndex.passCategory == LOOP_PASS_CATEGORY.YAJI_UNION) {
			const uni = p_solver.unionsStripesList[p_passIndex.index];
			if (uni.orientation == ORIENTATION.VERTICAL) {
				return "(Stripes V " + uni.x + "," + uni.yMin + "-" + uni.yMax +")";
			} else {
				return "(Stripes H " + uni.xMin + "-" + uni.xMax + "," + uni.y +")";
			}
		} else {
			const str = p_solver.cluesList[p_passIndex.index];
			if (str.direction == DIRECTION.UP || str.direction == DIRECTION.DOWN) {
				return "(Strip V " + str.x + "," + str.yMin + "-" + str.yMax +")";
			} else {
				return "(Strip H " + str.xMin + "-" + str.xMax + "," + str.y +")";
			}
		}
	}
}
