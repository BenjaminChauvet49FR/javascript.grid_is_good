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
		PSQuickStart : quickStartClosure(this),
		generateEventsForPassPS : generateEventsForSpaceClosure(this),
		orderedListPassArgumentsPS : startingOrderedListPassArgumentsMasyuClosure(this),
		namingCategoryPS : namingCategoryClosure(this),
		multipassPessimismPS : true,
		passDefineTodoPSMethod : function(p_categoryPass) {
			const x = p_categoryPass.x;
			const y = p_categoryPass.y;
			return (this.grid[y][x].state != LOOP_STATE.CLOSED && this.grid[y][x].chains.length != 2);
		}
		
	}); // this.xLength and yLength defined in the upper solver
	// comparisonLoopEvents and copyLoopSolverEventMethod defined in LoopSolver
	//this.setMultipass = {numberPSCategories : 2, PSCategoryMethod : multiPassMasyuCategoryClosure(this), generatePassEventsMethod : generateEventsForSpaceClosure(this)} RELIQUAT
	this.pearlArray = [];
	this.pearlSpaceList = [];
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.pearlArray.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (p_symbolGrid[iy][ix] == SYMBOL_ID.WHITE) {
                this.pearlArray[iy].push(PEARL.WHITE);
				this.setLinkSpace(ix, iy, LOOP_STATE.LINKED);
				this.pearlSpaceList.push({x : ix, y : iy});
            } else if (p_symbolGrid[iy][ix] == SYMBOL_ID.BLACK) {
                this.pearlArray[iy].push(PEARL.BLACK);
				this.setLinkSpace(ix, iy, LOOP_STATE.LINKED);
				this.pearlSpaceList.push({x : ix, y : iy});
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
	var passIndex;
	if (this.pearlArray[p_y][p_x] != null) {		
		passIndex = {passCategory : LOOP_PASS_CATEGORY.MASYU, x : p_x, y : p_y};
	} else {
		passIndex = {passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	}
	return this.passLoop(passIndex);
}

quickStartClosure = function(p_solver) {
	return function() { //Warning : this quickstart assumes that the puzzle does not have white pearls in corners
		p_solver.initiateQuickStart("Masyu");
		for (var x = 0; x < p_solver.xLength; x++) {
			if (p_solver.pearlArray[0][x] == PEARL.WHITE && (x != 0)) {
				p_solver.tryToPutNewRight(x-1, 0, LOOP_STATE.LINKED);
			} else if (p_solver.pearlArray[0][x] == PEARL.BLACK) {
				p_solver.tryToPutNewDown(x, 0, LOOP_STATE.LINKED);  
			} else if (p_solver.pearlArray[1][x] == PEARL.BLACK) {
				p_solver.tryToPutNewDown(x, 1, LOOP_STATE.LINKED);  
			}
			if (p_solver.pearlArray[p_solver.yLength-1][x] == PEARL.WHITE && (x != 0)) {
				p_solver.tryToPutNewRight(x-1, p_solver.yLength-1, LOOP_STATE.LINKED);
			} else if (p_solver.pearlArray[p_solver.yLength-1][x] == PEARL.BLACK) {
				p_solver.tryToPutNewDown(x, p_solver.yLength-2, LOOP_STATE.LINKED);  
			} else if (p_solver.pearlArray[p_solver.yLength-2][x] == PEARL.BLACK) {
				p_solver.tryToPutNewDown(x, p_solver.yLength-3, LOOP_STATE.LINKED);  
			}
		}
		for (var y = 0 ; y < p_solver.yLength; y++) {
			if (p_solver.pearlArray[y][0] == PEARL.WHITE && (y != 0)) {
				p_solver.tryToPutNewDown(0, y-1, LOOP_STATE.LINKED);
			} else if (p_solver.pearlArray[y][0] == PEARL.BLACK) {
				p_solver.tryToPutNewRight(0, y, LOOP_STATE.LINKED);  
			} else if (p_solver.pearlArray[y][1] == PEARL.BLACK) {
				p_solver.tryToPutNewRight(1, y, LOOP_STATE.LINKED);  
			}
			if (p_solver.pearlArray[y][p_solver.xLength-1] == PEARL.WHITE && (y != 0)) {
				p_solver.tryToPutNewDown(p_solver.xLength-1, y-1, LOOP_STATE.LINKED);
			} else if (p_solver.pearlArray[y][p_solver.xLength-1] == PEARL.BLACK) {
				p_solver.tryToPutNewRight(p_solver.xLength-2, y, LOOP_STATE.LINKED);  
			} else if (p_solver.pearlArray[y][p_solver.xLength-2] == PEARL.BLACK) {
				p_solver.tryToPutNewRight(p_solver.xLength-3, y, LOOP_STATE.LINKED);  
			}
		}
		p_solver.terminateQuickStart();
	}
}

SolverMasyu.prototype.makeMultipass = function() {
	this.multipassLoop();
}

// -------------------
// Closures

setEdgeLinkedDeductionsClosure = function(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
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
		p_eventList = p_solver.testWhitePearlSpace(p_eventList, x, y, dir, LOOP_STATE.LINKED); // Test white pearl here
		p_eventList = p_solver.testWhitePearlSpace(p_eventList, dx, dy, ddir, LOOP_STATE.LINKED); // Test white pearl on next space
		if (p_solver.neighborExists(dx, dy, dir) && p_solver.pearlArray[fwdY][fwdX] == PEARL.WHITE) { // Test white spaces 2 spaces forward
			p_eventList = p_solver.testExpansionWhitePearlSpace(p_eventList, fwdX, fwdY, antiDir);
		}
		if (p_solver.neighborExists(x, y, antiDir) && p_solver.pearlArray[bwdY][bwdX] == PEARL.WHITE) { // Test white spaces in the space behind
			p_eventList = p_solver.testExpansionWhitePearlSpace(p_eventList, bwdX, bwdY, dir);
		}
		
		p_eventList = p_solver.testOnBlackPearlSpace(p_eventList, x, y, dir);
		p_eventList = p_solver.testOnBlackPearlSpace(p_eventList, dx, dy, antiDir);
		
		const dirR = TurningRightDirection[dir];
		const dirL = TurningLeftDirection[dir];
		if (p_solver.neighborExists(x, y, dirR)) {
			p_eventList = p_solver.testBlackPearlAsideLink(p_eventList, x, y, dirR);
			p_eventList = p_solver.testBlackPearlAsideLink(p_eventList, dx, dy, dirR);
		}
		if (p_solver.neighborExists(x, y, dirL)) {
			p_eventList = p_solver.testBlackPearlAsideLink(p_eventList, x, y, dirL);
			p_eventList = p_solver.testBlackPearlAsideLink(p_eventList, dx, dy, dirL);
		}
		return p_eventList;
	}
}



setEdgeClosedDeductionsClosure = function(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		x = p_eventBeingApplied.linkX;
		y = p_eventBeingApplied.linkY;
		dir = p_eventBeingApplied.direction;
		dx = p_eventBeingApplied.dual().linkX;
		dy = p_eventBeingApplied.dual().linkY;
		ddir = p_eventBeingApplied.dual().direction;
		p_eventList = p_solver.testWhitePearlSpace(p_eventList, x, y, dir, LOOP_STATE.CLOSED);
		p_eventList = p_solver.testWhitePearlSpace(p_eventList, dx, dy, ddir, LOOP_STATE.CLOSED);
	    // Test black space for link
		p_eventList = p_solver.testOnBlackPearlSpace(p_eventList, x, y);
		p_eventList = p_solver.testOnBlackPearlSpace(p_eventList, dx, dy);
		if (p_solver.neighborExists(x, y, ddir)) {
			p_eventList = p_solver.testBlackPearlAsideLink(p_eventList, x, y, ddir);
		}
		if (p_solver.neighborExists(dx, dy, dir)) {
			p_eventList = p_solver.testBlackPearlAsideLink(p_eventList, dx, dy, dir);
		}
		return p_eventList;
	}
}

// Test if space orthogonally adjacent to a link and (in the same direction if link is closed or the perpendicular one if link is linked) is black and if so, close these link between
SolverMasyu.prototype.testBlackPearlAsideLink = function(p_eventList, p_x, p_y, p_dirLateral) {
	if (this.pearlArray[p_y+DeltaY[p_dirLateral]][p_x+DeltaX[p_dirLateral]] == PEARL.BLACK) {
		p_eventList.push(new LinkEvent(p_x, p_y, p_dirLateral ,LOOP_STATE.CLOSED));
	}
	return p_eventList;
}

// Test if we are on a white pearl space and make a link of the same state accordingly
SolverMasyu.prototype.testWhitePearlSpace = function(p_eventList, p_x, p_y, p_dir, p_state) {
	if (this.pearlArray[p_y][p_x] == PEARL.WHITE) {
		if (!this.neighborExists(p_x, p_y, OppositeDirection[p_dir])) {
			if (p_state == LOOP_STATE.LINKED) {
				p_eventList.push(new FailureEvent());
			}
		} else {
			if (p_state == LOOP_STATE.LINKED) {
				p_eventList = this.testExpansionWhitePearlSpace(p_eventList, p_x, p_y, p_dir);
			}			
			p_eventList.push(new LinkEvent(p_x, p_y, OppositeDirection[p_dir], p_state));
		}
	}
	return p_eventList;
}

SolverMasyu.prototype.testOnBlackPearlSpace = function(p_eventList, p_x, p_y) {
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
					p_eventList.push(new LinkEvent(p_x, p_y, dir, LOOP_STATE.LINKED));
					detectedLink = true;
				} else {
					p_eventList.push(new FailureEvent());
				}
			}
			if (this.neighborExists(p_x, p_y, dir) && this.getLink(p_x, p_y, dir) == LOOP_STATE.LINKED) {
				if (this.neighborExists(p_x, p_y, antiDir)) {
					p_eventList.push(new LinkEvent(p_x, p_y, antiDir, LOOP_STATE.CLOSED));
					detectedLink = true;
				}
			}
			if (this.neighborExists(p_x, p_y, antiDir) && (
				 (!this.neighborExists(bx, by, antiDir)) ||
				(this.getLink(bx, by, antiDir) == LOOP_STATE.CLOSED) )) {
				p_eventList.push(new LinkEvent(p_x, p_y, antiDir, LOOP_STATE.CLOSED));
				detectedLink = true;
			}
			if (detectedLink) {
				if (this.neighborExists(fx, fy, dir)) {
					p_eventList.push(new LinkEvent(fx, fy, dir, LOOP_STATE.LINKED));
				} else {
					p_eventList.push(new FailureEvent());
				}
			}
		});
	}
	return p_eventList;
}

// Prerequistes : p_x, p_y = coordinates of a white space + we are making deductions of a linked link (not necessarily on space p_x, p_y). 
// Tests if 1) the pearl is taken into a straight chain of length 3. If yes, close the opposite link.
// 2) if the pearl is taken between 2 aligned links in the geographical direction of p_dir. If yes, close a link (it will deduce everything else for the chain)
// 3) if the pearl is taken between a pearl and a straight link. If yes, same as 2)
SolverMasyu.prototype.testExpansionWhitePearlSpace = function(p_eventList, p_x, p_y, p_dir) {
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
				p_eventList.push(new LinkEvent(fx, fy, p_dir, LOOP_STATE.CLOSED));
			} else if (this.getLink(fx, fy, p_dir) == LOOP_STATE.LINKED) {
				p_eventList.push(new LinkEvent(bx, by, antiDir, LOOP_STATE.CLOSED));
			}
		}
		if ((this.getLink(bx, by, antiDir) == LOOP_STATE.LINKED && this.getLink(fx, fy, p_dir) == LOOP_STATE.LINKED ) || // Part 2 : white pearl taken between 2 aligned links
		(this.getLink(bx, by, antiDir) == LOOP_STATE.LINKED && this.pearlArray[fy][fx] == PEARL.WHITE) || // Part 3 : white pearl taken between an aligned link and a white pearl
		(this.getLink(fx, fy, p_dir) == LOOP_STATE.LINKED && this.pearlArray[by][bx] == PEARL.WHITE)) {
			p_eventList.push(new LinkEvent(x, y, p_dir, LOOP_STATE.CLOSED));
		}
	}
	return p_eventList;
}

// -------------------
// Passing

generateEventsForSpaceClosure = function(p_solver) {
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
	var answer = [];
	var okLeft = (p_x >= 2);
	var okUp = (p_y >= 2);
	var okRight = (p_x <= this.xLength-3);
	var okDown = (p_y <= this.yLength-3);
	if (okLeft && okUp) {
		answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.LEFT, DIRECTION.UP, LOOP_STATE.LINKED));
	}
	if (okRight && okUp) {
		answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.RIGHT, DIRECTION.UP, LOOP_STATE.LINKED));
	}
	if (okRight && okDown) {
		answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.RIGHT, DIRECTION.DOWN, LOOP_STATE.LINKED));
	}
	if (okLeft && okDown) {
		answer.push(new CompoundLinkEvent(p_x, p_y, DIRECTION.LEFT, DIRECTION.DOWN, LOOP_STATE.LINKED));
	}
	return [answer];
}


function namingCategoryClosure(p_solver) {
	return function (p_passIndex) {
		const x = p_passIndex.x;
		const y = p_passIndex.y;
		var answer = x + "," + y;
		switch (p_solver.pearlArray[y][x]) {
			case PEARL.WHITE : answer += " (white)"; break;
			case PEARL.BLACK : answer += " (black)"; break;
		}
		return answer;
	}
}

function startingOrderedListPassArgumentsMasyuClosure(p_solver) {
	return function() {
		return p_solver.pearlSpaceList;
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