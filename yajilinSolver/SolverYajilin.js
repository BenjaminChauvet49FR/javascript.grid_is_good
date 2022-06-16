function SolverYajilin(p_valueGrid) {
	LoopSolver.call(this);
	this.construct(p_valueGrid);
}

LOOP_PASS_CATEGORY.YAJI_STRIP = -1;
LOOP_PASS_CATEGORY.YAJI_UNION = -2;

SolverYajilin.prototype = Object.create(LoopSolver.prototype);
SolverYajilin.prototype.constructor = SolverYajilin;

function DummySolver() {
	return new SolverYajilin(generateSymbolArray(1, 1));
}

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
		quickStartEventsPS : quickStartEventsClosure(this),
		PSFilters : [filterStripsClosure(this)],
		PSAbortMethods : [abortYajilinClosure(this)],
		
		generateEventsForPassPS : generateEventsForStripesAndUnionsClosure(this),
		orderedListPassArgumentsPS : orderedListPassArgumentsClosureYajilin(this),
		namingCategoryPS : namingCategoryPassClosure(this),
		multipassPessimismPS : true
	});
	this.declareClosedSpacesActing();
	this.clueGrid = Grid_data(p_valueGrid);
	this.setResolution.searchSolutionMethod = loopNaiveSearchClosure(this);
	
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
	
	this.stripesToCheckList = []; // Note : no checker. 
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
		case CHAR_DIRECTION.LEFT : return DIRECTION.LEFT; break;
		case CHAR_DIRECTION.UP : return DIRECTION.UP; break;
		case CHAR_DIRECTION.RIGHT : return DIRECTION.RIGHT; break;
		case CHAR_DIRECTION.DOWN : return DIRECTION.DOWN; break;
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
	return (num != null && num.charAt(0) != SYMBOL_ID.X);
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
	var indexPass;
	if (!this.isBanned(p_x, p_y)) {		
		indexPass = {category : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	} else {
		var value = this.stripesArray[p_y][p_x];
		if (value != null) {
			if (this.cluesList[value].union != null) {
				indexPass = {category : LOOP_PASS_CATEGORY.YAJI_UNION, index : this.cluesList[value].union};
			} else {			
				indexPass = {category : LOOP_PASS_CATEGORY.YAJI_STRIP, index : value};
			}
		}
	}
	if (indexPass) {
		this.passLoop(indexPass); 
	}
}

SolverYajilin.prototype.makeMultipass = function() {
	this.multipassLoop();
}

SolverYajilin.prototype.makeResolution = function (p_solver) {
	this.resolve();
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
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const indexStripes = p_solver.stripesArray[y][x];
		for (var i = 0; i < indexStripes.length ; i++) {
			if (p_solver.cluesList[indexStripes[i]].notClosedYet < 0) {
				p_listEventsToApply.push(new FailureEvent());
				return;
			}
		}
		p_solver.existingNeighborsCoors(x, y).forEach(coors => {
			if (!p_solver.isBanned(coors.x, coors.y)) {
				p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, LOOP_STATE.LINKED));
			}
		});
	}
}

// Space linked
function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const indexStripes = p_solver.stripesArray[p_eventBeingApplied.y][p_eventBeingApplied.x];
		for (var i = 0; i < indexStripes.length ; i++) {
			if (p_solver.cluesList[indexStripes[i]].notLinkedYet < 0) {
				p_listEventsToApply.push(new FailureEvent());
				return;
			}
		}
	}
}

// Edge closed
function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const dir = p_eventBeingApplied.direction;
		const dx = p_eventBeingApplied.linkX + DeltaX[dir];
		const dy = p_eventBeingApplied.linkY + DeltaY[dir];
		p_solver.deductionsTryAndCloseBeforeAndAfter2Closed(p_listEventsToApply, x, y);
		p_solver.deductionsTryAndCloseBeforeAndAfter2Closed(p_listEventsToApply, dx, dy);
	}
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
		var listPass = [];
		var strip;
		var x, y;
		var xOrYSpacesToCloseInOdd, xOrYSpacesToCloseInEven, currentChainLength, numberClosableSpaces;
		for (var iCheck = 0 ; iCheck < p_solver.stripesToCheckList.length ; iCheck++) { 
			p_solver.deductionsTestStrip(listPass, p_solver.cluesList[p_solver.stripesToCheckList[iCheck]]);
			if (listPass == EVENT_RESULT.FAILURE) {
				return FILTER_FAILURE;
			}
		};
		p_solver.cleanCheckStrips();
		return listPass;
	}
}

SolverYajilin.prototype.deductionsTestStrip = function(p_listEventsToApply, p_strip) {
	const direction = p_strip.direction;
	if (direction == DIRECTION.UP || direction == DIRECTION.DOWN) {
		if (p_strip.notClosedYet == 0) {
			this.deductionsFillVerticalStrip(p_listEventsToApply, p_strip, LOOP_STATE.LINKED);
		} else if (p_strip.notLinkedYet == 0) {
			this.deductionsFillVerticalStrip(p_listEventsToApply, p_strip, LOOP_STATE.CLOSED);
		} else {
			x = p_strip.x;
			y = p_strip.yMin;
			undecidedChainTracker = {odd : [], even : [], currentChainLength : 0, numberClosableSpaces : 0};
			// Track all the "undecided chains", that are the chains of spaces that are not decided yet.
			while (y <= p_strip.yMax && undecidedChainTracker.numberClosableSpaces <= p_strip.notClosedYet) {
				this.sniffNewSpace(undecidedChainTracker, x, y, y);
				y++;
			} 
			// Final chain, for when the last space of the chain is at edge of grid. Same as above.
			if (undecidedChainTracker.currentChainLength > 0) {
				pushUndecidedChain(undecidedChainTracker, y);
			}
			// Great, we have the right number of spaces to close. Let's close them ! (at least the ones in the odd-length undecided chains ?)
			if (undecidedChainTracker.numberClosableSpaces == p_strip.notClosedYet) {
				undecidedChainTracker.odd.forEach(indicationInOdd => {
					var y = indicationInOdd.first;
					for (i = 0; i < indicationInOdd.number; i++) {
						p_listEventsToApply.push(new SpaceEvent(x, y, LOOP_STATE.CLOSED));
						y+=2;
					}
				});
			}
			// Among the undecided spaces on p_strip, we are not able to close enough spaces to meet the remaining requirement.
			if (undecidedChainTracker.numberClosableSpaces < p_strip.notClosedYet) {
				return FILTER_FAILURE;
			} 
		}
	} 
	if (direction == DIRECTION.LEFT || direction == DIRECTION.RIGHT) { //Copied onto vertical !
		if (p_strip.notClosedYet == 0) {
			this.deductionsFillHorizontalStrip(p_listEventsToApply, p_strip, LOOP_STATE.LINKED);
		} else if (p_strip.notLinkedYet == 0) {
			this.deductionsFillHorizontalStrip(p_listEventsToApply, p_strip, LOOP_STATE.CLOSED);
		} else {
			x = p_strip.xMin;
			y = p_strip.y;
			undecidedChainTracker = {odd : [], even : [], currentChainLength : 0, numberClosableSpaces : 0};
			// Track all the "undecided chains"
			while (x <= p_strip.xMax && undecidedChainTracker.numberClosableSpaces <= p_strip.notClosedYet) {
				this.sniffNewSpace(undecidedChainTracker, x, y, x);
				x++;
			} 
			// Final chain
			if (undecidedChainTracker.currentChainLength > 0) {
				pushUndecidedChain(undecidedChainTracker, x);
			}
			// Close them
			if (undecidedChainTracker.numberClosableSpaces == p_strip.notClosedYet) {
				undecidedChainTracker.odd.forEach(indicationInOdd => {
					var x = indicationInOdd.first;
					for (i = 0; i < indicationInOdd.number; i++) {
						p_listEventsToApply.push(new SpaceEvent(x, y, LOOP_STATE.CLOSED));
						x+=2;
					}
				});
			}
			// Fail
			if (undecidedChainTracker.numberClosableSpaces < p_strip.notClosedYet) {
				return FILTER_FAILURE;
			} 
		}
	}	
}

/**
notClosedYet / notLinkedYet is at 0 in a strip, fill the events. One method per orientation.
*/
SolverYajilin.prototype.deductionsFillVerticalStrip = function(p_listEventsToApply, p_strip, p_state) {
	const x = p_strip.x;
	for (var y = p_strip.yMin ; y <= p_strip.yMax ; y++) {
		if (this.getLinkSpace(x, y) == LOOP_STATE.UNDECIDED) {
			p_listEventsToApply.push(new SpaceEvent(x, y, p_state));
		}
	}
}

SolverYajilin.prototype.deductionsFillHorizontalStrip = function(p_listEventsToApply, p_strip, p_state) {
	const y = p_strip.y;
	for (x = p_strip.xMin ; x <= p_strip.xMax ; x++) {
		if (this.getLinkSpace(x, y) == LOOP_STATE.UNDECIDED) {
			p_listEventsToApply.push(new SpaceEvent(x, y, p_state));
		}
	}
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
		pushUndecidedChain(p_undecidedChainTracker, p_decidedCoordinate);
		p_undecidedChainTracker.currentChainLength = 0;
	}
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

quickStartEventsClosure = function(p_solver) {
	return function(p_listQSEvents) { 
		p_listQSEvents.push({quickStartLabel : "Yajilin"});
		p_solver.cluesList.forEach(strip => {
			p_solver.deductionsTestStrip(p_listQSEvents, strip);
		});
		p_solver.deductionsQSBeforeAndAfter2Closed(p_listQSEvents);
	}
}

// -------------------
// Passing & multipassing (copied onto Yajikabe)
		
generateEventsForStripesAndUnionsClosure = function (p_solver) {
	return function (p_indexPass) {
		if (p_indexPass.category == LOOP_PASS_CATEGORY.YAJI_STRIP) {
			return p_solver.generateEventsForSingleStripPass(p_indexPass.index);
		} else {
			return p_solver.generateEventsForUnionStripPass(p_indexPass.index); 
		}
	}
}

SolverYajilin.prototype.generateEventsForSingleStripPass = function(p_indexStrip) {
	const clue = this.cluesList[p_indexStrip];
	var listPass = [];
	if ((clue.direction == DIRECTION.LEFT) || (clue.direction == DIRECTION.RIGHT)) {
		const y = clue.y;
		for (var x = clue.xMin ; x <= clue.xMax ; x++) {
			this.passSpace(listPass, x, y);
		}
	} else {
		const x = clue.x;
		for (var y = clue.yMin ; y <= clue.yMax ; y++) {
			this.passSpace(listPass, x, y);
		}
	}
	return listPass;
}

SolverYajilin.prototype.generateEventsForUnionStripPass = function(p_indexUnion) {
	const clue = this.unionsStripesList[p_indexUnion];
	var listPass = [];
	if ((clue.orientation == ORIENTATION.HORIZONTAL)) {
		const y = clue.y;
		for (var x = clue.xMin ; x <= clue.xMax ; x++) {
			this.passSpace(listPass, x, y);
		}
	} else {
		const x = clue.x;
		for (var y = clue.yMin ; y <= clue.yMax ; y++) {
			this.passSpace(listPass, x, y);
		}
	}
	return listPass;
}

SolverYajilin.prototype.passSpace = function(p_listPass, p_x, p_y) {
	if (this.getLinkSpace(p_x, p_y) == LOOP_STATE.UNDECIDED) {
		p_listPass.push([new SpaceEvent(p_x, p_y, LOOP_STATE.LINKED), new SpaceEvent(p_x, p_y, LOOP_STATE.CLOSED)]);		
	}
}

orderedListPassArgumentsClosureYajilin = function(p_solver) {
	return function() {
		var listIndexesPass = [];
		for (var i = 0 ; i < p_solver.cluesList.length ; i++) {
			if (p_solver.cluesList[i].union == null) {
				listIndexesPass.push({category : LOOP_PASS_CATEGORY.YAJI_STRIP, index : i}); // TODO possibility of adding more details for uncertainity
			} 
		}
		for (var i = 0 ; i < p_solver.unionsStripesList.length ; i++) {
			listIndexesPass.push({category : LOOP_PASS_CATEGORY.YAJI_UNION, index : i});
		}
		return listIndexesPass;
	}
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_indexPass) {
		if (p_indexPass.category == LOOP_PASS_CATEGORY.YAJI_UNION) {
			const uni = p_solver.unionsStripesList[p_indexPass.index];
			if (uni.orientation == ORIENTATION.VERTICAL) {
				return "(Stripes V " + uni.x + "," + uni.yMin + "-" + uni.yMax +")";
			} else {
				return "(Stripes H " + uni.xMin + "-" + uni.xMax + "," + uni.y +")";
			}
		} else {
			const str = p_solver.cluesList[p_indexPass.index];
			if (str.direction == DIRECTION.UP || str.direction == DIRECTION.DOWN) {
				return "(Strip V " + str.x + "," + str.yMin + "-" + str.yMax +")";
			} else {
				return "(Strip H " + str.xMin + "-" + str.xMax + "," + str.y +")";
			}
		}
	}
}
