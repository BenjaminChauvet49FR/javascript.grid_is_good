const NOT_FORCED = -1;

function SolverLinesweeper(p_symbolGrid) {
	LoopSolver.call(this);
	this.construct(p_symbolGrid);
}

SolverLinesweeper.prototype = Object.create(LoopSolver.prototype);
SolverLinesweeper.prototype.constructor = SolverLinesweeper;

function DummySolver() {
	return new SolverLinesweeper(generateSymbolArray(1,1));
}

LOOP_PASS_CATEGORY.NUMBER_LINESWEEPER = -1;

SolverLinesweeper.prototype.construct = function(p_numberGrid) {
    this.xLength = p_numberGrid[0].length;
	this.yLength = p_numberGrid.length;
	this.loopSolverConstruct( 
	{	setSpaceLinkedPSAtomicDos : setSpaceLinkedPSAtomicDosClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedPSAtomicUndosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedPSAtomicUndosClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedPSDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		generateEventsForPassPS : generateEventsForAroundSpacePassClosureLinesweeper(this),
		orderedListPassArgumentsPS : startingOrderedListPassArgumentsLinesweeperClosure(this),
		namingCategoryPS : namingCategoryPassClosure(this),
		multipassPessimismPS : true,
		passDefineTodoPSMethod : function(p_categoryPass) {
			return (this.numericArray[p_categoryPass.y][p_categoryPass.x].notLinkedYet != 0); // Supposes that all spaces in multipass correspond to clues
		}
		
	});

	this.numericArray = [];
	this.neighborsNumbersArray = []; // All coordinates contained in this grid are coordinates of numeric spaces.
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.neighborsNumbersArray.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			this.neighborsNumbersArray[iy].push([]);
		}
	}
	
	var numberXNull;
	this.numericCoordinatesList = []; // List of coordinates of numeric spaces ; also public for drawing
	this.xCoordinatesList = []; // Public for drawing
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		this.numericArray.push([]);
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			numberXNull = p_numberGrid[iy][ix];
			if (numberXNull != null) {
				if (isNaN(numberXNull)) {
					this.numericArray[iy].push({number : NOT_FORCED});
					this.xCoordinatesList.push({x : ix, y : iy});
				} else {					
					this.numericCoordinatesList.push({x : ix, y : iy});
					// Numbers set to -1 to avoid screwing up
					this.numericArray[iy].push({number : parseInt(numberXNull, 10), notClosedYet : -1, notLinkedYet : -1});
					this.existingNeighborsCoorsWithDiagonals(ix, iy).forEach(coors  => {
						this.neighborsNumbersArray[coors.y][coors.x].push({x : ix, y : iy});					
					});
				}
            } else {
				this.numericArray[iy].push({number : null});
			}
		}
	}
	
	// In this puzzle, banning requires to use neighborsNumbersArray and numericArray. Since only atomic events are performed (no check, no need for consistency) it's fine. 
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (this.getNumber(ix, iy) != null) {
				this.banSpace(ix, iy);
			}
		}
	}

	// Correctly giving the values to notClosedYet and notLinkedYet (as they were potentially screwed by ban)
	var existingNeighbors;
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			numberXNull = this.getNumber(ix, iy);
			if (numberXNull != null && numberXNull != NOT_FORCED) {
				existingNeighbors = this.existingNeighborsCoorsWithDiagonals(ix, iy);
				this.numericArray[iy][ix].notClosedYet = existingNeighbors.length - numberXNull;
				this.numericArray[iy][ix].notLinkedYet = numberXNull;
				existingNeighbors.forEach(coors => {
					if (this.getNumber(coors.x, coors.y) != null) {
						this.numericArray[iy][ix].notClosedYet--;
					}
				});
				
			}
		}
	}
	
	// Note : Xs not drawn but managed. Also see Koburin
}

// -------------------
// Getters and setters

SolverLinesweeper.prototype.getNumber = function(p_x, p_y) {
	return this.numericArray[p_y][p_x].number;
}

// -------------------
// Input methods

SolverLinesweeper.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverLinesweeper.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverLinesweeper.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverLinesweeper.prototype.passSpace = function(p_x, p_y) {
	var indexPass;
	if (this.numericArray[p_y][p_x].number != null && this.numericArray[p_y][p_x].number != NOT_FORCED) {		
		indexPass = {passCategory : LOOP_PASS_CATEGORY.NUMBER_LINESWEEPER, x : p_x, y : p_y};
	} else {
		indexPass = {passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	}
	return this.passLoop(indexPass); 
}

SolverLinesweeper.prototype.makeMultipass = function() {
	this.multipassLoop();
}

// -------------------
// Atomic closures 

function setSpaceLinkedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersArray[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericArray[neighborSpace.y][neighborSpace.x].notLinkedYet--;
		});
	}
}

function setSpaceClosedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersArray[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericArray[neighborSpace.y][neighborSpace.x].notClosedYet--;
		});
	}
}

function setSpaceLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersArray[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericArray[neighborSpace.y][neighborSpace.x].notLinkedYet++;
		});
	}
}

function setSpaceClosedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		p_solver.neighborsNumbersArray[p_space.y][p_space.x].forEach(neighborSpace => {
			p_solver.numericArray[neighborSpace.y][neighborSpace.x].notClosedYet++;
		});
	}
}

// -------------------
// Closure deduction

function setSpaceClosedPSDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		p_solver.neighborsNumbersArray[y][x].forEach(space => {
			p_solver.deductionsTestNumericSpace(p_listEventsToApply, space.x, space.y); 
		});
	}
}

function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		p_solver.neighborsNumbersArray[y][x].forEach(space => {
			p_solver.deductionsTestNumericSpace(p_listEventsToApply, space.x, space.y);
		});
	}
}

// Precondition : p_x, p_y is a numeric space
SolverLinesweeper.prototype.deductionsTestNumericSpace = function(p_listEventsToApply, p_x, p_y) {
	if (this.numericArray[p_y][p_x].notClosedYet == 0) {
		var x, y;
		this.existingNeighborsCoorsWithDiagonals(p_x, p_y).forEach(coors => {
			x = coors.x;
			y = coors.y;
			if (this.getLinkSpace(x, y) == LOOP_STATE.UNDECIDED) {
				p_listEventsToApply.push(new SpaceEvent(x, y, LOOP_STATE.LINKED));
			}
		});
	} else if (this.numericArray[p_y][p_x].notLinkedYet == 0) {
		this.existingNeighborsCoorsWithDiagonals(p_x, p_y).forEach(coors => {
			x = coors.x;
			y = coors.y;
			if (this.getLinkSpace(x, y) == LOOP_STATE.UNDECIDED) {
				p_listEventsToApply.push(new SpaceEvent(x, y, LOOP_STATE.CLOSED));
			}
		});
	} 
}

// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_listQSEvents) {
		p_listQSEvents.push({quickStartLabel : "Linesweeper"});
		p_solver.numericCoordinatesList.forEach(space => {
			 p_solver.deductionsTestNumericSpace(p_listQSEvents, space.x, space.y); 
		});
	}
}

// -------------------
// Passing & multipassing

generateEventsForAroundSpacePassClosureLinesweeper = function(p_solver) {
	return function(p_space) {
		const number = p_solver.getNumber(p_space.x, p_space.y);
		if (number != null && number != NOT_FORCED) {
			var listPass = [];
			p_solver.existingNeighborsCoorsWithDiagonals(p_space.x, p_space.y).forEach(coors => {
				listPass.push([new SpaceEvent(coors.x, coors.y, LOOP_STATE.CLOSED),
						new SpaceEvent(coors.x, coors.y, LOOP_STATE.LINKED)]);
			});
			return listPass;
		} 
		return [];
	}
}


function startingOrderedListPassArgumentsLinesweeperClosure(p_solver) {
	return function() {
		return copyCoordinatesList(p_solver.numericCoordinatesList);
	}
}

function namingCategoryPassClosure(p_solver) {
	return function (p_indexPass) {
		const x = p_indexPass.x;
		const y = p_indexPass.y;
		return "(number " + p_solver.numericArray[y][x].number + ") " + x + "," + y ;
	}
}