// Constants

/**
These constants may be used both for drawing and solving. Beware of consistency.
*/

const PEARL = {
	WHITE : 'W',
	BLACK : 'B',
	EMPTY : '-'
}

LOOP_PASS_CATEGORY.MASYU = -1;

// -----------------
// Setup

function SolverMasyu(p_symbolGrid) {
	LoopSolver.call(this);
	this.construct(p_symbolGrid);
}

SolverMasyu.prototype = Object.create(LoopSolver.prototype);
SolverMasyu.prototype.constructor = SolverMasyu;

function DummySolver() {
	return new SolverMasyu(generateSymbolArray(1, 1));
}

SolverMasyu.prototype.construct = function(p_symbolGrid) {
	this.xLength = p_symbolGrid[0].length;
	this.yLength = p_symbolGrid.length;
	
	this.loopSolverConstruct( {
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		generateEventsForPassPS : generateEventsForSpacePassClosure(this),
		orderedListPassArgumentsPS : startingOrderedListPassArgumentsMasyuClosure(this),
		namingCategoryPS : namingCategoryPassClosure(this),
		multipassPessimismPS : true,
		passDefineTodoPSMethod : function(p_categoryPass) {
			const x = p_categoryPass.x;
			const y = p_categoryPass.y;
			return (this.linksArray[y][x].state != LOOP_STATE.CLOSED && this.linksArray[y][x].linkedDirections.length != 2);
		}
		
	}); // this.xLength and yLength defined in the upper solver
	// comparisonLoopEvents and copyLoopSolverEventMethod defined in LoopSolver
	//this.setMultipass = {numberPSCategories : 2, PSCategoryMethod : multiPassMasyuCategoryClosure(this), generatePassEventsMethod : generateEventsForSpacePassClosure(this)} RELIQUAT
	this.pearlArray = [];
	this.pearlSpacesList = [];
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.pearlArray.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (p_symbolGrid[iy][ix] == SYMBOL_ID.WHITE) {
                this.pearlArray[iy].push(PEARL.WHITE);
				this.setLinkSpace(ix, iy, LOOP_STATE.LINKED);
				this.pearlSpacesList.push({x : ix, y : iy});
            } else if (p_symbolGrid[iy][ix] == SYMBOL_ID.BLACK) {
                this.pearlArray[iy].push(PEARL.BLACK);
				this.setLinkSpace(ix, iy, LOOP_STATE.LINKED);
				this.pearlSpacesList.push({x : ix, y : iy});
            } else {
                this.pearlArray[iy].push(null);
            }
		}
	}
}

// -------------------
// Getters and setters

SolverMasyu.prototype.getPearl = function(p_x, p_y) {
	return this.pearlArray[p_y][p_x];
}

// -------------------
// Input methods

SolverMasyu.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverMasyu.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverMasyu.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverMasyu.prototype.emitPassSpace = function(p_x, p_y) {
	var indexPass;
	if (this.pearlArray[p_y][p_x] != null) {		
		indexPass = {passCategory : LOOP_PASS_CATEGORY.MASYU, x : p_x, y : p_y};
	} else {
		indexPass = {passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	}
	return this.passLoop(indexPass);
}

// Correct puzzle data assumption : no white pearl should be found in a corner
quickStartEventsClosure = function(p_solver) {
	return function(p_listQSEvents) { 
		const xMax = p_solver.xLength;
		const yMax = p_solver.yLength;
		p_listQSEvents.push({quickStartLabel : "Masyu"});
		for (var x = 0; x < xMax; x++) {
			if (p_solver.pearlArray[0][x] == PEARL.WHITE && (x != 0)) {
				p_listQSEvents.push(new LinkEvent(x, 0, DIRECTION.LEFT, LOOP_STATE.LINKED));
			} else if (p_solver.pearlArray[0][x] == PEARL.BLACK) {
				p_listQSEvents.push(new LinkEvent(x, 0, DIRECTION.DOWN, LOOP_STATE.LINKED));
			} else if (p_solver.pearlArray[1][x] == PEARL.BLACK) {
				p_listQSEvents.push(new LinkEvent(x, 1, DIRECTION.DOWN, LOOP_STATE.LINKED));
			}
			if (p_solver.pearlArray[yMax-1][x] == PEARL.WHITE && (x != 0)) {
				p_listQSEvents.push(new LinkEvent(x, yMax-1, DIRECTION.LEFT, LOOP_STATE.LINKED));
			} else if (p_solver.pearlArray[yMax-1][x] == PEARL.BLACK) {                  
				p_listQSEvents.push(new LinkEvent(x, yMax-1, DIRECTION.UP, LOOP_STATE.LINKED));
			} else if (p_solver.pearlArray[yMax-2][x] == PEARL.BLACK) {                  
				p_listQSEvents.push(new LinkEvent(x, yMax-2, DIRECTION.UP, LOOP_STATE.LINKED));
			}
		}
		for (var y = 0 ; y < yMax; y++) {
			if (p_solver.pearlArray[y][0] == PEARL.WHITE && (y != 0)) {
				p_listQSEvents.push(new LinkEvent(0, y, DIRECTION.UP, LOOP_STATE.LINKED));
			} else if (p_solver.pearlArray[y][0] == PEARL.BLACK) {
				p_listQSEvents.push(new LinkEvent(0, y, DIRECTION.RIGHT, LOOP_STATE.LINKED));  
			} else if (p_solver.pearlArray[y][1] == PEARL.BLACK) {
				p_listQSEvents.push(new LinkEvent(1, y, DIRECTION.RIGHT, LOOP_STATE.LINKED));  
			}
			if (p_solver.pearlArray[y][xMax-1] == PEARL.WHITE && (y != 0)) {
				p_listQSEvents.push(new LinkEvent(xMax-1, y, DIRECTION.UP, LOOP_STATE.LINKED));
			} else if (p_solver.pearlArray[y][xMax-1] == PEARL.BLACK) {
				p_listQSEvents.push(new LinkEvent(xMax-1, y, DIRECTION.LEFT, LOOP_STATE.LINKED));  
			} else if (p_solver.pearlArray[y][xMax-2] == PEARL.BLACK) {
				p_listQSEvents.push(new LinkEvent(xMax-2, y, DIRECTION.LEFT, LOOP_STATE.LINKED)); 
			}
		}
	}
}

SolverMasyu.prototype.makeMultipass = function() {
	this.multipassLoop();
}

// -------------------
// Closures

setEdgeLinkedDeductionsClosure = function(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		x = p_eventBeingApplied.linkX;
		y = p_eventBeingApplied.linkY;
		dir = p_eventBeingApplied.direction;
		dx = p_eventBeingApplied.dual().linkX;
		dy = p_eventBeingApplied.dual().linkY;
		fwdX = dx+DeltaX[dir]; // The space forward the link (remember : a link is considered, not a space)
		fwdY = dy+DeltaY[dir];
		bwdX = x-DeltaX[dir]; // The space when going backward the link 
		bwdY = y-DeltaY[dir];
		

		ddir = p_eventBeingApplied.dual().direction;
		antiDir = OppositeDirection[dir];
		p_solver.deductionsTestWhitePearlSpace(p_listEventsToApply, x, y, dir, LOOP_STATE.LINKED); // Test white pearl here
		p_solver.deductionsTestWhitePearlSpace(p_listEventsToApply, dx, dy, ddir, LOOP_STATE.LINKED); // Test white pearl on next space
		if (p_solver.neighborExists(dx, dy, dir) && p_solver.pearlArray[fwdY][fwdX] == PEARL.WHITE) { // Test white spaces 2 spaces forward
			p_solver.deductionsTestExpansionWhitePearlSpace(p_listEventsToApply, fwdX, fwdY, antiDir);
		}
		if (p_solver.neighborExists(x, y, antiDir) && p_solver.pearlArray[bwdY][bwdX] == PEARL.WHITE) { // Test white spaces in the space behind
			p_solver.deductionsTestExpansionWhitePearlSpace(p_listEventsToApply, bwdX, bwdY, dir);
		}
		
		p_solver.deductionsTestOnBlackPearlSpace(p_listEventsToApply, x, y, dir);
		p_solver.deductionsTestOnBlackPearlSpace(p_listEventsToApply, dx, dy, antiDir);
		
		const dirR = TurningRightDirection[dir];
		const dirL = TurningLeftDirection[dir];
		if (p_solver.neighborExists(x, y, dirR)) {
			p_solver.deductionsTestBlackPearlAsideLink(p_listEventsToApply, x, y, dirR);
			p_solver.deductionsTestBlackPearlAsideLink(p_listEventsToApply, dx, dy, dirR);
		}
		if (p_solver.neighborExists(x, y, dirL)) {
			p_solver.deductionsTestBlackPearlAsideLink(p_listEventsToApply, x, y, dirL);
			p_solver.deductionsTestBlackPearlAsideLink(p_listEventsToApply, dx, dy, dirL);
		}
		return;
	}
}



setEdgeClosedDeductionsClosure = function(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		x = p_eventBeingApplied.linkX;
		y = p_eventBeingApplied.linkY;
		dir = p_eventBeingApplied.direction;
		dx = p_eventBeingApplied.dual().linkX;
		dy = p_eventBeingApplied.dual().linkY;
		ddir = p_eventBeingApplied.dual().direction;
		p_solver.deductionsTestWhitePearlSpace(p_listEventsToApply, x, y, dir, LOOP_STATE.CLOSED);
		p_solver.deductionsTestWhitePearlSpace(p_listEventsToApply, dx, dy, ddir, LOOP_STATE.CLOSED);
	    // Test black space for link
		p_solver.deductionsTestOnBlackPearlSpace(p_listEventsToApply, x, y);
		p_solver.deductionsTestOnBlackPearlSpace(p_listEventsToApply, dx, dy);
		if (p_solver.neighborExists(x, y, ddir)) {
			p_solver.deductionsTestBlackPearlAsideLink(p_listEventsToApply, x, y, ddir);
		}
		if (p_solver.neighborExists(dx, dy, dir)) {
			p_solver.deductionsTestBlackPearlAsideLink(p_listEventsToApply, dx, dy, dir);
		}
		return;
	}
}

// Test if space orthogonally adjacent to a link and (in the same direction if link is closed or the perpendicular one if link is linked) is black and if so, close these link between
SolverMasyu.prototype.deductionsTestBlackPearlAsideLink = function(p_listEventsToApply, p_x, p_y, p_dirLateral) {
	if (this.pearlArray[p_y+DeltaY[p_dirLateral]][p_x+DeltaX[p_dirLateral]] == PEARL.BLACK) {
		p_listEventsToApply.push(new LinkEvent(p_x, p_y, p_dirLateral ,LOOP_STATE.CLOSED));
	}
	return;
}

// Test if we are on a white pearl space and make a link of the same state accordingly
SolverMasyu.prototype.deductionsTestWhitePearlSpace = function(p_listEventsToApply, p_x, p_y, p_dir, p_state) {
	if (this.pearlArray[p_y][p_x] == PEARL.WHITE) {
		if (!this.neighborExists(p_x, p_y, OppositeDirection[p_dir])) {
			if (p_state == LOOP_STATE.LINKED) {
				p_listEventsToApply.push(new FailureEvent());
			}
		} else {
			if (p_state == LOOP_STATE.LINKED) {
				this.deductionsTestExpansionWhitePearlSpace(p_listEventsToApply, p_x, p_y, p_dir);
			}			
			p_listEventsToApply.push(new LinkEvent(p_x, p_y, OppositeDirection[p_dir], p_state));
		}
	}
	return;
}

SolverMasyu.prototype.deductionsTestOnBlackPearlSpace = function(p_listEventsToApply, p_x, p_y) { 
	if (this.pearlArray[p_y][p_x] == PEARL.BLACK) {
		var detectedLink;
		KnownDirections.forEach(dir => {
			const bx = p_x-DeltaX[dir];
			const by = p_y-DeltaY[dir];
			const fx = p_x+DeltaX[dir];
			const fy = p_y+DeltaY[dir];
			const antiDir = OppositeDirection[dir];
			detectedLink = false;
			if (!this.neighborExists(p_x, p_y, OppositeDirection[dir]) || this.getLink(p_x, p_y, OppositeDirection[dir]) == LOOP_STATE.CLOSED) {
				if (this.neighborExists(p_x, p_y, dir)) {
					p_listEventsToApply.push(new LinkEvent(p_x, p_y, dir, LOOP_STATE.LINKED));
					detectedLink = true;
				} else {
					p_listEventsToApply.push(new FailureEvent());
				}
			}
			if (this.neighborExists(p_x, p_y, dir) && this.getLink(p_x, p_y, dir) == LOOP_STATE.LINKED) {
				if (this.neighborExists(p_x, p_y, antiDir)) {
					p_listEventsToApply.push(new LinkEvent(p_x, p_y, antiDir, LOOP_STATE.CLOSED));
					detectedLink = true;
				}
			}
			if (this.neighborExists(p_x, p_y, antiDir) && (
				 (!this.neighborExists(bx, by, antiDir)) ||
				(this.getLink(bx, by, antiDir) == LOOP_STATE.CLOSED) )) {
				p_listEventsToApply.push(new LinkEvent(p_x, p_y, antiDir, LOOP_STATE.CLOSED));
				detectedLink = true;
			}
			if (detectedLink) {
				if (this.neighborExists(fx, fy, dir)) {
					p_listEventsToApply.push(new LinkEvent(fx, fy, dir, LOOP_STATE.LINKED));
				} else {
					p_listEventsToApply.push(new FailureEvent());
				}
			}
		});
	}
	return;
}

// Prerequistes : p_x, p_y = coordinates of a white space + we are making deductions of a linked link (not necessarily on space p_x, p_y). 
// Tests if 1) the pearl is taken into a straight chain of length 3. If yes, close the opposite link.
// 2) if the pearl is taken between 2 aligned links in the geographical direction of p_dir. If yes, close a link (it will deduce everything else for the chain)
// 3) if the pearl is taken between a pearl and a straight link. If yes, same as 2)
SolverMasyu.prototype.deductionsTestExpansionWhitePearlSpace = function(p_listEventsToApply, p_x, p_y, p_dir) {
	const bx = p_x-DeltaX[p_dir];
	const by = p_y-DeltaY[p_dir];
	const x = p_x; // b = "backward", f = "forward"
	const y = p_y;
	const fx = p_x+DeltaX[p_dir];
	const fy = p_y+DeltaY[p_dir];
	const antiDir = OppositeDirection[p_dir];
	if (this.neighborExists(bx, by, antiDir) &&
	    this.neighborExists(fx, fy, p_dir)) {
		if (this.getLink(x, y, antiDir) == LOOP_STATE.LINKED && // Part 1
		this.getLink(x, y, p_dir) == LOOP_STATE.LINKED ) {
			if (this.getLink(bx, by, antiDir) == LOOP_STATE.LINKED) {
				p_listEventsToApply.push(new LinkEvent(fx, fy, p_dir, LOOP_STATE.CLOSED));
			} else if (this.getLink(fx, fy, p_dir) == LOOP_STATE.LINKED) {
				p_listEventsToApply.push(new LinkEvent(bx, by, antiDir, LOOP_STATE.CLOSED));
			}
		}
		if ((this.getLink(bx, by, antiDir) == LOOP_STATE.LINKED && this.getLink(fx, fy, p_dir) == LOOP_STATE.LINKED ) || // Part 2 : white pearl taken between 2 aligned links
		(this.getLink(bx, by, antiDir) == LOOP_STATE.LINKED && this.pearlArray[fy][fx] == PEARL.WHITE) || // Part 3 : white pearl taken between an aligned link and a white pearl
		(this.getLink(fx, fy, p_dir) == LOOP_STATE.LINKED && this.pearlArray[by][bx] == PEARL.WHITE)) {
			p_listEventsToApply.push(new LinkEvent(x, y, p_dir, LOOP_STATE.CLOSED));
		}
	}
	return;
}

// -------------------
// Passing

generateEventsForSpacePassClosure = function(p_solver) {
	return function(p_category) {
		switch (p_solver.pearlArray[p_category.y][p_category.x]) {
			case PEARL.WHITE : return generateWhitePearlPassEvents(p_category.x, p_category.y); break;
			case PEARL.BLACK : return p_solver.generateBlackPearlPassEvents(p_category.x, p_category.y); break;
		}
		return [];
	}
}

// Precondition : the space has a white pearl and is not on the edge of fields...
function generateWhitePearlPassEvents (p_x, p_y) {
	return [[new LinkEvent(p_x, p_y, DIRECTION.RIGHT, LOOP_STATE.LINKED), new LinkEvent(p_x, p_y, DIRECTION.DOWN, LOOP_STATE.LINKED)]];
} 

// Precondition : the space has a black pearl.
SolverMasyu.prototype.generateBlackPearlPassEvents = function(p_x, p_y) {
	var listEventsChoice = [];
	var okLeft = (p_x >= 2);
	var okUp = (p_y >= 2);
	var okRight = (p_x <= this.xLength-3);
	var okDown = (p_y <= this.yLength-3);
	if (okLeft && okUp) {
		listEventsChoice.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.LEFT, DIRECTION.UP, LOOP_STATE.LINKED));
	}
	if (okRight && okUp) {
		listEventsChoice.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.RIGHT, DIRECTION.UP, LOOP_STATE.LINKED));
	}
	if (okRight && okDown) {
		listEventsChoice.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.RIGHT, DIRECTION.DOWN, LOOP_STATE.LINKED));
	}
	if (okLeft && okDown) {
		listEventsChoice.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.LEFT, DIRECTION.DOWN, LOOP_STATE.LINKED));
	}
	return [listEventsChoice];
}


function namingCategoryPassClosure(p_solver) {
	return function (p_indexPass) {
		const x = p_indexPass.x;
		const y = p_indexPass.y;
		var nameCatPass = x + "," + y;
		switch (p_solver.pearlArray[y][x]) {
			case PEARL.WHITE : nameCatPass += " (white)"; break;
			case PEARL.BLACK : nameCatPass += " (black)"; break;
		}
		return nameCatPass;
	}
}

function startingOrderedListPassArgumentsMasyuClosure(p_solver) {
	return function() {
		return copyCoordinatesList(p_solver.pearlSpacesList); // Note : only contains (x, y) properties but at least no "LOOP_PASS_CATEGORY.STANDARD_SPACE"
	}
}

// Category determination for multipass order for Masyu only (see LoopSolver multipass for more details) RELIQUAT
/*multiPassMasyuCategoryClosure = function(p_solver) {
	return function (p_category) {
		const pearl = p_solver.getPearl(p_category.x, p_category.y);
		if (pearl == PEARL.WHITE) {
			return 0;
		} else if (pearl == PEARL.BLACK) {
			return 1;
		}
	}
	return -1;
} */