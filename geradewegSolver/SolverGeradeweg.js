// Note : grand part of code is shared with Shingoki solver because of similarities

function SolverGeradeweg(p_valueGrid) {
	LoopSolver.call(this);
	this.construct(p_valueGrid);
}

SolverGeradeweg.prototype = Object.create(LoopSolver.prototype);
SolverGeradeweg.prototype.constructor = SolverGeradeweg;

function DummySolver() {
	return new SolverGeradeweg(generateSymbolArray(1, 1));
}

// Note : "pearl" is used in this puzzle and not "ball", like in Shingoki, because I used "pearl" for Shingoki and it's really similar.

SolverGeradeweg.prototype.construct = function(p_valueGrid) {
    this.xLength = p_valueGrid[0].length;
	this.yLength = p_valueGrid.length;
	this.loopSolverConstruct( 
	{	
		setEdgeLinkedPSAtomicDos : setEdgeLinkedPSAtomicDosClosure(this),
		setEdgeClosedPSAtomicDos : setEdgeClosedPSAtomicDosClosure(this),
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		otherPSAtomicUndos : otherAtomicUndosClosure(this),
		otherPSAtomicDos : otherAtomicDosClosure(this),
		otherPSDeductions : otherDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		PSFilters : [filterUpdateMinsClosure(this), filterPearlsClosure(this)],
		PSAbortMethods : [abortSolverGeradewegClosure(this)],
		passDefineTodoPSMethod : function(p_categoryPass) {
			const x = p_categoryPass.x;
			const y = p_categoryPass.y;
			return (this.linksArray[y][x].state != LOOP_STATE.CLOSED && this.linksArray[y][x].linkedDirections.length != 2);
		},
		
		generateEventsForPassPS : generateEventsForPassClosure(this),
		orderedListPassArgumentsPS : orderedListPassArgumentsClosureSolverPearly(this),
		namingCategoryPS : namingCategoryClosure(this),
		multipassPessimismPS : true
	});
	this.clueGrid = Grid_data(p_valueGrid);
	this.setResolution.searchSolutionMethod = loopNaiveSearchClosure(this);
	
	this.dataArray = [];
	this.pearlCoors = [];
	var chain;
	for (var y = 0 ; y < this.yLength ; y++) {
		this.dataArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			chain = this.clueGrid.get(x, y);
			if (chain != null) {	
				this.pearlCoors.push({x : x, y : y});
				this.dataArray[y].push({
					// High convention : directions 0123 assumption
					number : parseInt(chain, 10),
					maxes : [0, 0, 0, 0],
					mins : [0, 0, 0, 0],
					pearlsThatReachSameDir : [[], [], [], []] // "Onward" means all "dir (L|U|R|D)" entries will be from the space going (dir). Example : (1,2) has initial down max at 2 => (1,3) and (1,4) will have their PTRO (down) filled with (1,2)
				});
			} else {
				this.dataArray[y].push({
					number : null,
					pearlsThatReachSameDir : [[], [], [], []] 
				});
			}
		}
	}
	
	var i, value;
	var xs;
	for (var y = 0 ; y < this.yLength ; y++) {
		xs = [];
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.getNumber(x, y) != null) {
				xs.push(x);
			}
		}
		for (i = 0 ; i < xs.length ; i++) {
			x = xs[i];
			value = Math.min(this.getNumber(x, y), x); // First : value = min (number - 1, distance to wall). For other pearls, it depends... directions left/up/right/down are set from left/up/right/down to opposite direction. 
			if (i > 0) {
				value = this.setupPearlFromPrevious(x, y, xs[i-1], y, x-xs[i-1], DIRECTION.LEFT, value);
			}
			this.setMax(x, y, DIRECTION.LEFT, value); 
		}
		for (i = xs.length-1 ; i >= 0 ; i--) {
			x = xs[i];
			value = Math.min(this.getNumber(x, y), this.xLength-1-x);
			if (i <= xs.length-2) {
				value = this.setupPearlFromPrevious(x, y, xs[i+1], y, xs[i+1]-x, DIRECTION.RIGHT, value);
			}
			this.setMax(x, y, DIRECTION.RIGHT, value); 
		}
	}
	var ys;
	for (var x = 0 ; x < this.xLength ; x++) {
		ys = [];
		for (var y = 0 ; y < this.yLength ; y++) {
			if (this.getNumber(x, y) != null) {
				ys.push(y);
			}
		}
		for (i = 0 ; i < ys.length ; i++) {
			y = ys[i];
			value = Math.min(this.getNumber(x, y), y); 
			if (i > 0) {
				value = this.setupPearlFromPrevious(x, y, x, ys[i-1], y-ys[i-1], DIRECTION.UP, value);
			}
			this.setMax(x, y, DIRECTION.UP, value); 
		}
		for (i = ys.length-1 ; i >= 0 ; i--) {
			y = ys[i];
			value = Math.min(this.getNumber(x, y), this.yLength-1-y);
			if (i <= ys.length-2) {
				value = this.setupPearlFromPrevious(x, y, x, ys[i+1], ys[i+1]-y, DIRECTION.DOWN, value);
			}
			this.setMax(x, y, DIRECTION.DOWN, value); 
		}
	}
	
	this.pearlCoors.forEach(coors => {
		this.setupNodesThatReachSameDir(coors.x, coors.y);
	});
	this.checkerMinsToUpdate = new CheckCollectionDoubleEntryDirectional(this.xLength, this.yLength);
	this.checkerMinMaxes = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
}

SolverGeradeweg.prototype.setupNodesThatReachSameDir = function(p_x, p_y) {
	var min, deltaX, deltaY;
	KnownDirections.forEach(dir => {
		max = this.getMax(p_x, p_y, dir);
		deltaX = DeltaX[dir];
		deltaY = DeltaY[dir];
		for (var i = 0 ; i <= max; i++) {
			this.dataArray[p_y + deltaY*i][p_x + deltaX*i].pearlsThatReachSameDir[dir].push({x : p_x, y : p_y}); 
		}
	});
}

// Recalculate the max from the prvious val. Only relevant for a pearl that isn't the first of its row/column from the desired originDirection, 
// AND that is in reach of the value (distance wall, number-1)  . So Geradeweg-specific !
// Example if direction = left, then this means we go from left to right, xD,yD is the closest left node of x,y, whose max in direction originDirection should already have been treated
// x, y : original node
// xD, yD : node in the originDirection. 
// p_absDistance : absolute distance
// p_originDirection : direction of the origin
// p_value : the value supposed to be on the max eventually
SolverGeradeweg.prototype.setupPearlFromPrevious = function(p_x, p_y, p_xD, p_yD, p_absDist, p_originDirection, p_value) {
	if (p_absDist <= p_value) {		
		if (this.getNumber(p_xD, p_yD) == this.getNumber(p_x, p_y)) {
			p_value = Math.min(p_value, this.getMax(p_xD, p_yD, p_originDirection) + p_absDist);
		} else {
			p_value = Math.min(p_value, p_absDist - 1);
		}
	}
	return p_value;
}

// A few getters are in common part

// -------------------
// Input methods

SolverGeradeweg.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverGeradeweg.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverGeradeweg.prototype.emitHypothesisNode = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverGeradeweg.prototype.emitPassNode = function(p_x, p_y) {
	if (this.getNumber(p_x, p_y) != null) {
		return this.passLoop({passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y});
	} else {
		return this.passLoop({passCategory : LOOP_PASS_CATEGORY.GERADEWEG, x : p_x, y : p_y});
	}
}

SolverGeradeweg.prototype.makeMultipass = function() {
	this.multipassLoop();
}

solveAction = function (p_solver) {
	p_solver.resolve();
}

// -------------------
// Filters

// filterUpdateMinsClosure has been moved in common part

// For each pearl, update deductions from mins and maxes
// Mins consistent with links
// max cannot be lower than min (already detected by failure) 
// already made deductions between direct links and white/black pearls (white : one linked/closed link = deduces the 3 others, black : one linked/closed = deduces the opposite), though only at distance 0, not at distance 1, 2, 3...
function filterPearlsClosure(p_solver) {
	return function() {
		var listEvents = [];
		var x, y;
		var minDir, minDir2;
		p_solver.checkerMinMaxes.list.forEach(coors => {
			x = coors.x;
			y = coors.y;
			listEvents = p_solver.pearlDeductions(listEvents, x, y);
			
		});
		p_solver.cleanMinMaxes();
		return listEvents;
	}
}

SolverGeradeweg.prototype.cleanCheckMinsToUpdate = function() {
	this.checkerMinsToUpdate.clean();
}

SolverGeradeweg.prototype.cleanMinMaxes = function() {
	this.checkerMinMaxes.clean();
}

abortSolverGeradewegClosure = function(p_solver) {
	return function() {
		p_solver.cleanCheckMinsToUpdate();
		p_solver.cleanMinMaxes();
	}
}

// Used for QS and filter
// Not optimized at all but easily human-readable
SolverGeradeweg.prototype.pearlDeductions = function(p_listEvents, p_x, p_y) {
	number = this.getNumber(p_x, p_y);
	
	if (number == 1) {
		KnownDirections.forEach(dir => {
			if (this.getMax(p_x, p_y, dir) == 0) {
				p_listEvents.push(new MinRangeEvent(p_x, p_y, OppositeDirection[dir], 1));
			} 
			if (this.getMin(p_x, p_y, dir) == 1) {
				p_listEvents.push(new MaxRangeEvent(p_x, p_y, OppositeDirection[dir], 0)); // May be harmless in Quick start, hence a new event. (puzzle 43 with a max=0 on a 1. pearl)
			} 
		});
	} else {
		var dir90, dir180, dir270;
		[DIRECTION.LEFT, DIRECTION.UP].forEach(dir => {
			dir90 = TurningRightDirection[dir];
			dir180 = OppositeDirection[dir];
			dir270 = TurningLeftDirection[dir];
			maxDir180 = this.getMax(p_x, p_y, dir180);
			maxDir = this.getMax(p_x, p_y, dir);
			minDir180 = this.getMin(p_x, p_y, dir180);
			minDir = this.getMin(p_x, p_y, dir);
			if ( (maxDir + maxDir180) < number) { // It must cross the orthogonal direction
				p_listEvents.push(new MinRangeEvent(p_x, p_y, dir90, 1));
				p_listEvents.push(new MinRangeEvent(p_x, p_y, dir270, 1));
				p_listEvents.push(new MinRangeEvent(p_x, p_y, dir90, number-this.getMax(p_x, p_y, dir270) ));
				p_listEvents.push(new MaxRangeEvent(p_x, p_y, dir90, number-this.getMin(p_x, p_y, dir270) ));
				p_listEvents.push(new MinRangeEvent(p_x, p_y, dir270, number-this.getMax(p_x, p_y, dir90) ));
				p_listEvents.push(new MaxRangeEvent(p_x, p_y, dir270, number-this.getMin(p_x, p_y, dir90) ));
			}
			if (maxDir < number && maxDir180 < number) { // Neither direction can fully extend, which means it will be a straight line
				p_listEvents.push(new MaxRangeEvent(p_x, p_y, dir90, number-1));
				p_listEvents.push(new MaxRangeEvent(p_x, p_y, dir270, number-1)); 
			}
			if (maxDir == 0 && minDir180 > 0) { // A direction is blocked and the other one isn't  
				p_listEvents.push(new MinRangeEvent(p_x, p_y, dir180, number));
			}
			if (maxDir180 == 0 && minDir > 0) { // Same  
				p_listEvents.push(new MinRangeEvent(p_x, p_y, dir, number));
			}
			if (minDir + minDir180 == number) { // Straight line completed
				p_listEvents.push(new MaxRangeEvent(p_x, p_y, dir, minDir));
				p_listEvents.push(new MaxRangeEvent(p_x, p_y, dir180, minDir180));
			}
		});
		// If two orthogonal directions are null :
		// Or if one direction has a min > 0 and a max < number :
		KnownDirections.forEach(dir => {
			if (this.getMax(p_x, p_y, dir) == 0 && this.getMax(p_x, p_y, TurningLeftDirection[dir]) == 0) {  
				p_listEvents.push(new MinRangeEvent(p_x, p_y, OppositeDirection[dir], number));
				p_listEvents.push(new MinRangeEvent(p_x, p_y, TurningRightDirection[dir], number));
			}
			if (this.getMax(p_x, p_y, dir) < number && this.getMin(p_x, p_y, dir) > 0) {
				p_listEvents.push(new MinRangeEvent(p_x, p_y, OppositeDirection[dir], 1));
			}
		});
	}
	return p_listEvents;
}

// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_QSeventsList) { 
		var x, y;
		p_QSeventsList.push({quickStartLabel : "Geradeweg"});
		p_solver.pearlCoors.forEach(coors => {
			x = coors.x;
			y = coors.y;
			p_QSeventsList.push(new SpaceEvent(x, y, LOOP_STATE.LINKED));
			p_QSeventsList = p_solver.pearlDeductions(p_QSeventsList, x, y);
			if (p_solver.getNumber(x, y) == 1) {
				// See filter to understand why this is necessary. 
				p_solver.existingNeighborsDirections(x, y).forEach(dir => {
					if (p_solver.getMax(x, y, dir) == 0) {						
						p_QSeventsList.push(new LinkEvent(x, y, dir, LOOP_STATE.CLOSED));
					}
				});
			}
		});
		return p_QSeventsList;
	}
}