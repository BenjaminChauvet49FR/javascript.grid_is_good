// Note : grand part of code is shared with Geradeweg solver because of similarities

const SHINGOKI_PEARL = { 
	BLACK : 0,
	WHITE : 1
}

function SolverShingoki(p_valueGrid) {
	LoopSolver.call(this);
	this.construct(p_valueGrid);
}

SolverShingoki.prototype = Object.create(LoopSolver.prototype);
SolverShingoki.prototype.constructor = SolverShingoki;

function DummySolver() {
	return new SolverShingoki(generateSymbolArray(1, 1)); //Note : who needs drawed dummy solvers with dotted grids ? 
}

SolverShingoki.prototype.construct = function(p_valueGrid) {
    this.xLength = p_valueGrid[0].length;
	this.yLength = p_valueGrid.length;
	this.isShingokiSolver = true;
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
		PSAbortMethods : [abortSolverShingokiClosure(this)],
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
				if (chain.charAt(0) == "W") {
					colour = SHINGOKI_PEARL.WHITE;
				} else {
					colour = SHINGOKI_PEARL.BLACK;
				}
				this.dataArray[y].push({
					// High convention : directions 0123 assumption
					pearl : colour,
					number : parseInt(chain.substring(1), 10),
					maxes : [0, 0, 0, 0],
					mins : [0, 0, 0, 0],
					pearlsThatReachSameDir : [[], [], [], []] // "Onward" means all "dir (L|U|R|D)" entries will be from the space going (dir). Example : (1,2) has initial down max at 2 => (1,3) and (1,4) will have their PTRO (down) filled with (1,2)
				});
			} else {
				this.dataArray[y].push({
					pearl : null,
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
			if (this.getColourPearl(x, y) != null) {
				xs.push(x);
			}
		}
		for (i = 0 ; i < xs.length ; i++) {
			x = xs[i];
			value = Math.min(this.getNumber(x, y)-1, x); // First : value = min (number - 1, distance to wall). For other pearls, it depends... directions left/up/right/down are set from left/up/right/down to opposite direction. 
			if (i > 0) {
				value = this.setupPearlFromPrevious(x, y, xs[i-1], y, x-xs[i-1], DIRECTION.LEFT, value);
			}
			this.setMax(x, y, DIRECTION.LEFT, value); 
		}
		for (i = xs.length-1 ; i >= 0 ; i--) {
			x = xs[i];
			value = Math.min(this.getNumber(x, y)-1, this.xLength-1-x);
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
			if (this.getColourPearl(x, y) != null) {
				ys.push(y);
			}
		}
		for (i = 0 ; i < ys.length ; i++) {
			y = ys[i];
			value = Math.min(this.getNumber(x, y)-1, y); 
			if (i > 0) {
				value = this.setupPearlFromPrevious(x, y, x, ys[i-1], y-ys[i-1], DIRECTION.UP, value);
			}
			this.setMax(x, y, DIRECTION.UP, value); 
		}
		for (i = ys.length-1 ; i >= 0 ; i--) {
			y = ys[i];
			value = Math.min(this.getNumber(x, y)-1, this.yLength-1-y);
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
	
	// For debug
	this.getListPearls(true);
	
}

SolverShingoki.prototype.setupNodesThatReachSameDir = function(p_x, p_y) {
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
// AND that is in reach of the value (distance wall, number-1)  . So Shingoki-specific !
// Example if direction = left, then this means we go from left to right, xD,yD is the closest left node of x,y, whose max in direction originDirection should already have been treated
// x, y : original node
// xD, yD : node in the originDirection. 
// p_absDistance : absolute distance
// p_originDirection : direction of the origin
// p_value : the value supposed to be on the max eventually
SolverShingoki.prototype.setupPearlFromPrevious = function(p_x, p_y, p_xD, p_yD, p_absDist, p_originDirection, p_value) {
	if (p_absDist <= p_value) {		
		if (this.getColourPearl(p_x, p_y) == SHINGOKI_PEARL.WHITE) { // p_x, p_y is white
			if (this.getColourPearl(p_xD, p_yD) == SHINGOKI_PEARL.WHITE) { // p_xD, p_yD is white
				if (this.getNumber(p_xD, p_yD) == this.getNumber(p_x, p_y)) {
					p_value = Math.min(p_value, this.getMax(p_xD, p_yD, p_originDirection) + p_absDist);
				} else {
					p_value = Math.min(p_value, p_absDist - 1);
				}
			} else { // p_xD, p_yD is black
				p_value = Math.min(p_value, p_absDist);
				// If it is possible to reach the black pearl but its value too small
				if (p_value >= this.getNumber(p_xD, p_yD)) {
					p_value--;
				} else {					
					p_value = Math.min(p_value, this.getNumber(p_xD, p_yD)-1); // What went wrong on QS of 3128709 ? Down max in south 20,11 wrongly initialized
				}
			}
		} else { // p_x, p_y is black
			if (this.getColourPearl(p_xD, p_yD) == SHINGOKI_PEARL.WHITE) { // p_xD, p_yD is white
				if (this.getMax(p_xD, p_yD, p_originDirection) == 0) { // Case of edges, but not only
					p_value = Math.min(p_value, p_absDist-1);
				} else if (this.getNumber(p_xD, p_yD)-1 < p_absDist) { // White number too little to accept the distance between both spaces
					p_value = Math.min(p_value, p_absDist-1);
				} else {					
					p_value = Math.min(p_value, p_absDist + this.getMax(p_xD, p_yD, p_originDirection)); // Suboptimal because getMax may be = 0 but hey, QS will do the job
				}
			} else { // p_xD, p_yD is black
				p_value = Math.min(p_value, p_absDist);
				if (p_value == p_absDist && this.getNumber(p_xD, p_yD) <= p_absDist) {
					p_value--;
				}
			}
		}
	}
	return p_value;
}

// Warning : values in hard. Duplicated in other puzzles.

SolverShingoki.prototype.getColourPearl = function(p_x, p_y) { 
	return this.dataArray[p_y][p_x].pearl;
}

// Purely debug
SolverShingoki.prototype.getListPearls = function(p_inhibReminder) {
	this.listPearls = [];
	var data;
	var label;
	this.pearlCoors.forEach(coors => {
		data = this.dataArray[coors.y][coors.x];
		
		this.listPearls.push({coors : coors.x+","+coors.y, 
		pearl : data.pearl,
		number : data.number,
		startMaxes : data.maxes[DIRECTION.LEFT]+"-"+data.maxes[DIRECTION.UP]+"-"+data.maxes[DIRECTION.RIGHT]+"-"+data.maxes[DIRECTION.DOWN]})
	});
	if (!p_inhibReminder) {		
		console.log("this.listPearls is the list");
	}
	return this.listPearls;
}

// A few getters are in common part

// -------------------
// Input methods

SolverShingoki.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverShingoki.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverShingoki.prototype.emitHypothesisNode = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverShingoki.prototype.emitPassNode = function(p_x, p_y) {
	if (this.getColourPearl(p_x, p_y) == null) {
		return this.passLoop({passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y});
	} else {
		return this.passLoop({passCategory : LOOP_PASS_CATEGORY.PEARLY, x : p_x, y : p_y});
	}
}

SolverShingoki.prototype.makeMultipass = function() {
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
		var maxMax, actualMin, expectedMin;
		p_solver.checkerMinMaxes.list.forEach(coors => {
			x = coors.x;
			y = coors.y;
			number = p_solver.getNumber(x, y);
			// High convention : directions 0123 assumption "pivot"
			// Min and max = 1 or 0 already handled for both black and white in deductions (already done !)
			if (p_solver.getColourPearl(x, y) == SHINGOKI_PEARL.WHITE) {
				for (var pivot = 0 ; pivot <= 1 ; pivot++) {	
					if (p_solver.getMax(x, y, DIRECTION.LEFT+pivot) + p_solver.getMax(x, y, DIRECTION.RIGHT+pivot) < number) {
						if (p_solver.neighborExists(x, y, DIRECTION.LEFT+pivot)) {						
							listEvents.push(new LinkEvent(x, y, DIRECTION.LEFT+pivot, LOOP_STATE.CLOSED));
						} else {
							listEvents.push(new LinkEvent(x, y, DIRECTION.RIGHT+pivot, LOOP_STATE.CLOSED));
						}
					}
					if (p_solver.getMin(x, y, DIRECTION.LEFT+pivot) > 0) { // Right is here too.
						[DIRECTION.LEFT+pivot, DIRECTION.RIGHT+pivot].forEach(dir => {
							listEvents.push(new MinRangeEvent(x, y, OppositeDirection[dir], number-p_solver.getMax(x, y, dir) ));
							listEvents.push(new MaxRangeEvent(x, y, OppositeDirection[dir], number-p_solver.getMin(x, y, dir) ));
						});
					}
				}
			} else { // Black !
				
				for (var pivot = 0 ; pivot <= 1 ; pivot++) {					
					maxMax = Math.max(p_solver.getMax(x, y, DIRECTION.LEFT+pivot), p_solver.getMax(x, y, DIRECTION.RIGHT+pivot));
					actualMin = Math.max(p_solver.getMin(x, y, DIRECTION.LEFT+pivot), p_solver.getMin(x, y, DIRECTION.RIGHT+pivot)); // Note : one of them will be 0 anyway
					expectedMin = number - maxMax;
					[DIRECTION.UP + pivot, (DIRECTION.DOWN + pivot)%4].forEach(dir => {
						if (p_solver.getMin(x, y, dir) > 0) {						
							listEvents.push(new MinRangeEvent(x, y, dir, expectedMin)); // If a direction is open, push the expected min (according to ortho. directions) into it.
							requiredMinForExtend = number - p_solver.getMax(x, y, dir);
							[DIRECTION.LEFT + pivot, DIRECTION.RIGHT + pivot].forEach(dirOrtho => {
								if (p_solver.getMax(x, y, dirOrtho) < requiredMinForExtend) { // If in one of the orthogonal directions we can't extend enough, go for the remaining ortho. direction
									listEvents.push(new MinRangeEvent(x, y, OppositeDirection[dirOrtho], requiredMinForExtend));
								}
								if (p_solver.getMin(x, y, dirOrtho) > 0) {
									// May be suboptimal but hey, it works just like white !
									listEvents.push(new MinRangeEvent(x, y, dirOrtho, number-p_solver.getMax(x, y, dir) ));
									listEvents.push(new MaxRangeEvent(x, y, dirOrtho, number-p_solver.getMin(x, y, dir) ));
									listEvents.push(new MinRangeEvent(x, y, dir, number-p_solver.getMax(x, y, dirOrtho) ));
									listEvents.push(new MaxRangeEvent(x, y, dir, number-p_solver.getMin(x, y, dirOrtho) ));
								}
							});
						}
						if (expectedMin > p_solver.getMax(x, y, dir)) {
							listEvents.push(new MinRangeEvent(x, y, OppositeDirection[dir], expectedMin ));
						}
						listEvents.push(new MaxRangeEvent(x, y, dir, number-actualMin)); // Will be done for all 4 directions
					});
				}
			}
			// Note : nothing about white pearls in extension of black pearls, but it should be done on setup.
		});
		p_solver.cleanMinMaxes();
		return listEvents;
	}
}

SolverShingoki.prototype.cleanCheckMinsToUpdate = function() {
	this.checkerMinsToUpdate.clean();
}

SolverShingoki.prototype.cleanMinMaxes = function() {
	this.checkerMinMaxes.clean();
}

abortSolverShingokiClosure = function(p_solver) {
	return function() {
		p_solver.cleanCheckMinsToUpdate();
		p_solver.cleanMinMaxes();
	}
}

// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) { 
	return function(p_QSeventsList) { 
		p_QSeventsList.push({quickStartLabel : "Shingoki"});
		var existLeft, existUp, existRight, existDown, position, x, y;
		p_solver.pearlCoors.forEach(coors => {
			x = coors.x;
			y = coors.y;
			p_QSeventsList.push(new SpaceEvent(x, y, LOOP_STATE.LINKED));
			p_QSeventsList = p_solver.edgeGridReactionDeductions(p_QSeventsList, x, y, p_solver.getColourPearl(x, y) == SHINGOKI_PEARL.WHITE ? LOOP_STATE.CLOSED : LOOP_STATE.LINKED);
		});
		return p_QSeventsList;
	}
}

SolverShingoki.prototype.edgeGridReactionDeductions = function(p_eventList, p_x, p_y, p_stateToApply) {
	KnownDirections.forEach(dir => {
		if (!this.neighborExists(p_x, p_y, dir)) {
			p_eventList.push(new LinkEvent(p_x, p_y, OppositeDirection[dir], p_stateToApply));
		}
	});
	return p_eventList;
}

