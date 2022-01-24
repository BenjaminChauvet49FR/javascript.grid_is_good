function SolverCastleWall(p_valueGrid) {
	LoopSolver.call(this);
	this.construct(p_valueGrid);
}

const CW_POSITION = {
	INNER : 1,
	OUTER : 0,
	UNDECIDED : -1
}

const NOT_YET = {
	CLOSED : 1,
	LINKED : 0
}

LOOP_PASS_CATEGORY.CW_HORIZ = -1;
LOOP_PASS_CATEGORY.CW_VERT = -2;

function otherCWPosition(p_position) {
	return 1-p_position;
}

SolverCastleWall.prototype = Object.create(LoopSolver.prototype);
SolverCastleWall.prototype.constructor = SolverCastleWall;

function DummySolver() {
	return new SolverCastleWall(generateSymbolArray(1, 1));
}

SolverCastleWall.prototype.construct = function(p_valueGrid) {
    this.xLength = p_valueGrid[0].length;
	this.yLength = p_valueGrid.length;
	this.loopSolverConstruct( 
	{	
		setEdgeLinkedPSAtomicDos : setEdgeLinkedPSAtomicDosClosure(this),
		setEdgeLinkedPSAtomicUndos : setEdgeLinkedPSAtomicUndosClosure(this),
		setEdgeClosedPSAtomicDos : setEdgeClosedPSAtomicDosClosure(this),
		setEdgeClosedPSAtomicUndos : setEdgeClosedPSAtomicUndosClosure(this),
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		otherPSAtomicUndos : otherAtomicUndosClosure(this),
		otherPSAtomicDos : otherAtomicDosClosure(this),
		otherPSDeductions : otherDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		PSFilters : [filterStripsClosure(this)],
		PSAbortMethods : [abortCastleWallClosure(this)],
		
		generateEventsForPassPS : generateEventsForPassClosure(this),
		orderedListPassArgumentsPS : orderedListPassArgumentsClosureCastleWall(this),
		namingCategoryPS : namingCategoryClosure(this),
		multipassPessimismPS : true,
		comparisonPS : comparisonCastleWallMethod
	});
	this.yLastMeshIndex = this.yLength-2;
	this.xLastMeshIndex = this.xLength-2;
	this.clueGrid = Grid_data(p_valueGrid);
	
	this.innerOuterRDArray = generateValueArray(this.xLength, this.yLength, CW_POSITION.UNDECIDED);
	this.horizLinesArray = generateFunctionValueArray(this.xLength-1, this.yLength, function() {return []});
	this.vertLinesArray = generateFunctionValueArray(this.xLength, this.yLength-1, function() {return []}); 
	var direction;
	this.obstaclesNodes = [];
	this.horizLinesList = [];
	this.vertLinesList = [];
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.clueGrid.get(x, y) != null) {
				this.banSpace(x, y);	// Required for quick start : we must know at the very beginning that some links are closed for "not yet" completion			
				this.obstaclesNodes.push({x : x, y : y});
			}
		}
	}
	var x, y, xx, yy, dir, number, amount;
	this.obstaclesNodes.forEach(coors => {
		x = coors.x;
		y = coors.y;
		dir = this.getDirection(x, y);
		number = this.getNumber(x, y);
		if (dir == DIRECTION.RIGHT) {
			amount = 0;
			var lx = x + 1; // lx = left of link position
			while ((lx <= this.xLength-2) && (!this.isBanned(lx, y) || this.getDirection(lx, y) != dir)) {
				if (!this.isBanned(lx, y) && !this.isBanned(lx+1, y)) {
					amount++;
					this.horizLinesArray[y][lx].push(this.horizLinesList.length);
				}
				lx++;
			}
			if (this.isBanned(lx, y) && this.getDirection(lx, y) == dir) {
				number -= this.getNumber(lx, y);
			}
			// Now, lx = xLength-1 so can't be left link, or (lx, y) has an obstacle that looks right
			this.horizLinesList.push({notYet : [number, amount-number], // Note : assumes that "linked = 0 and closed = 1 or something like this"; maybe a big convention for later ?
				firstXLeftLink : x+1, lastXLeftLink : lx-1, y : y}); 
		} else if (dir == DIRECTION.LEFT) {
			amount = 0;
			var rx = x - 1; 
			while ((rx >= 1) && (!this.isBanned(rx, y) || this.getDirection(rx, y) != dir)) {
				if (!this.isBanned(rx, y) && !this.isBanned(rx-1, y)) {
					amount++;
					this.horizLinesArray[y][rx-1].push(this.horizLinesList.length);// -1 here ! because rx comes from the right
				}
				rx--;
			}
			if (this.isBanned(rx, y) && this.getDirection(rx, y) == dir) {
				number -= this.getNumber(rx, y);
			}
			this.horizLinesList.push({notYet : [number, amount-number], 
				//firstXRightLink : x-1, lastXRightLink : rx+1, y : y});  
				firstXLeftLink : rx, lastXLeftLink : x-2, y : y});  
		}
		
		if (dir == DIRECTION.DOWN) {
			amount = 0;
			var uy = y + 1; 
			while ((uy <= this.yLength-2) && (!this.isBanned(x, uy) || this.getDirection(x, uy) != dir)) {
				if (!this.isBanned(x, uy) && !this.isBanned(x, uy+1)) {
					amount++;
					this.vertLinesArray[uy][x].push(this.vertLinesList.length);
				}
				uy++;
			}
			if (this.isBanned(x, uy) && this.getDirection(x, uy) == dir) {
				number -= this.getNumber(x, uy);
			}
			this.vertLinesList.push({notYet : [number, amount-number], // Note : assumes that "linked = 0 and closed = 1 or something like this"; maybe a big convention for later ?
				firstYUpLink : y+1, lastYUpLink : uy-1, x : x}); 
		} else if (dir == DIRECTION.UP) {
			amount = 0;
			var dy = y - 1; 
			while ((dy >= 1) && (!this.isBanned(x, dy) || this.getDirection(x, dy) != dir)) {
				if (!this.isBanned(x, dy) && !this.isBanned(x, dy-1)) {
					amount++;
					this.vertLinesArray[dy-1][x].push(this.vertLinesList.length);// -1 here ! because rx comes from the right
				}
				dy--;
			}
			if (this.isBanned(x, dy) && this.getDirection(x, dy) == dir) {
				number -= this.getNumber(x, dy);
			}
			this.vertLinesList.push({notYet : [number, amount-number], 
				firstYUpLink : dy, lastYUpLink : y-2, x : x});  
		}
		
		
	});
	
	this.checkerHorizLink = new CheckCollection(this.horizLinesList.length);
	this.checkerVertLink = new CheckCollection(this.vertLinesList.length);
	
	// Now, the unions !
	this.horizUnions = [];
	this.vertUnions = [];
	this.unionsOriginsArray = generateValueArray(this.xLength, this.yLength, CW_POSITION.UNDECIDED); // Indexes of origins of unions (for pass)
	// This array doesn't care whether the directions are horizontal or vertical. A call to getDirection on the space will be required.

	
	var xx, yy, item1, item2, i1, i2, coorMin, coorMax;
	this.obstaclesNodes.forEach(coors => {
		x = coors.x;
		y = coors.y;
		dir = this.getDirection(x, y);
		if (OrientationDirection[dir] == ORIENTATION.HORIZONTAL) {
			xx = x + DeltaX[dir];
			while (xx >= 0 && xx <= this.xLength-2 && this.horizLinesArray[y][xx].length == 0) {
				xx += DeltaX[dir];
			}
			if (xx >= 0 && xx <= this.xLength-2) {
				if (this.horizLinesArray[y][xx].length == 1) { // One direction 
					item1 = this.horizLinesList[this.horizLinesArray[y][xx][0]];
					coorMin = item1.firstXLeftLink;
					coorMax = item1.lastXLeftLink;
					this.unionsOriginsArray[y][x] = this.horizUnions.length;
					this.horizUnions.push({xMin : coorMin, xMax : coorMax, y : item1.y});
				} else if (dir == DIRECTION.RIGHT) { // Union of 2 opposite directions. Only dealt with with directions originating from left (so going right) or from up (so going down)
					item1 = this.horizLinesList[this.horizLinesArray[y][xx][0]];
					item2 = this.horizLinesList[this.horizLinesArray[y][xx][1]];
					coorMin = Math.min(item1.firstXLeftLink, item2.firstXLeftLink);
					coorMax = Math.max(item1.lastXLeftLink, item2.lastXLeftLink);
					this.unionsOriginsArray[y][x] = this.horizUnions.length;
					while (!this.isBanned(xx, y) || this.getDirection(xx, y) != OppositeDirection[dir]) {						
						xx++;
					}
					this.unionsOriginsArray[y][xx] = this.horizUnions.length;
					this.horizUnions.push({xMin : coorMin, xMax : coorMax, y : item1.y});
				} 
			}
		} else {
			yy = y + DeltaY[dir];
			while (yy >= 0 && yy <= this.yLength-2 && this.vertLinesArray[yy][x].length == 0) {
				yy += DeltaY[dir];
			}
			if (yy >= 0 && yy <= this.xLength-2) {
				if (this.vertLinesArray[yy][x].length == 1) { // One direction 
					item1 = this.vertLinesList[this.vertLinesArray[yy][x][0]];
					coorMin = item1.firstYUpLink;
					coorMax = item1.lastYUpLink;
					this.unionsOriginsArray[y][x] = this.vertUnions.length;
					this.vertUnions.push({yMin : coorMin, yMax : coorMax, x : item1.x});
				} else if (dir == DIRECTION.DOWN) {
					item1 = this.vertLinesList[this.vertLinesArray[yy][x][0]];
					item2 = this.vertLinesList[this.vertLinesArray[yy][x][1]];
					coorMin = Math.min(item1.firstYUpLink, item2.firstYUpLink);
					coorMax = Math.max(item1.lastYUpLink, item2.lastYUpLink);
					this.unionsOriginsArray[y][x] = this.vertUnions.length;
					while (!this.isBanned(x, yy) || this.getDirection(x, yy) != OppositeDirection[dir]) {						
						yy++;
					}
					this.unionsOriginsArray[yy][x] = this.vertUnions.length;
					this.vertUnions.push({yMin : coorMin, yMax : coorMax, x : item1.x});
				} 
			}
		}
		
	});
	
	this.setResolution.searchSolutionMethod = loopNaiveSearchClosure(this);
}

// Warning : values in hard. Duplicated in other puzzles.

//Offensive !
SolverCastleWall.prototype.getDirection = function(p_x, p_y) { 
	switch (this.clueGrid.get(p_x, p_y).charAt(1)) {
		case CHAR_DIRECTION.LEFT : return DIRECTION.LEFT; break;
		case CHAR_DIRECTION.UP : return DIRECTION.UP; break;
		case CHAR_DIRECTION.RIGHT : return DIRECTION.RIGHT; break;
		case CHAR_DIRECTION.DOWN : return DIRECTION.DOWN; break;
		default : return null;
	}
}

SolverCastleWall.prototype.getPosition = function(p_x, p_y) { 
	if (this.clueGrid.get(p_x, p_y).charAt(0) == "B") 
		return CW_POSITION.OUTER;
	else  
		return CW_POSITION.INNER;
}

SolverCastleWall.prototype.getNumber = function(p_x, p_y) {
	return parseInt(this.clueGrid.get(p_x, p_y).substring(2), 10);
}

SolverCastleWall.prototype.getInnerOuterStateRD = function(p_x, p_y) {
	return this.innerOuterRDArray[p_y][p_x];
}

// -------------------
// Getters and setters shamelessly taken on Yajikabe

SolverCastleWall.prototype.isNotEmpty = function(p_x, p_y) { // "isBanned" is reserved by LoopSolver but serves indeed to check if a space is banned in a loop puzzle
	return this.clueGrid.get(p_x, p_y) != null;
}

SolverCastleWall.prototype.isNumeric = function(p_x, p_y) {
	const num = this.clueGrid.get(p_x, p_y);
	return (num != null && num.length > 1);
}

// -------------------
// Input methods

SolverCastleWall.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (this.quickStartDone && p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverCastleWall.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (this.quickStartDone && p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverCastleWall.prototype.emitHypothesisNode = function(p_x, p_y, p_state) {
	if (this.quickStartDone) {		
		this.tryToPutNewSpace(p_x, p_y, p_state);
	}
}

SolverCastleWall.prototype.emitPassNode = function(p_x, p_y) {
	if (this.quickStartDone) {	
		if (!this.isBanned(p_x, p_y)) {			
			return this.passLoop({passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y});
		} else if (this.unionsOriginsArray[p_y][p_x] != null) {
			if (OrientationDirection[this.getDirection(p_x, p_y)] == ORIENTATION.HORIZONTAL) {
				return this.passLoop({passCategory : LOOP_PASS_CATEGORY.CW_HORIZ, index : this.unionsOriginsArray[p_y][p_x]});
			} else {
				return this.passLoop({passCategory : LOOP_PASS_CATEGORY.CW_VERT, index : this.unionsOriginsArray[p_y][p_x]});
			}
		} 
	}
}

SolverCastleWall.prototype.makeMultipass = function() {
	if (this.quickStartDone) {		
		this.multipassLoop();
	}
}

solveAction = function (p_solver) {
	p_solver.resolve();
}

// -------------------
// Atomic closures 

function setEdgeLinkedPSAtomicDosClosure(p_solver) {
	return function(p_args) {
		const x = p_args.x;
		const y = p_args.y;
		switch (p_args.direction) {
			case DIRECTION.LEFT :
				p_solver.handleHorizLinesNotLinkedClosedYet(x-1, y, NOT_YET.LINKED, -1);
			break;
			case DIRECTION.RIGHT :
				p_solver.handleHorizLinesNotLinkedClosedYet(x, y, NOT_YET.LINKED, -1);
			break;
			case DIRECTION.UP :
				p_solver.handleVertLinesNotLinkedClosedYet(x, y-1, NOT_YET.LINKED, -1);
			break;
			case DIRECTION.DOWN :
				p_solver.handleVertLinesNotLinkedClosedYet(x, y, NOT_YET.LINKED, -1);
			break;
		}
	}
}

function setEdgeClosedPSAtomicDosClosure(p_solver) {
	return function(p_args) {
		const x = p_args.x;
		const y = p_args.y;
		switch (p_args.direction) {
			case DIRECTION.LEFT :
				p_solver.handleHorizLinesNotLinkedClosedYet(x-1, y, NOT_YET.CLOSED, -1);
			break;
			case DIRECTION.RIGHT :
				p_solver.handleHorizLinesNotLinkedClosedYet(x, y, NOT_YET.CLOSED, -1);
			break;
			case DIRECTION.UP :
				p_solver.handleVertLinesNotLinkedClosedYet(x, y-1, NOT_YET.CLOSED, -1);
			break;
			case DIRECTION.DOWN :
				p_solver.handleVertLinesNotLinkedClosedYet(x, y, NOT_YET.CLOSED, -1);
			break;
		}
	}
}

function setEdgeLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_args) {
		const x = p_args.x;
		const y = p_args.y;
		switch (p_args.direction) {
			case DIRECTION.LEFT :
				p_solver.handleHorizLinesNotLinkedClosedYet(x-1, y, NOT_YET.LINKED, +1);
			break;
			case DIRECTION.RIGHT :
				p_solver.handleHorizLinesNotLinkedClosedYet(x, y, NOT_YET.LINKED, +1);
			break;
			case DIRECTION.UP :
				p_solver.handleVertLinesNotLinkedClosedYet(x, y-1, NOT_YET.LINKED, +1);
			break;
			case DIRECTION.DOWN :
				p_solver.handleVertLinesNotLinkedClosedYet(x, y, NOT_YET.LINKED, +1);
			break;
		}
	}
}

function setEdgeClosedPSAtomicUndosClosure(p_solver) {
	return function(p_args) {
		const x = p_args.x;
		const y = p_args.y;
		switch (p_args.direction) {
			case DIRECTION.LEFT :
				p_solver.handleHorizLinesNotLinkedClosedYet(x-1, y, NOT_YET.CLOSED, +1);
			break;
			case DIRECTION.RIGHT :
				p_solver.handleHorizLinesNotLinkedClosedYet(x, y, NOT_YET.CLOSED, +1);
			break;
			case DIRECTION.UP :
				p_solver.handleVertLinesNotLinkedClosedYet(x, y-1, NOT_YET.CLOSED, +1);
			break;
			case DIRECTION.DOWN :
				p_solver.handleVertLinesNotLinkedClosedYet(x, y, NOT_YET.CLOSED, +1);
			break;
		}
	}
}

SolverCastleWall.prototype.handleHorizLinesNotLinkedClosedYet = function(p_xLinkLeft, p_yLinkUp, p_entry, p_delta) {
	this.horizLinesArray[p_yLinkUp][p_xLinkLeft].forEach(index => {
		this.horizLinesList[index].notYet[p_entry] += p_delta;
		this.checkerHorizLink.add(index); // Note : even done when undoing !
	});
}

SolverCastleWall.prototype.handleVertLinesNotLinkedClosedYet = function(p_xLinkLeft, p_yLinkUp, p_entry, p_delta) {
	this.vertLinesArray[p_yLinkUp][p_xLinkLeft].forEach(index => {
		this.vertLinesList[index].notYet[p_entry] += p_delta;
		this.checkerVertLink.add(index); // Note : even done when undoing !
	});
}

// -------------------
// Deductions

function otherAtomicDosClosure(p_solver) {
	return function(p_event) {
		const x = p_event.xMesh;
		const y = p_event.yMesh;
		const position = p_event.position;
		const oldPos = p_solver.innerOuterRDArray[y][x];
		if (oldPos == position) {
			return EVENT_RESULT.HARMLESS;
		}
		if (oldPos != CW_POSITION.UNDECIDED) {
			return EVENT_RESULT.FAILURE;
		}
		p_solver.innerOuterRDArray[y][x] = position;
		return EVENT_RESULT.SUCCESS;
	}
}

function otherAtomicUndosClosure(p_solver) {
	return function(p_event) {
		p_solver.innerOuterRDArray[p_event.yMesh][p_event.xMesh] = CW_POSITION.UNDECIDED;
	}
}

function setEdgeLinkedDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		return p_solver.positionTransmissionDeductions(p_eventList, p_eventBeingApplied.linkX, p_eventBeingApplied.linkY, p_eventBeingApplied.direction, LOOP_STATE.LINKED);
	}
}

function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		return p_solver.positionTransmissionDeductions(p_eventList, p_eventBeingApplied.linkX, p_eventBeingApplied.linkY, p_eventBeingApplied.direction, LOOP_STATE.CLOSED);
	}
}

 // Assumption : xLength and yLength are at least 2. (because of the else after the p_linkX/p_linkY)
SolverCastleWall.prototype.positionTransmissionDeductions = function(p_eventList, p_linkX, p_linkY, p_dir, p_linkState) {
	var position;
	if (p_dir == DIRECTION.LEFT) {
		return this.positionTransmissionDeductions(p_eventList, p_linkX-1, p_linkY, DIRECTION.RIGHT, p_linkState);
	}
	if (p_dir == DIRECTION.UP) {
		return this.positionTransmissionDeductions(p_eventList, p_linkX, p_linkY-1, DIRECTION.DOWN, p_linkState);
	}
	if (p_dir == DIRECTION.RIGHT) {
		if (p_linkY == 0) {
			p_eventList.push(new InOutEvent(p_linkX, 0, borderState(p_linkState)));
		} else if (p_linkY == this.yLength-1) { 
			p_eventList.push(new InOutEvent(p_linkX, this.yLength-2, borderState(p_linkState)));
		} else {
			p_eventList = this.transferPositionsDeductions(p_eventList, p_linkX, p_linkY, p_linkX, p_linkY-1, p_linkState);		
		} 
	} else {
		if (p_linkX == 0) {
			p_eventList.push(new InOutEvent(0, p_linkY, borderState(p_linkState)));
		} else if (p_linkX == this.xLength-1) { 
			p_eventList.push(new InOutEvent(this.xLength-2, p_linkY, borderState(p_linkState)));
		} else {
			p_eventList = this.transferPositionsDeductions(p_eventList, p_linkX, p_linkY, p_linkX-1, p_linkY, p_linkState);			
		} 
	}
	return p_eventList;
}

// Between two meshes, one is known and the other one should be filled according to the link state
SolverCastleWall.prototype.transferPositionsDeductions = function(p_eventList, p_xMesh1, p_yMesh1, p_xMesh2, p_yMesh2, p_linkState) {
	position = this.innerOuterRDArray[p_yMesh1][p_xMesh1];
	if (position != CW_POSITION.UNDECIDED) {
		p_eventList.push(new InOutEvent(p_xMesh2, p_yMesh2, p_linkState == LOOP_STATE.CLOSED ? position : otherCWPosition(position)));
	}
	position = this.innerOuterRDArray[p_yMesh2][p_xMesh2];
	if (position != CW_POSITION.UNDECIDED) {
		p_eventList.push(new InOutEvent(p_xMesh1, p_yMesh1, p_linkState == LOOP_STATE.CLOSED ? position : otherCWPosition(position)));
	}	
	return p_eventList;
}

function closedIfSameMeshes(p_position1, p_position2) {
	return p_position2 == p_position1 ? LOOP_STATE.CLOSED : LOOP_STATE.LINKED;
}

function borderState(p_linkState) {
	return p_linkState == LOOP_STATE.LINKED ? CW_POSITION.INNER : CW_POSITION.OUTER;
}

function otherDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		const xMesh = p_eventBeingApplied.xMesh;
		const yMesh = p_eventBeingApplied.yMesh;
		const position = p_eventBeingApplied.position;
		var position2;
		var linkState;
		if (xMesh > 0) { // Inspecting LEFT
			position2 = p_solver.innerOuterRDArray[yMesh][xMesh-1];
			if (position2 != CW_POSITION.UNDECIDED) {
				p_eventList.push(new LinkEvent(xMesh, yMesh, DIRECTION.DOWN, closedIfSameMeshes(position, position2) ));
			}
			p_eventList = solver.diagonalUpDownNodeDifferentPositionsDeductions(p_eventList, xMesh, -1, xMesh, yMesh);
			linkState = solver.getLink(xMesh, yMesh, DIRECTION.DOWN);
			if (linkState != LOOP_STATE.UNDECIDED) {				
				p_eventList = solver.transferPositionsDeductions(p_eventList, xMesh, yMesh, xMesh-1, yMesh, linkState);
			}
		} else {
			p_eventList.push(new LinkEvent(0, yMesh, DIRECTION.DOWN, closedIfSameMeshes(position, CW_POSITION.OUTER) ));
		}
		if (xMesh < p_solver.xLastMeshIndex) { // Inspecting RIGHT
			position2 = p_solver.innerOuterRDArray[yMesh][xMesh+1];
			if (position2 != CW_POSITION.UNDECIDED) {
				p_eventList.push(new LinkEvent(xMesh+1, yMesh, DIRECTION.DOWN, closedIfSameMeshes(position, position2) ));
			}
			p_eventList = solver.diagonalUpDownNodeDifferentPositionsDeductions(p_eventList, xMesh, +1, xMesh+1, yMesh);
			linkState = solver.getLink(xMesh+1, yMesh, DIRECTION.DOWN);
			if (linkState != LOOP_STATE.UNDECIDED) {				
				p_eventList = solver.transferPositionsDeductions(p_eventList, xMesh, yMesh, xMesh+1, yMesh, linkState);
			}
		} else {
			p_eventList.push(new LinkEvent(p_solver.xLength-1, yMesh, DIRECTION.DOWN, closedIfSameMeshes(position, CW_POSITION.OUTER) ));
		}
		
		if (yMesh > 0) { // Inspecting UP
			position2 = p_solver.innerOuterRDArray[yMesh-1][xMesh];
			if (position2 != CW_POSITION.UNDECIDED) {
				p_eventList.push(new LinkEvent(xMesh, yMesh, DIRECTION.RIGHT, closedIfSameMeshes(position, position2) ));
			}
			linkState = solver.getLink(xMesh, yMesh, DIRECTION.RIGHT);
			if (linkState != LOOP_STATE.UNDECIDED) {				
				p_eventList = solver.transferPositionsDeductions(p_eventList, xMesh, yMesh, xMesh, yMesh-1, linkState);
			}
		} else {
			p_eventList.push(new LinkEvent(xMesh, 0, DIRECTION.RIGHT, closedIfSameMeshes(position, CW_POSITION.OUTER) ));
		}
		if (yMesh < p_solver.yLastMeshIndex) { // Inspecting DOWN
			position2 = p_solver.innerOuterRDArray[yMesh+1][xMesh];
			if (position2 != CW_POSITION.UNDECIDED) {
				p_eventList.push(new LinkEvent(xMesh, yMesh+1, DIRECTION.RIGHT, closedIfSameMeshes(position, position2) ));
			}
			linkState = solver.getLink(xMesh, yMesh+1, DIRECTION.RIGHT);
			if (linkState != LOOP_STATE.UNDECIDED) {
				p_eventList = solver.transferPositionsDeductions(p_eventList, xMesh, yMesh, xMesh, yMesh+1, linkState);
			}
		} else {
			p_eventList.push(new LinkEvent(xMesh, p_solver.yLength-1, DIRECTION.RIGHT, closedIfSameMeshes(position, CW_POSITION.OUTER) ));
		}
		return p_eventList;
	}
}

// We are looking if either (LU and LD separately) or (RU and RD separately) mesh is defined and different. If yes, space yes.
// Precondition : p_xMesh+p_deltaXMesh is an existing mesh. 
SolverCastleWall.prototype.diagonalUpDownNodeDifferentPositionsDeductions = function(p_eventList, p_xMesh, p_deltaXMesh, p_xNode, p_yMesh) {
	const pos = this.innerOuterRDArray[p_yMesh][p_xMesh];
	if (pos != CW_POSITION.UNDECIDED) {		
		var pos2;
		if (p_yMesh > 0) {
			pos2 = this.innerOuterRDArray[p_yMesh-1][p_xMesh+p_deltaXMesh];
			if (pos2 != CW_POSITION.UNDECIDED && pos != pos2) {
				p_eventList.push(new SpaceEvent(p_xNode, p_yMesh, LOOP_STATE.LINKED));
			}
		}
		if (p_yMesh <= this.yLength-2) {
			pos2 = this.innerOuterRDArray[p_yMesh+1][p_xMesh+p_deltaXMesh];
			if (pos2 != CW_POSITION.UNDECIDED && pos != pos2) {
				p_eventList.push(new SpaceEvent(p_xNode, p_yMesh+1, LOOP_STATE.LINKED));
			}
		}
	}
	return p_eventList;
}

// -------------------
// Filters

// The band must be already checked
SolverCastleWall.prototype.fillHorizLineDeductions = function(p_listEvents, p_item, p_stateToFill) {
	const y = p_item.y;
	for (var xLeft = p_item.firstXLeftLink ; xLeft <= p_item.lastXLeftLink ; xLeft++) {					
		if (this.getLink(xLeft, y, DIRECTION.RIGHT) == LOOP_STATE.UNDECIDED) {
			p_listEvents.push(new LinkEvent(xLeft, y, DIRECTION.RIGHT, p_stateToFill));
		}
	}
	return p_listEvents;
}

SolverCastleWall.prototype.fillVertLineDeductions = function(p_listEvents, p_item, p_stateToFill) {
	const x = p_item.x;
	for (var yUp = p_item.firstYUpLink ; yUp <= p_item.lastYUpLink ; yUp++) {					
		if (this.getLink(x, yUp, DIRECTION.DOWN) == LOOP_STATE.UNDECIDED) {
			p_listEvents.push(new LinkEvent(x, yUp, DIRECTION.DOWN, p_stateToFill));
		}
	}
	return p_listEvents;
}

// Remember : if "not yet" deductions are done at once in a filter, it is necessary to check if a "not yet" counter didn't go below 0 (or beyond its intended value) !!!
// Unless check was already performed in atomic dos/undos
function filterStripsClosure(p_solver) {
	return function() {
		var listEvents = [];
		var item, nyl, nyc;
		p_solver.checkerHorizLink.list.forEach(index => {
			if (listEvents != EVENT_RESULT.FAILURE) {				
				item = p_solver.horizLinesList[index];
				nyl = item.notYet[NOT_YET.LINKED];
				nyc = item.notYet[NOT_YET.CLOSED];
				if (nyc < 0 || nyl < 0) {
					listEvents = EVENT_RESULT.FAILURE;
				} else {				
					if (nyc == 0) {
						listEvents = p_solver.fillHorizLineDeductions(listEvents, item, LOOP_STATE.LINKED);
					}
					if (nyl == 0) {
						listEvents = p_solver.fillHorizLineDeductions(listEvents, item, LOOP_STATE.CLOSED);
					}			
				}
			}
		});
		p_solver.checkerVertLink.list.forEach(index => {
			if (listEvents != EVENT_RESULT.FAILURE) {	
				item = p_solver.vertLinesList[index];
				nyl = item.notYet[NOT_YET.LINKED];
				nyc = item.notYet[NOT_YET.CLOSED];
				if (nyc < 0 || nyl < 0) {
					listEvents = EVENT_RESULT.FAILURE;
				} else {				
					if (nyc == 0) {
						listEvents = p_solver.fillVertLineDeductions(listEvents, item, LOOP_STATE.LINKED);
					}
					if (nyl == 0) {
						listEvents = p_solver.fillVertLineDeductions(listEvents, item, LOOP_STATE.CLOSED);
					}			
				}
			}
		});
		p_solver.cleanCheckStrips();
		return listEvents;
	}
}

SolverCastleWall.prototype.cleanCheckStrips = function() {
	this.checkerHorizLink.clean();
	this.checkerVertLink.clean();
}

abortCastleWallClosure = function(p_solver) {
	return function() {
		p_solver.cleanCheckStrips();
	}
} 

// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_QSeventsList) { 
		p_QSeventsList.push({quickStartLabel : "Castle wall"});
		var existLeft, existUp, existRight, existDown, position, x, y;
		p_solver.obstaclesNodes.forEach(coors => {
			x = coors.x;
			y = coors.y;
			position = p_solver.getPosition(x, y);
			existLeft = p_solver.neighborExists(x, y, DIRECTION.LEFT);
			existUp = p_solver.neighborExists(x, y, DIRECTION.UP);
			existRight = p_solver.neighborExists(x, y, DIRECTION.RIGHT);
			existDown = p_solver.neighborExists(x, y, DIRECTION.DOWN);
			if (existUp) {
				if (existLeft) {
					p_QSeventsList.push(new InOutEvent(x-1, y-1, position));
				}
				if (existRight) {
					p_QSeventsList.push(new InOutEvent(x, y-1, position));
				}
			}					
			if (existDown) {
				if (existLeft) {
					p_QSeventsList.push(new InOutEvent(x-1, y, position));
				}
				if (existRight) {
					p_QSeventsList.push(new InOutEvent(x, y, position));
				}
			}
		});
		p_solver.horizLinesList.forEach(item => {
			if (item.notYet[NOT_YET.CLOSED] == 0) {
				p_QSeventsList = p_solver.fillHorizLineDeductions(p_QSeventsList, item, LOOP_STATE.LINKED);
			}
			if (item.notYet[NOT_YET.LINKED] == 0) {
				p_QSeventsList = p_solver.fillHorizLineDeductions(p_QSeventsList, item, LOOP_STATE.CLOSED);
			}	
		});
		p_solver.vertLinesList.forEach(item => {
			if (item.notYet[NOT_YET.CLOSED] == 0) {
				p_QSeventsList = p_solver.fillVertLineDeductions(p_QSeventsList, item, LOOP_STATE.LINKED);
			}
			if (item.notYet[NOT_YET.LINKED] == 0) {
				p_QSeventsList = p_solver.fillVertLineDeductions(p_QSeventsList, item, LOOP_STATE.CLOSED);
			}	
		}); 
		return p_QSeventsList;
	}
}

// -------------------
// Passing & multipassing (copied onto Yajikabe)
		
generateEventsForPassClosure = function (p_solver) {
	return function (p_indexFamily) {
		return p_solver.passLine(p_indexFamily);
	}
}

SolverCastleWall.prototype.passLine = function(p_indexFamily) {
	var union, x, y;
	var answer = [];
	if (p_indexFamily.passCategory == LOOP_PASS_CATEGORY.CW_HORIZ) {
		union = this.horizUnions[p_indexFamily.index];
		y = union.y;
		for (x = union.xMin ; x <= union.xMax; x++) {
			if (this.getLink(x, y, DIRECTION.RIGHT) == LOOP_STATE.UNDECIDED) {
				answer.push([new LinkEvent(x, y, DIRECTION.RIGHT, LOOP_STATE.LINKED), new LinkEvent(x, y, DIRECTION.RIGHT, LOOP_STATE.CLOSED)]);
			}
		}
	} else {
		union = this.vertUnions[p_indexFamily.index];
		x = union.x;
		for (y = union.yMin ; y <= union.yMin; y++) {
			if (this.getLink(x, y, DIRECTION.DOWN) == LOOP_STATE.UNDECIDED) {
				answer.push([new LinkEvent(x, y, DIRECTION.DOWN, LOOP_STATE.LINKED), new LinkEvent(x, y, DIRECTION.DOWN, LOOP_STATE.CLOSED)]);
			}
		}
	}
	return answer;
}

orderedListPassArgumentsClosureCastleWall = function(p_solver) {
	return function() {
		var answer = [];
		for (var i = 0 ; i < p_solver.horizUnions.length ; i++) {
			answer.push({passCategory : LOOP_PASS_CATEGORY.CW_HORIZ, index : i});
		}
		for (var i = 0 ; i < p_solver.vertUnions.length ; i++) {
			answer.push({passCategory : LOOP_PASS_CATEGORY.CW_VERT, index : i});
		}
		return answer;
	}
}

namingCategoryClosure = function(p_solver) {
	return function(p_passIndex) {
		if (p_passIndex.passCategory == LOOP_PASS_CATEGORY.CW_HORIZ) {
			var item = p_solver.horizUnions[p_passIndex.index];
			return "Horiz.line " + item.xMin + "-" + item.xMax + "," + item.y;
		} else {
			var item = p_solver.vertUnions[p_passIndex.index];
			return "Vert.line " + item.x + "," + item.yMin + "-" + item.yMax;
		}
	}
}

comparisonCastleWallMethod = function(p_event1, p_event2) {
	return commonComparison([p_event1.yMesh, p_event1.xMesh, p_event1.position], [p_event2.yMesh, p_event2.xMesh, p_event2.position]);
}