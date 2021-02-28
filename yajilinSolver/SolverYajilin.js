const YAJ_DIRECTION = {
	LEFT : 'l',
	UP : 'u',
	RIGHT : 'r',
	DOWN : 'd'
}

const STRIPE_ORIENTATION = {
	HORIZONTAL : 'h',
	VERTICAL : 'v'
}

function SolverYajilin(p_valueGrid) {
	LoopSolver.call(this);
	this.construct(p_valueGrid);
}

SolverYajilin.prototype = Object.create(LoopSolver.prototype);
SolverYajilin.prototype.constructor = SolverYajilin;

SolverYajilin.prototype.construct = function(p_valueGrid) {
    this.xLength = p_valueGrid[0].length;
	this.yLength = p_valueGrid.length;
	this.loopSolverConstruct(generateWallArray(this.xLength, this.yLength), 
	{	setSpaceLinkedPSAtomicDos : setSpaceLinkedPSAtomicDosClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedPSAtomicUndosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedPSAtomicUndosClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedPSDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		PSQuickStart : quickStartClosure(this),
		PSFilters : [filterStripsClosure(this)],
		PSAbortMethods : [abortYajilinClosure(this)]
	});
	this.activateClosedSpaces();
	
	
	// comparisonLoopEvents and copyLoopEventMethod defined in LoopSolver
	//this.methodSetPass = {comparisonMethod : comparisonLoopEventsMethod, copyMethod : copyLoopEventMethod,  argumentToLabelMethod : namingCategoryClosure(this)};
	//this.setMultipass = {numberPSCategories : 1, PSCategoryMethod : multiPassKoburinCategoryClosure(this), tolerateClosedSpaces : true, generatePassEventsMethod : generateEventsForSpaceClosure(this)}
	this.clueGrid = Grid_data(p_valueGrid);
	this.setupClues = [];
	this.stripesGrid = [];
	this.stripes = [];
	var valueString;
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.stripesGrid.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			this.stripesGrid[iy].push([]);
			valueString = p_valueGrid[iy][ix]; 
			if (valueString != null) {
				this.banSpace(ix, iy); // Banning spaces is here, but not only !
				if (valueString != 'X') {
					this.setupClues.push({x : ix, y : iy, direction : getDirection(valueString), number : getNumber(valueString)});
				}
			}
		}
	}
	
	var numberSpaces, x, y, lastX, lastY;
	var newNumber;
	this.setupClues.forEach(clue => {
		numberSpaces = 0;
		switch (clue.direction) {
			case YAJ_DIRECTION.LEFT : 
				x = clue.x - 1;
				y = clue.y;
				while (x >= 0 && (this.clueGrid.get(x, y) == null || getDirection(this.clueGrid.get(x, y)) != YAJ_DIRECTION.LEFT)) {
					if (!this.isBanned(x, y)) {
						numberSpaces++;
						lastX = x;
						this.stripesGrid[y][x].push(this.stripes.length);
					}
					x--;
				}
				if (x > 0) { // Interruption in strip = we met another space going this sense / direction / whatever...
					newNumber = getNumber(this.clueGrid.get(x, y));
				} else {
					newNumber = 0;
				}
				if (numberSpaces > 0) {
					this.stripes.push({direction : STRIPE_ORIENTATION.HORIZONTAL, xMin : lastX, xMax : clue.x-1, y : y, 
					notClosedYet : clue.number - newNumber, notLinkedYet : numberSpaces - (clue.number - newNumber)});
				}
				break; // TODO possibility of deltaX and deltaY for the directions... ? Well, I'll see it later
			case YAJ_DIRECTION.UP : 
				x = clue.x;
				y = clue.y - 1;
				while (y >= 0 && (this.clueGrid.get(x, y) == null || getDirection(this.clueGrid.get(x, y)) != YAJ_DIRECTION.UP)) {
					if (!this.isBanned(x, y)) {
						numberSpaces++;
						lastY = y;
						this.stripesGrid[y][x].push(this.stripes.length);
					}
					y--;
				}
				if (y > 0) {
					newNumber = getNumber(this.clueGrid.get(x, y));
				} else {
					newNumber = 0;
				}
				if (numberSpaces > 0) {
					this.stripes.push({direction : STRIPE_ORIENTATION.VERTICAL, yMin : lastY, yMax : clue.y-1, x : x,
					notClosedYet : clue.number - newNumber, notLinkedYet : numberSpaces - (clue.number - newNumber)});					
				}
				break; 
			case YAJ_DIRECTION.RIGHT : 
				x = clue.x + 1;
				y = clue.y;
				while (x < this.xLength && (this.clueGrid.get(x, y) == null || getDirection(this.clueGrid.get(x, y)) != YAJ_DIRECTION.RIGHT)) {
					if (!this.isBanned(x, y)) {
						numberSpaces++;
						lastX = x;
						this.stripesGrid[y][x].push(this.stripes.length);
					}
					x++;
				}
				if (x < this.xLength) {
					newNumber = getNumber(this.clueGrid.get(x, y));
				} else {
					newNumber = 0;
				}
				if (numberSpaces > 0) {
					this.stripes.push({direction : STRIPE_ORIENTATION.HORIZONTAL, xMin : clue.x+1, xMax : lastX, y : y,
					notClosedYet : clue.number - newNumber, notLinkedYet : numberSpaces - (clue.number - newNumber)});
				}
				break; 
			case YAJ_DIRECTION.DOWN : 
				x = clue.x;
				y = clue.y + 1;
				while (y < this.yLength && (this.clueGrid.get(x, y) == null || getDirection(this.clueGrid.get(x, y)) != YAJ_DIRECTION.DOWN)) {
					if (!this.isBanned(x, y)) {
						numberSpaces++;
						lastY = y;
						this.stripesGrid[y][x].push(this.stripes.length);
					}
					y++;
				}
				if (y < this.yLength) {
					newNumber = getNumber(this.clueGrid.get(x, y));
				} else {
					newNumber = 0;
				}
				if (numberSpaces > 0) {
					this.stripes.push({direction : STRIPE_ORIENTATION.VERTICAL, yMin : clue.y+1, yMax : lastY, x : x,
					notClosedYet : clue.number - newNumber, notLinkedYet : numberSpaces - (clue.number - newNumber)});					
				}
				break;
		}
	});	
	
	this.stripesToCheckList = [];
	this.stripesToCheckArray = [];
	for (var i = 0 ; i < this.stripes.length ; i++) {
		this.stripesToCheckArray.push(false);
	}
}

// Warning : values in hard.
function getDirection(p_valueString) {
	switch (p_valueString.charAt(0)) {
		case 'L' : return YAJ_DIRECTION.LEFT; break;
		case 'U' : return YAJ_DIRECTION.UP; break;
		case 'R' : return YAJ_DIRECTION.RIGHT; break;
		case 'D' : return YAJ_DIRECTION.DOWN; break;
		default : return null;
	}
}

function getNumber(p_valueString) {
	return parseInt(p_valueString.substring(1),10);
}

// -------------------
// Getters and setters


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

/*SolverYajilin.prototype.passSpace = function(p_x, p_y) {
	const generatedEvents = generateEventsForSpaceClosure(this)({x : p_x, y : p_y}); // Yeah, that method (returned by the closure) should have one single argument as it will be passed to multipass...
	this.passEvents(generatedEvents, this.methodSetDeductions, this.methodSetPass, {x : p_x, y : p_y}); 
}

SolverYajilin.prototype.makeMultipass = function() {
	this.multiPass(this.methodSetDeductions, this.methodSetPass, this.setMultipass); 
}*/

// -------------------
// Atomic closures 

function setSpaceLinkedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.stripesGrid[p_space.y][p_space.x].forEach ( stripeIndex => {
			p_solver.stripes[stripeIndex].notLinkedYet--;
			p_solver.freshStrip(stripeIndex);
		});
	}
}

function setSpaceClosedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.stripesGrid[p_space.y][p_space.x].forEach ( stripeIndex => {
			p_solver.stripes[stripeIndex].notClosedYet--;
			p_solver.freshStrip(stripeIndex);
		});
	}
}

function setSpaceLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.stripesGrid[p_space.y][p_space.x].forEach ( stripeIndex => {
			p_solver.stripes[stripeIndex].notLinkedYet++;
		});
	}
}

function setSpaceClosedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.stripesGrid[p_space.y][p_space.x].forEach ( stripeIndex => {
			p_solver.stripes[stripeIndex].notClosedYet++;
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
		const indexStripes = p_solver.stripesGrid[y][x];
		for (var i = 0; i < indexStripes.length ; i++) {
			if (p_solver.stripes[indexStripes[i]].notClosedYet < 0) {
				p_listEvents.push(new FailureEvent());
				return p_listEvents;
			}
		}
		KnownDirections.forEach(dir => {
			if (p_solver.neighborExists(x, y, dir) && !p_solver.isBanned(x+DeltaX[dir], y+DeltaY[dir])) {
				p_listEvents.push(new SpaceEvent(x+DeltaX[dir], y+DeltaY[dir], LOOP_STATE.LINKED));
			}
		});
		return p_listEvents;
	}
}

// Space linked
function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEvents, p_eventToApply) {
		const indexStripes = p_solver.stripesGrid[p_eventToApply.y][p_eventToApply.x];
		for (var i = 0; i < indexStripes.length ; i++) {
			if (p_solver.stripes[indexStripes[i]].notLinkedYet < 0) {
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
		p_listEvents = p_solver.tryAndCloseBeforeAndAfter2Closed(p_listEvents, x, y);
		p_listEvents = p_solver.tryAndCloseBeforeAndAfter2Closed(p_listEvents, dx, dy);
		return p_listEvents;
	}
}

/**
Smartness of Yajilin / Koburin ! Tests if (p_x, p_y) space has exactly 2 closed neighbors : since 2 adjacent spaces cannot be closed and a loop is required to cross, the undecided spaces around must be open in any case.
*/
SolverYajilin.prototype.tryAndCloseBeforeAndAfter2Closed = function(p_listEvents, p_x, p_y) {
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
		for (var iCheck = 0; iCheck < p_solver.stripesToCheckList.length ; iCheck++) { 
			listEvents = p_solver.testStrip(listEvents, p_solver.stripes[p_solver.stripesToCheckList[iCheck]]);
			if (listEvents == EVENT_RESULT.FAILURE) {
				return EVENT_RESULT.FAILURE;
			}
		};
		p_solver.cleanCheckStrips();
		return listEvents;
	}
}

SolverYajilin.prototype.testStrip = function(p_listEvents, p_strip) {
	if (p_strip.direction == STRIPE_ORIENTATION.VERTICAL) {
		if (p_strip.notClosedYet == 0) {
			this.fillVerticalStripWithEvents(p_listEvents, p_strip, LOOP_STATE.LINKED);
		} else if (p_strip.notLinkedYet == 0) {
			this.fillVerticalStripWithEvents(p_listEvents, p_strip, LOOP_STATE.CLOSED);
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
	if (p_strip.direction == STRIPE_ORIENTATION.HORIZONTAL) { //Copied onto vertical !
		if (p_strip.notClosedYet == 0) {
			this.fillHorizontalStripWithEvents(p_listEvents, p_strip, LOOP_STATE.LINKED);
		} else if (p_strip.notLinkedYet == 0) {
			this.fillHorizontalStripWithEvents(p_listEvents, p_strip, LOOP_STATE.CLOSED);
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
SolverYajilin.prototype.fillVerticalStripWithEvents = function(p_listEvents, p_strip, p_state) {
	const x = p_strip.x;
	for (var y = p_strip.yMin ; y <= p_strip.yMax ; y++) {
		if (this.getLinkSpace(x, y) == LOOP_STATE.UNDECIDED) {
			p_listEvents.push(new SpaceEvent(x, y, p_state));
		}
	}
	return p_listEvents;
}

SolverYajilin.prototype.fillHorizontalStripWithEvents = function(p_listEvents, p_strip, p_state) {
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
		p_solver.stripes.forEach(strip => {
			list = p_solver.testStrip(list, strip);
			for (var y = 0 ; y < p_solver.yLength ; y++) {
				for (var x = 0 ; x < p_solver.xLength ; x++) {
					// Smartness of Yajilin
					if (!p_solver.isBanned(x, y)) {
						list = p_solver.tryAndCloseBeforeAndAfter2Closed(list, x, y);
					}
				}
			}
			list.forEach(p_event => {
				p_solver.tryToPutNewSpace(p_event.x, p_event.y, p_event.state);
			});
		});
		p_solver.terminateQuickStart();
	}
}

// -------------------
// Passing (TODO : copied from Koburin)

/*generateEventsForSpaceClosure = function(p_solver) {
	return function(p_space) {
		// To be done
		return p_solver.standardSpacePassEvents(p_space.x, p_space.y);
	}
}

function namingCategoryClosure(p_solver) { // TODO factorize with other solvers that pass spaces
	return function (p_space) {
		const x = p_space.x;
		const y = p_space.y;
		var answer = x+","+y;
		if (p_solver.getNumber(x,y) != null) {
			answer += " ("+p_solver.getNumber(x,y)+")";
		}
		return answer;
	}
}

// -------------------
// Multipass

multiPassKoburinCategoryClosure = function(p_solver) {
	return function (p_x, p_y) {
		if ((p_solver.getNumber(p_x, p_y) != null) && (p_solver.numericGrid[p_y][p_x].notClosedYet > 0)) {
			return 0;
		} else {
			return -1;
		}
	}
}

// -------------------
// Log of the numerical grid (copied on LoopSolver's other logOppositeEnd)

LoopSolver.prototype.logNumericGrid = function(p_xStart = 0, p_yStart = 0, p_xEnd, p_yEnd) {
	var answer = "\n";
	var numeric;
	var stringSpace;
	if (!p_xEnd) {
		p_xEnd = this.xLength;
	} 
	if (!p_yEnd) {
		p_yEnd = this.yLength;
	}
	for (var iy = p_yStart; iy < p_yEnd ; iy++) {
		for (var ix = p_xStart; ix < p_xEnd ; ix++) {
			numeric = this.numericGrid[iy][ix];
			if (numeric.notLinkedYet || numeric.notLinkedYet == 0) {
				stringSpace = numeric.notClosedYet+" "+numeric.notLinkedYet;
			} else {
				stringSpace = "ND";
			}
			while(stringSpace.length < 5) {
				stringSpace+= " ";
			}
			answer+=stringSpace+"|";
		}
		answer+="\n";
	}
	console.log(answer);
}*/
