const NOT_FORCED = -1;

const STITCHES_PASS_KIND = {
	BORDER : 0,
	ROW : 1,
	COLUMN : 2
}

// Setup

function SolverStitches(p_wallArray, p_marginLeftArray, p_marginUpArray, p_boundNumber) {
	GeneralSolver.call(this);
	this.construct(p_wallArray, p_marginLeftArray, p_marginUpArray, p_boundNumber);
}

SolverStitches.prototype = Object.create(GeneralSolver.prototype);
SolverStitches.prototype.constructor = SolverStitches;

function DummySolver() {
	return new SolverStitches(generateWallArray(1, 1), [null], [null], 1);
}

SolverStitches.prototype.construct = function(p_wallArray, p_marginLeftArray, p_marginUpArray, p_boundNumber) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.numberBounds = p_boundNumber;
	this.methodsSetDeductions = new ApplyEventMethodPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};
	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryPassClosure(this)};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	
	this.gridWall = WallGrid_data(p_wallArray);
	this.borderLists = [];
	this.regionArray = this.gridWall.toRegionArray();
	this.rowsInfos = [];
	this.columnsInfos = [];
	this.numbersMarginsLeft = [];
	this.numbersMarginsUp = [];
	this.answerArray = generateFunctionValueArray(this.xLength, this.yLength, 
		function(){return {state : SPACE_STATE.UNDECIDED, right : LINK_STATE.CLOSED, down : LINK_STATE.CLOSED}});
	this.bordersDirectionsArray = [];
	this.triangleBorders = []; // Note : this array is rectangular but the non-null spaces are lower-diagonal triangles
	
	for (var i = 0 ; i < this.xLength ; i++) {
		this.numbersMarginsUp.push(p_marginUpArray[i]);
		this.columnsInfos.push({
			notPlacedYet : p_marginUpArray[i],
			notEmptiedYet : this.xLength - p_marginUpArray[i]
		});
	} 
	for (var i = 0 ; i < this.yLength ; i++) {
		this.numbersMarginsLeft.push(p_marginLeftArray[i]);
		this.rowsInfos.push({
			notPlacedYet : p_marginLeftArray[i],
			notEmptiedYet : this.yLength - p_marginLeftArray[i]
		});
	} 	// TODO : purify with banned spaces

	this.regionsNumber = numberOfRegions(this.regionArray);
	this.triangleBorders = getBordersTriangle(this.regionArray, this.regionsNumber);
	this.bordersDirectionsArray = getOtherRegionDirectionsArray(this.regionArray);
	
	// Transform triangleBorders from a list array into a logical array +
	// Make borders across regions undecided (because so far they are closed)
	for (var r1 = 0 ; r1 < this.regionsNumber; r1++) {
		for (var r2 = 0 ; r2 < r1 ; r2++) {
			if (this.triangleBorders[r1][r2].length == 0) {
				this.triangleBorders[r1][r2] = null;
			} else {
				var tmp = this.triangleBorders[r1][r2];
				this.triangleBorders[r1][r2] = {};
				this.triangleBorders[r1][r2].notClosedYet = tmp.length - this.numberBounds;
				this.triangleBorders[r1][r2].notLinkedYet = this.numberBounds;
				this.triangleBorders[r1][r2].listLinks = tmp;
				tmp.forEach(coorsDir => {
					if (coorsDir.direction == DIRECTION.RIGHT) {
						this.answerArray[coorsDir.y][coorsDir.x].right = LINK_STATE.UNDECIDED;
					} else {
						this.answerArray[coorsDir.y][coorsDir.x].down = LINK_STATE.UNDECIDED;
					}
				});
			}
		}
	}
	
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverStitches.prototype.getSpace = function(p_x, p_y) {
	return this.answerArray[p_y][p_x].state;
}

SolverStitches.prototype.setSpace = function(p_x, p_y, state) {
	this.answerArray[p_y][p_x].state = state;
}

SolverStitches.prototype.getLink = function(p_x, p_y, p_direction) {
	switch(p_direction) {
		case DIRECTION.LEFT : return this.answerArray[p_y][p_x-1].right; break;
		case DIRECTION.UP : return this.answerArray[p_y-1][p_x].down; break;
		case DIRECTION.RIGHT : return this.answerArray[p_y][p_x].right; break;
		case DIRECTION.DOWN : return this.answerArray[p_y][p_x].down; break;
	}		
}

SolverStitches.prototype.setLink = function(p_x, p_y, p_direction, p_state) {
	switch(p_direction) {
		case DIRECTION.LEFT : this.answerArray[p_y][p_x-1].right = p_state; break;
		case DIRECTION.UP : this.answerArray[p_y-1][p_x].down = p_state; break;
		case DIRECTION.RIGHT : this.answerArray[p_y][p_x].right = p_state; break;
		case DIRECTION.DOWN : this.answerArray[p_y][p_x].down = p_state; break;
	}		
}

SolverStitches.prototype.isSameRegionRight = function(p_x, p_y) {
	return (this.gridWall.getWallR(p_x, p_y) == WALLGRID.OPEN); // Note : manage banned spaces !
}

SolverStitches.prototype.isSameRegionDown = function(p_x, p_y) {
	return (this.gridWall.getWallD(p_x, p_y) == WALLGRID.OPEN); // Note : manage banned spaces ! Also, generalizable ?
}

// Supposes that p_ir1 != p_ir2
SolverStitches.prototype.getBorder = function(p_ir1, p_ir2) {
	if (p_ir1 < p_ir2) {
		return this.triangleBorders[p_ir2][p_ir1];
	}
	return this.triangleBorders[p_ir1][p_ir2];
}

SolverStitches.prototype.isExistingDifferentRegion = function(p_x, p_y, p_dir) {
	return this.neighborExists(p_x, p_y, p_dir) && (this.regionArray[p_y][p_x] != this.regionArray[p_y + DeltaY[p_dir]][p_x + DeltaX[p_dir]]);
}

//--------------------------------

// Input methods
SolverStitches.prototype.emitHypothesisSpace = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_symbol), this.methodsSetDeductions); // General solver call
}

SolverStitches.prototype.emitHypothesisDown = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesisSafe(new LinkEvent(p_x, p_y, DIRECTION.DOWN, p_symbol), this.methodsSetDeductions); // General solver call
}

SolverStitches.prototype.emitHypothesisRight = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesisSafe(new LinkEvent(p_x, p_y, DIRECTION.RIGHT, p_symbol), this.methodsSetDeductions); // General solver call
}

SolverStitches.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverStitches.prototype.makeQuickStart = function() { 
	this.quickStart();
}

SolverStitches.prototype.emitPassBorderRight = function(p_x, p_y) {
	if (this.isExistingDifferentRegion(p_x, p_y, DIRECTION.RIGHT)) {
		const index1 = this.regionArray[p_y][p_x];
		const index2 = this.regionArray[p_y + 1][p_x];
		this.passEventsSafe(this.generateEventsForBorderPass(index1, index2), {category : STITCHES_PASS_KIND.BORDER, index1 : index1, index2 : index2});
	}
}


SolverStitches.prototype.emitPassBorderDown = function(p_x, p_y) {
	if (this.isExistingDifferentRegion(p_x, p_y, DIRECTION.DOWN)) {
		const index1 = this.regionArray[p_y][p_x];
		const index2 = this.regionArray[p_y + 1][p_x];
		this.passEventsSafe(this.generateEventsForBorderPass(index1, index2), {category : STITCHES_PASS_KIND.BORDER, index1 : index1, index2 : index2});
	}
}

SolverStitches.prototype.emitPassRow = function(p_y) {
	this.passEventsSafe(this.generateEventsForRowPass(p_y), {category : STITCHES_PASS_KIND.ROW, y : p_y});
}

SolverStitches.prototype.emitPassColumn = function(p_x) {
	this.passEventsSafe(this.generateEventsForColumnPass(p_x), {category : STITCHES_PASS_KIND.COLUMN, x : p_x});
}

SolverStitches.prototype.makeMultiPass = function() {
	this.multiPassSafe(this.methodsSetMultipass);
}

//--------------------------------

// Doing and undoing
applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		if (isSpaceEvent(p_eventToApply)) {
			return p_solver.putSpace(p_eventToApply.x, p_eventToApply.y, p_eventToApply.symbol);
		}
		if (isLinkEvent(p_eventToApply)) {
			return p_solver.putLink(p_eventToApply.linkX, p_eventToApply.linkY, p_eventToApply.direction, p_eventToApply.state);
		} 
	}
}

SolverStitches.prototype.putSpace = function(p_x, p_y, p_symbol) {
	if (this.getSpace(p_x, p_y) == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.getSpace(p_x, p_y) != SPACE_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	if (p_symbol == SPACE_STATE.BUTTON) {
		this.rowsInfos[p_y].notPlacedYet--;
		this.columnsInfos[p_x].notPlacedYet--;
	} else {
		this.rowsInfos[p_y].notEmptiedYet--;
		this.columnsInfos[p_x].notEmptiedYet--;
	}
	this.answerArray[p_y][p_x].state = p_symbol;
	return EVENT_RESULT.SUCCESS;
}

SolverStitches.prototype.putLink = function(p_linkX, p_linkY, p_direction, p_state) {
	const oldState = this.getLink(p_linkX, p_linkY, p_direction);
	if (oldState == p_state) {
		return EVENT_RESULT.HARMLESS;
	}
	if (oldState != LINK_STATE.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	}
	// It's not setting time ! So let's go go go and assume regions are different !
	const r1 = this.regionArray[p_linkY][p_linkX];
	const r2 = this.regionArray[p_linkY + DeltaY[p_direction]][p_linkX + DeltaX[p_direction]];
	if (p_state == LINK_STATE.LINKED) {
		this.getBorder(r1, r2).notLinkedYet--;
	} else {
		this.getBorder(r1, r2).notClosedYet--;
	}
	this.setLink(p_linkX, p_linkY, p_direction, p_state);
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (isSpaceEvent(p_eventToUndo)) {
			const x = p_eventToUndo.x;
			const y = p_eventToUndo.y;
			const state = p_eventToUndo.symbol;
			if (state == SPACE_STATE.BUTTON) {
				p_solver.rowsInfos[y].notPlacedYet++;
				p_solver.columnsInfos[x].notPlacedYet++;
			} else {
				p_solver.rowsInfos[y].notEmptiedYet++;
				p_solver.columnsInfos[x].notEmptiedYet++;
			}
			p_solver.answerArray[y][x].state = SPACE_STATE.UNDECIDED;
		} else {
			const lx = p_eventToUndo.linkX;
			const ly = p_eventToUndo.linkY;
			const dir = p_eventToUndo.direction;
			const r1 = p_solver.regionArray[ly][lx];
			const r2 = p_solver.regionArray[ly + DeltaY[dir]][lx + DeltaX[dir]];
			if (p_eventToUndo.state == LINK_STATE.LINKED) {
				p_solver.getBorder(r1, r2).notLinkedYet++;
			} else {
				p_solver.getBorder(r1, r2).notClosedYet++;
			}
			p_solver.setLink(lx, ly, dir, LINK_STATE.UNDECIDED);
		}
	}
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Stitches"}];
		for (var ri1 = 0 ; ri1 < p_solver.regionsNumber ; ri1 ++) {
			for (var ri2 = 0 ; ri2 < ri1; ri2 ++) {
				if (p_solver.getBorder(ri1, ri2) != null) {				
					 p_solver.deductionsMayFindBreachInBorder(listQSEvents, ri1, ri2);
				}
			}
		}
		for (var x = 0 ; x < p_solver.xLength ; x++) {
			if (p_solver.columnsInfos[x].notPlacedYet == 0) {					
				 p_solver.deductionsFillColumn(listQSEvents, x, SPACE_STATE.EMPTY);
			}
			if (p_solver.columnsInfos[x].notEmptiedYet == 0) {					
				 p_solver.deductionsFillColumn(listQSEvents, x, SPACE_STATE.BUTTON);
			}
		}
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			if (p_solver.rowsInfos[y].notPlacedYet == 0) {					
				 p_solver.deductionsFillRow(listQSEvents, y, SPACE_STATE.EMPTY);
			}
			if (p_solver.rowsInfos[y].notEmptiedYet == 0) {					
				 p_solver.deductionsFillRow(listQSEvents, y, SPACE_STATE.BUTTON);
			}
		}
		// Check all spaces out (it's not intelligence, is it ?)
		var innerSpace;
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			for (var x = 0 ; x < p_solver.xLength ; x++) {
				innerSpace = true;
				KnownDirections.forEach(dir => {
					if (p_solver.neighborExists(x, y, dir) && (p_solver.regionArray[y][x] != p_solver.regionArray[y + DeltaY[dir]][x + DeltaX[dir]])) {	// Note : not totally smart + doesn't take banned spaces into account
						innerSpace = false; 
					}
				});
				if (innerSpace) {
					listQSEvents.push(new SpaceEvent(x, y, SPACE_STATE.EMPTY));
				}
			}
		}
		return listQSEvents;
	}
}

//--------------------------------

// Intelligence

// Deductions closure. Where intelligence begins !
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (isSpaceEvent(p_eventBeingApplied)) {
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const symbol = p_eventBeingApplied.symbol; // Note : Well, symbol doesn't need to be saved in events but it's practical, plus it doesn't take too much space...
			if (symbol == SPACE_STATE.BUTTON) {
				if (p_solver.rowsInfos[y].notPlacedYet == 0) {					
					p_solver.deductionsFillRow(p_listEventsToApply, y, SPACE_STATE.EMPTY);
				}
				if (p_solver.columnsInfos[x].notPlacedYet == 0) {					
					p_solver.deductionsFillColumn(p_listEventsToApply, x, SPACE_STATE.EMPTY);
				}
				// A space has only one border possible ? Link it !
				var oneDirection = null;
				var moreThanOne = false;
				var thelink;
				p_solver.bordersDirectionsArray[y][x].forEach(dir => {
					theLink = p_solver.getLink(x, y, dir);
					if (theLink != LINK_STATE.CLOSED) {
						if (oneDirection != null ) {
							moreThanOne = true;
						} else {
							oneDirection = dir;
						}
					}
				});
				if (oneDirection != null && !moreThanOne) {
					p_listEventsToApply.push(new LinkEvent(x, y, oneDirection, LINK_STATE.LINKED));
				}
			} else {
				if (p_solver.rowsInfos[y].notEmptiedYet == 0) {					
					p_solver.deductionsFillRow(p_listEventsToApply, y, SPACE_STATE.BUTTON); 
				}
				if (p_solver.columnsInfos[x].notEmptiedYet == 0) {					
					p_solver.deductionsFillColumn(p_listEventsToApply, x, SPACE_STATE.BUTTON);
				}
				// Space was near a region boundary ? Close that link !
				p_solver.bordersDirectionsArray[y][x].forEach(dir => {
					p_listEventsToApply.push(new LinkEvent(x, y, dir, LINK_STATE.CLOSED));
				});
			}
		} else {
			const x = p_eventBeingApplied.linkX;
			const y = p_eventBeingApplied.linkY;
			const state = p_eventBeingApplied.state;
			const dir = p_eventBeingApplied.direction;
			const dx = x + DeltaX[dir];
			const dy = y + DeltaY[dir];
			const r1 = p_solver.regionArray[y][x];
			const r2 = p_solver.regionArray[dy][dx];
			if (state == LINK_STATE.LINKED) {
				p_listEventsToApply.push(new SpaceEvent(x, y, SPACE_STATE.BUTTON));
				p_listEventsToApply.push(new SpaceEvent(dx, dy, SPACE_STATE.BUTTON));
				const border = p_solver.getBorder(r1, r2);
				if ((border.notClosedYet > 0) && (border.notLinkedYet == 0)) {				
					p_solver.deductionsFillBorder(p_listEventsToApply, border, LINK_STATE.CLOSED);
				}
				// Close all other links in both spaces
				p_solver.bordersDirectionsArray[y][x].forEach(dir2 => {
					if (dir2 != dir) {						
						p_listEventsToApply.push(new LinkEvent(x, y, dir2, LINK_STATE.CLOSED));
					}
				});
				p_solver.bordersDirectionsArray[dy][dx].forEach(dir2 => {
					if (dir2 != OppositeDirection[dir]) {						
						p_listEventsToApply.push(new LinkEvent(dx, dy, dir2, LINK_STATE.CLOSED));
					}
				});
			} else {
				p_solver.deductionsMayFindBreachInBorder(p_listEventsToApply, r1, r2);
				p_solver.deductionsOneOrNoBorderReachable(p_listEventsToApply, x, y);
				p_solver.deductionsOneOrNoBorderReachable(p_listEventsToApply, dx, dy);
			}
		}
	}
}

// We closed a link. If there is no border available, close the spaces. If there is one border BUT it has a button, link that link.
SolverStitches.prototype.deductionsOneOrNoBorderReachable = function(p_listEventsToApply, p_x, p_y) {
	var moreThanOne = false;
	var oneDirection = null;
	this.bordersDirectionsArray[p_y][p_x].forEach(dir => {
		theLink = this.getLink(p_x, p_y, dir);
		if (theLink != LINK_STATE.CLOSED) {
			if (oneDirection != null ) {
				moreThanOne = true;
			} else {
				oneDirection = dir;
			}
		}
	});
	if (oneDirection == null) {
		p_listEventsToApply.push(new SpaceEvent(p_x, p_y, SPACE_STATE.EMPTY));
	} else if (!moreThanOne && this.getSpace(p_x, p_y) == SPACE_STATE.BUTTON) {
		p_listEventsToApply.push(new LinkEvent(p_x, p_y, oneDirection, LINK_STATE.LINKED));
	}
}

function spaceClosure(p_solver) { return function(p_x, p_y) { return p_solver.answerArray[p_y][p_x].state }}
function eventClosure(p_symbol) { return function(p_x, p_y) { return new SpaceEvent(p_x, p_y, p_symbol)}}

SolverStitches.prototype.deductionsFillRow = function(p_listEventsToApply, p_y, p_symbolToFill) {
	return this.deductionsFillingRow(p_listEventsToApply, p_y, spaceClosure(this), SPACE_STATE.UNDECIDED, eventClosure(p_symbolToFill));
}

SolverStitches.prototype.deductionsFillColumn = function(p_listEventsToApply, p_x, p_symbolToFill) {
	return this.deductionsFillingColumn(p_listEventsToApply, p_x, spaceClosure(this), SPACE_STATE.UNDECIDED, eventClosure(p_symbolToFill));
}

SolverStitches.prototype.deductionsMayFindBreachInBorder = function(p_listEventsToApply, p_r1, p_r2) {
	const border = this.getBorder(p_r1, p_r2);
	if ((border.notClosedYet == 0) && (border.notLinkedYet > 0)) {
		return this.deductionsFillBorder(p_listEventsToApply, border, LINK_STATE.LINKED);
	}
}

SolverStitches.prototype.deductionsFillBorder = function(p_listEventsToApply, p_border, p_value) {
	p_border.listLinks.forEach(theLink => {
		if (this.getLink(theLink.x, theLink.y, theLink.direction) == LINK_STATE.UNDECIDED) {
			p_listEventsToApply.push(new LinkEvent(theLink.x, theLink.y, theLink.direction, p_value));
		}
	});
}

// --------------------
// Passing

generateEventsForPassClosure = function(p_solver) {
	return function(p_indexPass) {
		switch (p_indexPass.category) {
			case STITCHES_PASS_KIND.BORDER : return p_solver.generateEventsForBorderPass(p_indexPass.index1, p_indexPass.index2);
			case STITCHES_PASS_KIND.ROW : return p_solver.generateEventsForRowPass(p_indexPass.y);
			case STITCHES_PASS_KIND.COLUMN : return p_solver.generateEventsForColumnPass(p_indexPass.x);
		};
	}
}

// Generate covering events for "region pass".
SolverStitches.prototype.generateEventsForBorderPass = function(p_ri1, p_ri2) {
	var eventList = [];
	this.getBorder(p_ri1, p_ri2).listLinks.forEach(theLink => {
		const x = theLink.x;
		const y = theLink.y;
		const dir = theLink.direction;
		if (this.getLink(x, y, dir) == LINK_STATE.UNDECIDED) {
			eventList.push([new LinkEvent(x, y, dir, LINK_STATE.LINKED), new LinkEvent(x, y, dir, LINK_STATE.CLOSED)]);
		}
	});
	return eventList;
}

SolverStitches.prototype.generateEventsForRowPass = function(p_y) {
	var eventList = [];
	for(var x = 0; x < this.xLength ; x++) {
		if (this.getSpace(x, p_y) == SPACE_STATE.UNDECIDED) {
			eventList.push([new SpaceEvent(x, p_y, SPACE_STATE.BUTTON), new SpaceEvent(x, p_y, SPACE_STATE.EMPTY)]);
		}
	}
	return eventList;
}

SolverStitches.prototype.generateEventsForColumnPass = function(p_x) {
	var eventList = [];
	for(var y = 0; y < this.yLength ; y++) {
		if (this.getSpace(p_x, y) == SPACE_STATE.UNDECIDED) {
			eventList.push([new SpaceEvent(p_x, y, SPACE_STATE.BUTTON), new SpaceEvent(p_x, y, SPACE_STATE.EMPTY)]);
		}
	}
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}



namingCategoryPassClosure = function(p_solver) {
	return function(p_indexPass) {
		switch (p_indexPass.category) {
			case STITCHES_PASS_KIND.BORDER : return "Border between " + p_indexPass.index1 + " and " + p_indexPass.index2 ; break;
			case STITCHES_PASS_KIND.ROW : return "Row " + p_indexPass.y; break;
			case STITCHES_PASS_KIND.COLUMN : return "Column " + p_indexPass.x; break;
			default : return "";
		}
	}
}

// Copied onto LoopSolver
comparison = function(p_event1, p_event2) {
	const cEvent1 = convertLinkEvent(p_event1);
	const cEvent2 = convertLinkEvent(p_event2); 
	const k1 = (isLinkEvent(cEvent1) ? 1 : 0);
	const k2 = (isLinkEvent(cEvent2) ? 1 : 0);
	return commonComparisonMultiKinds([0, 1], 
		[[cEvent1.y, cEvent1.x, cEvent1.symbol], [cEvent2.y, cEvent2.x, cEvent2.symbol], 
		[cEvent1.linkY, cEvent1.linkX, cEvent1.direction, cEvent1.state], [cEvent2.linkY, cEvent2.linkX, cEvent2.direction, cEvent2.state]], 
		k1, k2);
}

// Not so ordered... but puzzles are still simple so far !
orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var listIndexesPass = [];
		for (var y = 0 ; y < p_solver.yLength ; y++) {
			listIndexesPass.push({category : STITCHES_PASS_KIND.ROW, y : y});
		}
		for (var x = 0 ; x < p_solver.xLength ; x++) {
			listIndexesPass.push({category : STITCHES_PASS_KIND.COLUMN, x : x});
		}
		for (var ir = 0 ; ir < p_solver.regionsNumber ; ir++) {
			for (var ir2 = 0 ; ir2 < ir ; ir2++) {
				if (p_solver.getBorder(ir, ir2) != null) {					
					listIndexesPass.push({category : STITCHES_PASS_KIND.BORDER, index1 : ir, index2 : ir2});
				}
			}
		}
		return listIndexesPass;
	}
}