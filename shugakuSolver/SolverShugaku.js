const SPACE_SHUGAKU = { // From 0 to N for compatibility with SpaceNumeric
	OPEN : 0,
	ROUND : 1,
	SQUARE : 2
}

const SPACE_CROSS = 5;

function SolverShugaku(p_numberSymbolArray) {
	GeneralSolver.call(this);
	this.construct(p_numberSymbolArray);
}

// Credits about heritage : https://developer.mozilla.org/fr/docs/Learn/JavaScript/Objects/Heritage

SolverShugaku.prototype = Object.create(GeneralSolver.prototype);
SolverShugaku.prototype.constructor = SolverShugaku;

function DummySolver() {
	return new SolverShugaku([[null]]);
}

SolverShugaku.prototype.construct = function(p_numberSymbolsArray) {
	this.generalConstruct();
	this.xLength = p_numberSymbolsArray[0].length;
	this.yLength = p_numberSymbolsArray.length;
	this.fencesGrid = new FencesGrid(this.xLength, this.yLength);
	this.makeItGeographical(this.xLength, this.yLength);
	this.methodsSetDeductions = new ApplyEventMethodGeographicalPack( 
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterDominosClosure(this)]);

	this.answerArray = [];	
	
	this.squareCountingArray = []; // Empty spaces : contain coordinates of adjacent numeric spaces (if 3,3 is empty and 3,2 and 4,3 are numeric, the list is [{3,2},{4,3}]
	//Numeric spaces : number of adjacent spaces with squares and not placed yet squares // X spaces : empty
	
	this.edgesArray = []; // Quickly know about the open/closed edges
	this.numericSpaceList = []; // For quickstart
	
	var symbolOrNumber;
	for (var y = 0; y < this.yLength ; y++) {
		this.answerArray.push([]);
		this.edgesArray.push([]);
		this.squareCountingArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			symbolOrNumber = p_numberSymbolsArray[y][x];
			if (symbolOrNumber != null) {
				this.edgesArray[y].push(null);
				if (symbolOrNumber == "X") { // Totally blocking space
					this.answerArray[y].push({block : true, value : SPACE_CROSS});
					this.squareCountingArray[y].push(null);
				} else { // Numeric spaces
					this.answerArray[y].push({block : true, value : parseInt(symbolOrNumber, 10)});
					this.squareCountingArray[y].push({notSquaresYet : parseInt(symbolOrNumber, 10), notNoSquaresYet : 4 - parseInt(symbolOrNumber, 10)});
					this.numericSpaceList.push({x : x, y : y});
				}
			} else {
				this.answerArray[y].push(new SpaceNumeric(0, 2));
				this.edgesArray[y].push({closedEdges : 4, openEdge : []}); // 0 or 1 open edge, so a list ; closedEdges starts at 4 and then goes down
				this.squareCountingArray[y].push({numericNeighbors : []});
			}
		}
	}
	// Purification + telling each empty spaces what are its numeric neighbors + counting fences for non-banned spaces
	for (var y = 0; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.isBanned(x, y)) { 
				this.addBannedSpace(x, y);
				KnownDirections.forEach(dir => {
					if (this.neighborExists(x, y, dir)) {
						this.fencesGrid.setFence(x, y, dir, FENCE_STATE.CLOSED);
						if (this.isNumeric(x, y)) {
							xx = x + DeltaX[dir];
							yy = y + DeltaY[dir];
							if (!this.isBanned(xx, yy)) {
								this.squareCountingArray[yy][xx].numericNeighbors.push({x : x, y : y}); 
							} else {
								this.squareCountingArray[y][x].notNoSquaresYet--;
							}
						}
					} else { 
						if (this.isNumeric(x, y)) { // Numeric spaces on edges
							this.squareCountingArray[y][x].notNoSquaresYet--;
						}
					}
				});
			} else {
				this.existingNeighborsCoorsDirections(x, y).forEach(coors => {
					if (!this.isBanned(coors.x, coors.y)) {
						this.edgesArray[y][x].closedEdges--;
					}
				});
			}
		}
	}
	
	this.newClosedSpacesAndAround = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverShugaku.prototype.getFixedSpace = function(p_x, p_y) { 
	if (!this.answerArray[p_y][p_x].block) {
		return null;
	} else {
		return this.answerArray[p_y][p_x].value;
	}
}

SolverShugaku.prototype.isBanned = function(p_x, p_y) { 
	return this.answerArray[p_y][p_x].block;
}

SolverShugaku.prototype.isNumeric = function(p_x, p_y) { // Offensive programming : the space is assumed to be banned !
	return this.getFixedSpace(p_x, p_y) != SPACE_CROSS;
}

SolverShugaku.prototype.isOpenDraw = function(p_x, p_y) {
	return ((!this.answerArray[p_y][p_x].block) && (this.answerArray[p_y][p_x].getState(SPACE_SHUGAKU.OPEN) == SPACE_CHOICE.YES));
}

SolverShugaku.prototype.isClosedDraw = function(p_x, p_y) {
	return ((!this.answerArray[p_y][p_x].block) && (this.answerArray[p_y][p_x].getState(SPACE_SHUGAKU.OPEN) == SPACE_CHOICE.NO));
}

// Only for drawing
getFenceRightDominoDrawingClosure = function(p_solver) {
	return function(p_x, p_y) {
		return p_solver.getFenceDominoDrawingMethod(getFenceRightClosure(p_solver.fencesGrid), p_x, p_y, p_x+1, p_y);
	}
}

getFenceDownDominoDrawingClosure = function(p_solver) {
	return function(p_x, p_y) {
		return p_solver.getFenceDominoDrawingMethod(getFenceDownClosure(p_solver.fencesGrid), p_x, p_y, p_x, p_y+1);
	}
}

SolverShugaku.prototype.getFenceDominoDrawingMethod = function(p_traditionalFenceMethod, p_x, p_y, p_x2, p_y2) {
	const actualBorder = p_traditionalFenceMethod(p_x, p_y);
	if (actualBorder != FENCE_STATE.CLOSED) {
		return actualBorder;
	} else {
		if ((!this.isBanned(p_x, p_y) && (this.answerArray[p_y][p_x].getState(SPACE_SHUGAKU.OPEN) == SPACE_CHOICE.NO)) || 
			(!this.isBanned(p_x2, p_y2) && (this.answerArray[p_y2][p_x2].getState(SPACE_SHUGAKU.OPEN) == SPACE_CHOICE.NO))) {
			return FENCE_STATE.CLOSED;
		}
		return FENCE_STATE.UNDECIDED;
	}
}

//--------------------------------
// Input methods

SolverShugaku.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverShugaku.prototype.quickStart = function() { 
	this.initiateQuickStart();
	listEvents = [];
	this.numericSpaceList.forEach(coorSpace => {
		x = coorSpace.x;
		y = coorSpace.y;
		if (this.squareCountingArray[y][x].notNoSquaresYet == 0) {
			this.existingNeighborsCoorsDirections(x, y).forEach(neighborCoors => {
				if (!this.isBanned(neighborCoors.x, neighborCoors.y)) {
					listEvents.push(new SpaceEvent(neighborCoors.x, neighborCoors.y, SPACE_SHUGAKU.SQUARE, true));
				}
			});
		} else if (this.squareCountingArray[y][x].notSquaresYet == 0) {
			this.existingNeighborsCoorsDirections(x, y).forEach(neighborCoors => {
				if (!this.isBanned(neighborCoors.x, neighborCoors.y)) {
					listEvents.push(new SpaceEvent(neighborCoors.x, neighborCoors.y, SPACE_SHUGAKU.SQUARE, false));
				}
			});
		}
	});
	listEvents.forEach(event_ => {
		this.tryToPutNew(event_);
	});
	this.terminateQuickStart();
}

SolverShugaku.prototype.emitHypothesisSpace = function(p_x, p_y, p_value, p_ok) {
	if (!this.answerArray[p_y][p_x].block) {
		this.tryToPutNew(new SpaceEvent(p_x, p_y, p_value, p_ok));
	}
}

SolverShugaku.prototype.emitHypothesisRight = function(p_x, p_y, p_symbol) {
	this.tryToPutNew(new FenceShugakuEvent(p_x, p_y, DIRECTION.RIGHT, p_symbol));
}

SolverShugaku.prototype.emitHypothesisDown = function(p_x, p_y, p_symbol) {
	this.tryToPutNew(new FenceShugakuEvent(p_x, p_y, DIRECTION.DOWN, p_symbol));
}


//--------------------------------

// Doing and undoing
// Offensiveness : x and y valid, space not banned.
applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		if (p_eventToApply.kind == FENCE_EVENT_KIND) {
			// C/C from Usotatami
			const x = p_eventToApply.fenceX;
			const y = p_eventToApply.fenceY;
			const dir = p_eventToApply.direction;
			const state = p_eventToApply.state;
			const currentState = p_solver.fencesGrid.getFence(x, y, dir); // Could've been slightly optimized by some "getFenceRight/getFenceDown" and "setFenceRight/setFenceDown" but is it that much of a deal ?
			if (state == currentState) {
				return EVENT_RESULT.HARMLESS;
			} else if (currentState != FENCE_STATE.UNDECIDED) {
				return EVENT_RESULT.FAILURE;
			}
			if (state == FENCE_STATE.CLOSED) {
				p_solver.edgesArray[y][x].closedEdges++;
				p_solver.edgesArray[y + DeltaY[dir]][x + DeltaX[dir]].closedEdges++;
			} 
			p_solver.fencesGrid.setFence(x, y, dir, state);
			return EVENT_RESULT.SUCCESS;
		} else {
			return p_solver.putNewInSpace(p_eventToApply.coorX, p_eventToApply.coorY, p_eventToApply.symbol, p_eventToApply.choice);
		}
	}
}

// Offensive programming : x and y are within bounds (and that's it, block spaces are checked first. Because beware of intrusions... looking at you, 2x2 square checker.)
SolverShugaku.prototype.putNewInSpace = function(p_x, p_y, p_symbol, p_choice) {
	if (this.isBanned(p_x, p_y)) {
		if (p_symbol == SPACE_SHUGAKU.OPEN && p_choice == false) { // This check is mandatory only because banned spaces have a format different from non-banned ones.
			return EVENT_RESULT.HARMLESS;
		} else {
			return EVENT_RESULT.FAILURE;
		}
	}
	const currentSymbol = this.answerArray[p_y][p_x].getValue(); 
	if (p_choice && (currentSymbol != null) && (p_symbol != currentSymbol)) {
		return EVENT_RESULT.FAILURE;
	}
	const currentState = (this.answerArray[p_y][p_x].getState(p_symbol));
	if (currentState == SPACE_CHOICE.YES) {
		return p_choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
	} else if (currentState == SPACE_CHOICE.NO) {
		return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
	} 
	if (p_choice) {
		this.answerArray[p_y][p_x].choose(p_symbol);
		if (p_symbol == SPACE_SHUGAKU.SQUARE) {
			this.squareCountingArray[p_y][p_x].numericNeighbors.forEach(coors => {
				this.squareCountingArray[coors.y][coors.x].notSquaresYet--; // TODO : Be careful with "notSquares" and "notNoSquares" !
			});
		}
	} else {
		this.answerArray[p_y][p_x].ban(p_symbol);
		if (p_symbol == SPACE_SHUGAKU.SQUARE) {
			this.squareCountingArray[p_y][p_x].numericNeighbors.forEach(coors => {
				this.squareCountingArray[coors.y][coors.x].notNoSquaresYet--;
			});
		}
	}
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.kind != FENCE_EVENT_KIND) {
			const x = p_eventToUndo.coorX;
			const y = p_eventToUndo.coorY;
			const wasSquare = p_eventToUndo.symbol == SPACE_SHUGAKU.SQUARE;
			if (p_eventToUndo.choice) {
				p_solver.answerArray[y][x].unchoose(p_eventToUndo.symbol); 
				if (wasSquare) {
					p_solver.squareCountingArray[y][x].numericNeighbors.forEach(coors => {
						p_solver.squareCountingArray[coors.y][coors.x].notSquaresYet++;
					});
				}
			} else {
				p_solver.answerArray[y][x].unban(p_eventToUndo.symbol);
				if (wasSquare) {
					p_solver.squareCountingArray[y][x].numericNeighbors.forEach(coors => {
						p_solver.squareCountingArray[coors.y][coors.x].notNoSquaresYet++;
					});
				}
			}
		} else {
			const x = p_eventToUndo.fenceX;
			const y = p_eventToUndo.fenceY;
			const dir = p_eventToUndo.direction;
			if (p_eventToUndo.state == FENCE_STATE.CLOSED) {
				p_solver.edgesArray[y][x].closedEdges--;
				p_solver.edgesArray[y + DeltaY[dir]][x + DeltaX[dir]].closedEdges--;
			} 
			p_solver.fencesGrid.setFence(x, y, dir, FENCE_STATE.UNDECIDED);
		}
	}
}

//--------------------------------

// Central method
SolverShugaku.prototype.tryToPutNew = function (p_event) {
	this.tryToApplyHypothesis(p_event, this.methodsSetDeductions);
}

//--------------------------------

// Exchanges solver and geographical

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SolveEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, SPACE_SHUGAKU.OPEN, p_geographicalDeduction.opening == ADJACENCY.YES);
    } 
};

adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
		if (p_solver.isBanned(p_x, p_y)) {
			return ADJACENCY.NO;
		}
        switch (p_solver.answerArray[p_y][p_x].getState(SPACE_SHUGAKU.OPEN)) {
			case SPACE_CHOICE.YES : return ADJACENCY.YES; break;
			case SPACE_CHOICE.NO : return ADJACENCY.NO; break;
			default : return ADJACENCY.UNDECIDED; break;
        }
    }
}

//--------------------------------

// Intelligence

// Deductions closure. Where intelligence begins !
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind != FENCE_EVENT_KIND) {
			// TODO : if two identical shapes are adjacent from each other, close the fence between them.
			
			const x = p_eventBeingApplied.coorX;
			const y = p_eventBeingApplied.coorY;
			const choice = p_eventBeingApplied.choice;
			const symbol = p_eventBeingApplied.symbol;
			if (symbol == SPACE_SHUGAKU.OPEN) {
				if (choice) { // Space is open
					p_listEventsToApply = deductionsDiscardChoices(p_listEventsToApply, x, y, SPACE_SHUGAKU.SQUARE, SPACE_SHUGAKU.ROUND);
					// 4 fences to close
					KnownDirections.forEach(dd => {
						if (p_solver.neighborExists(x, y, dd)) {
							p_listEventsToApply.push(new FenceShugakuEvent(x, y, dd, FENCE_STATE.CLOSED));
						}
					});
					p_listEventsToApply = p_solver.alert2x2Areas(p_listEventsToApply, p_solver.methodsSetDeductions, x, y); 
				} else { // Space is closed
					p_listEventsToApply = p_solver.deductionsChooseOneEventLeft(p_listEventsToApply, x, y, SPACE_SHUGAKU.SQUARE, SPACE_SHUGAKU.ROUND);
					if (p_solver.answerArray[y][x].getState(SPACE_SHUGAKU.OPEN) == SPACE_CHOICE.NO) {
						p_listEventsToApply = p_solver.deductionsOpenLastUndecidedFence(p_listEventsToApply, x, y);
					}
					// Add itself to "spaces to check" and adjacent closed spaces. So when filter occurs we will be able to see when a domino is about to be fully surrounded.
				}
			}
			if (symbol == SPACE_SHUGAKU.SQUARE) {
				if (choice) {
					p_listEventsToApply = deductionsDiscardChoices(p_listEventsToApply, x, y, SPACE_SHUGAKU.ROUND, SPACE_SHUGAKU.OPEN);
					// Position of square in a vertical domino
					if (y <= p_solver.yLength-2) {
						p_listEventsToApply.push(new FenceShugakuEvent(x, y, DIRECTION.DOWN, FENCE_STATE.CLOSED));
					}
					
					// Neighboring numeric spaces
					p_solver.squareCountingArray[y][x].numericNeighbors.forEach(coors => {
						p_listEventsToApply = p_solver.deductionsFillAroundWithNOSquares(p_listEventsToApply, coors.x, coors.y);
					});
					
					p_listEventsToApply = p_solver.deductionDominoFormations(p_listEventsToApply, x, y, SPACE_SHUGAKU.SQUARE, SPACE_SHUGAKU.ROUND);
					p_solver.existingNeighborsCoorsDirections(x, y).forEach(coors => {
						p_solver.newClosedSpacesAndAround.add(coors.x, coors.y);
					});
				} else {
					p_listEventsToApply = p_solver.deductionsChooseOneEventLeft(p_listEventsToApply, x, y, SPACE_SHUGAKU.ROUND, SPACE_SHUGAKU.OPEN);
					// Neighboring numeric spaces
					p_solver.squareCountingArray[y][x].numericNeighbors.forEach(coors => {
						p_listEventsToApply = p_solver.deductionsFillAroundWithSquares(p_listEventsToApply, coors.x, coors.y);
					});
				}
			}
			if (symbol == SPACE_SHUGAKU.ROUND) {
				if (choice) {
					p_listEventsToApply = deductionsDiscardChoices(p_listEventsToApply, x, y, SPACE_SHUGAKU.OPEN, SPACE_SHUGAKU.SQUARE);
					// Position of round in a vertical domino
					if (y > 0) {
						p_listEventsToApply.push(new FenceShugakuEvent(x, y, DIRECTION.UP, FENCE_STATE.CLOSED));
					}
					p_listEventsToApply = p_solver.deductionDominoFormations(p_listEventsToApply, x, y, SPACE_SHUGAKU.ROUND, SPACE_SHUGAKU.SQUARE);
					p_solver.existingNeighborsCoorsDirections(x, y).forEach(coors => {
						p_solver.newClosedSpacesAndAround.add(coors.x, coors.y);
					});
				} else {
					p_listEventsToApply = p_solver.deductionsChooseOneEventLeft(p_listEventsToApply, x, y, SPACE_SHUGAKU.OPEN, SPACE_SHUGAKU.SQUARE);
				}
			}
		} else {
			const dir = p_eventBeingApplied.direction;
			const x = p_eventBeingApplied.fenceX;
			const y = p_eventBeingApplied.fenceY;
			const dx = x+DeltaX[dir];
			const dy = y+DeltaY[dir];
			if (p_eventBeingApplied.state == FENCE_STATE.OPEN) {
				// Make spaces closed
				var xx, yy;
				p_listEventsToApply = deductionsCloseSpace(p_listEventsToApply, x, y);
				p_listEventsToApply = deductionsCloseSpace(p_listEventsToApply, dx, dy);
				
				//Add fences
				if (p_solver.neighborExists(dx, dy, dir)) {
					p_listEventsToApply.push(new FenceShugakuEvent(dx, dy, dir, FENCE_STATE.CLOSED));
				}
				dd = OppositeDirection[dir];
				if (p_solver.neighborExists(x, y, dd)) {
					p_listEventsToApply.push(new FenceShugakuEvent(x, y, dd, FENCE_STATE.CLOSED));
				}
				[TurningLeftDirection[dir], TurningRightDirection[dir]].forEach(dd => {
					xx = x+DeltaX[dir];
					yy = y+DeltaY[dir];
					if (p_solver.neighborExists(x, y, dd)) {
						p_listEventsToApply.push(new FenceShugakuEvent(xx, yy, dd, FENCE_STATE.CLOSED));
						p_listEventsToApply.push(new FenceShugakuEvent(x, y, dd, FENCE_STATE.CLOSED));
					}
				});
				
				// Vertical one ? Place a square and a round now !
				if (dir == DIRECTION.UP) {
					p_listEventsToApply.push(new SpaceEvent(x, dy, SPACE_SHUGAKU.ROUND, true));
					p_listEventsToApply.push(new SpaceEvent(x, y, SPACE_SHUGAKU.SQUARE, true));
				} else if (dir == DIRECTION.DOWN) {
					p_listEventsToApply.push(new SpaceEvent(x, y, SPACE_SHUGAKU.ROUND, true));
					p_listEventsToApply.push(new SpaceEvent(x, dy, SPACE_SHUGAKU.SQUARE, true));
				}
				// Horizontal one ? 
				if (dir == DIRECTION.LEFT) {
					p_listEventsToApply = p_solver.deductionsCompleteHorizontalDomino(p_listEventsToApply, dx, y);
				} else if (dir == DIRECTION.RIGHT) {
					p_listEventsToApply = p_solver.deductionsCompleteHorizontalDomino(p_listEventsToApply, x, y);
				}
				
				p_solver.newClosedSpacesAndAround.add(x, y);
				p_solver.newClosedSpacesAndAround.add(dx, dy);
			} else {
				// Note : Both parts of the fences need to be checked, not only the "x,y" one !
				// All but one fences are open in a closed space ? Open the 4th fence ! 
				if (p_solver.answerArray[y][x].getState(SPACE_SHUGAKU.OPEN) == SPACE_CHOICE.NO) {
					p_listEventsToApply = p_solver.deductionsOpenLastUndecidedFence(p_listEventsToApply, x, y);
				}
				if (p_solver.answerArray[dy][dx].getState(SPACE_SHUGAKU.OPEN) == SPACE_CHOICE.NO) {
					p_listEventsToApply = p_solver.deductionsOpenLastUndecidedFence(p_listEventsToApply, dx, dy);
				}
				// All 4 fences are closed ? Open the space !
				if (p_solver.edgesArray[y][x].closedEdges == 4) {
					p_listEventsToApply.push(new SpaceEvent(x, y, SPACE_SHUGAKU.OPEN, true));
				}
				if (p_solver.edgesArray[dy][dx].closedEdges == 4) {
					p_listEventsToApply.push(new SpaceEvent(dx, dy, SPACE_SHUGAKU.OPEN, true));
				}
			}
			
		}
		return p_listEventsToApply;
	}
}

SolverShugaku.prototype.deductionDominoFormations = function(p_listEventsToApply, p_x, p_y, p_thisSymbol, p_otherSymbol) {
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
		if (this.fencesGrid.getFence(p_x, p_y, coorsDir.direction) == FENCE_STATE.OPEN) { // Open fence, create two symbols for a domino
			p_listEventsToApply.push(new SpaceEvent(coorsDir.x, coorsDir.y, p_otherSymbol, true));
		}
		if (!this.isBanned(coorsDir.x, coorsDir.y) && this.answerArray[coorsDir.y][coorsDir.x].getValue() == p_thisSymbol) { // Separate identical symbols
			p_listEventsToApply.push(new FenceShugakuEvent(p_x, p_y, coorsDir.direction, FENCE_STATE.CLOSED));
		}
	});
	return p_listEventsToApply;
}

// TODO trouver de meilleurs noms
deductionsDiscardChoices = function(p_listEventsToApply, p_x, p_y, p_choice1, p_choice2) {
	p_listEventsToApply.push(new SpaceEvent(p_x, p_y, p_choice1, false));
	p_listEventsToApply.push(new SpaceEvent(p_x, p_y, p_choice2, false));
	return p_listEventsToApply;
}

SolverShugaku.prototype.deductionsChooseOneEventLeft = function(p_listEventsToApply, p_x, p_y, p_choice1, p_choice2) {
	if (this.answerArray[p_y][p_x].getState(p_choice1) == SPACE_CHOICE.NO) {
		p_listEventsToApply.push(new SpaceEvent(p_x, p_y, p_choice2, true));
	}
	if (this.answerArray[p_y][p_x].getState(p_choice2) == SPACE_CHOICE.NO) {
		p_listEventsToApply.push(new SpaceEvent(p_x, p_y, p_choice1, true));
	}
	return p_listEventsToApply;
}

function deductionsCloseSpace(p_listEventsToApply, p_x, p_y) {
	p_listEventsToApply.push(new SpaceEvent(p_x, p_y, SPACE_SHUGAKU.OPEN,false));
	return p_listEventsToApply;
}

// p_x, p_y = space on the left
SolverShugaku.prototype.deductionsCompleteHorizontalDomino = function(p_listEventsToApply, p_x, p_y) {
	if (this.answerArray[p_y][p_x].getState(SPACE_SHUGAKU.ROUND) == SPACE_CHOICE.YES) {
		p_listEventsToApply.push(new SpaceEvent(p_x + 1, p_y, SPACE_SHUGAKU.SQUARE, true));
	} else if (this.answerArray[p_y][p_x].getState(SPACE_SHUGAKU.SQUARE) == SPACE_CHOICE.YES) {
		p_listEventsToApply.push(new SpaceEvent(p_x + 1, p_y, SPACE_SHUGAKU.ROUND, true));
	}
	if (this.answerArray[p_y][p_x + 1].getState(SPACE_SHUGAKU.ROUND) == SPACE_CHOICE.YES) {
		p_listEventsToApply.push(new SpaceEvent(p_x, p_y, SPACE_SHUGAKU.SQUARE, true));
	} else if (this.answerArray[p_y][p_x + 1].getState(SPACE_SHUGAKU.SQUARE) == SPACE_CHOICE.YES) {
		p_listEventsToApply.push(new SpaceEvent(p_x, p_y, SPACE_SHUGAKU.ROUND, true));
	}
	return p_listEventsToApply;
}

// p_x, p_y must be a numeric space. 
SolverShugaku.prototype.deductionsFillAroundWithSquares = function(p_listEventsToApply, p_x, p_y) {
	if (this.squareCountingArray[p_y][p_x].notNoSquaresYet == 0) {
		p_listEventsToApply = this.deductionsTryAndFillSquaresOrNot(p_listEventsToApply, p_x, p_y, true);
	}
	return p_listEventsToApply;
}

SolverShugaku.prototype.deductionsFillAroundWithNOSquares = function(p_listEventsToApply, p_x, p_y) {
	if (this.squareCountingArray[p_y][p_x].notSquaresYet == 0) {
		p_listEventsToApply = this.deductionsTryAndFillSquaresOrNot(p_listEventsToApply, p_x, p_y, false);
	}
	return p_listEventsToApply;
}

SolverShugaku.prototype.deductionsTryAndFillSquaresOrNot = function(p_listEventsToApply, p_x, p_y, p_shouldBeSquare) {
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coors => {
		if (!this.isBanned(coors.x, coors.y) && this.answerArray[coors.y][coors.x].getState(SPACE_SHUGAKU.SQUARE) == SPACE_CHOICE.UNDECIDED) {
			p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, SPACE_SHUGAKU.SQUARE, p_shouldBeSquare)); 
		}
	});
	return p_listEventsToApply;
}

// Search for the last ... 
SolverShugaku.prototype.deductionsOpenLastUndecidedFence = function(p_listEventsToApply, p_x, p_y) {
	if (this.edgesArray[p_y][p_x].closedEdges == 3) {
		this.existingNeighborsDirections(p_x, p_y).forEach(dir => {
			if (this.fencesGrid.getFence(p_x, p_y, dir) != FENCE_STATE.CLOSED) {
				p_listEventsToApply.push(new FenceShugakuEvent(p_x, p_y, dir, FENCE_STATE.OPEN));
			}
		});
	}
	return p_listEventsToApply;
}

// --------------------
// Filters

function abortClosure(p_solver) {
	return function() {
		p_solver.newClosedSpacesAndAround.clean();
	}
}

function filterDominosClosure(p_solver) { // Look for dominos that have been formed AND at spaces that have a newly closed space around them : no domino shall remain fully surrounded !
	return function() {
		var x, y, xx, yy;
		var listEvents = [];
		p_solver.newClosedSpacesAndAround.list.forEach(coors => {
			x = coors.x;
			y = coors.y;
			if (listEvents == EVENT_RESULT.FAILURE) {
				return;
			}
			xx = null; // Check if a space has not already been treated, if it is closed and then if it belongs to a domino, then identify the domino with x, y, xx, yy
			if ((!p_solver.isBanned(x, y)) && (p_solver.newClosedSpacesAndAround.array[y][x]) && p_solver.answerArray[y][x].getState(SPACE_SHUGAKU.OPEN) == SPACE_CHOICE.NO) {				
				p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => { // Direction selection is optimizable, but does it matter ?
					if (p_solver.fencesGrid.getFence(x, y, coorsDir.direction) == FENCE_STATE.OPEN) {
						xx = coorsDir.x;
						yy = coorsDir.y;
						directionDomino = coorsDir.direction;
						p_solver.newClosedSpacesAndAround.cleanOne(xx, yy); // Make sure the other domino space won't be checked again
					}
				});
				if (xx != null) {
					// Look around domino (sahd = summary around half domino)
					autoLogFilter("We will watch domino on " + x + "," + y + ";" + xx + "," + yy);
					const SAHD1 = p_solver.threeSpacesAroundHalfDomino(x, y, directionDomino);
					const SAHD2 = p_solver.threeSpacesAroundHalfDomino(xx, yy, OppositeDirection[directionDomino]);
					if (!SAHD1.openFound && !SAHD2.openFound) {
						xToOpen = null;
						if (SAHD1.xUndecided == null && !SAHD1.foundAtLeastOne && SAHD2.xUndecided != null) { 
							xToOpen = SAHD2.xUndecided;
							yToOpen = SAHD2.yUndecided;
						}
						if (SAHD2.xUndecided == null && !SAHD2.foundAtLeastOne && SAHD1.xUndecided != null) {
							xToOpen = SAHD1.xUndecided;
							yToOpen = SAHD1.yUndecided;
						}
						if (xToOpen != null) {
							autoLogFilter("Waaay ok");
							listEvents.push(new SpaceEvent(xToOpen, yToOpen, SPACE_SHUGAKU.OPEN, true));
						}
						if (!SAHD1.foundAtLeastOne && !SAHD2.foundAtLeastOne) {
							listEvents = EVENT_RESULT.FAILURE;
						}
					}					
				} 
			}
		});
		p_solver.newClosedSpacesAndAround.clean();
		return listEvents;
	}
}

SolverShugaku.prototype.threeSpacesAroundHalfDomino = function(p_xDomino, p_yDomino, p_directionOtherHalf) {
	var openFound = false;
	var xUndecided = null;
	var yUndecided;
	var foundAtLeastOne = false;
	autoLogFilter("Half domino " + p_xDomino + "," + p_yDomino + ", direction " + stringDirection(p_directionOtherHalf));
	this.existingNeighborsCoorsDirections(p_xDomino, p_yDomino).forEach(coorsDirAD => { // AD = around domino
		if (coorsDirAD.direction != p_directionOtherHalf) {
			xxx = coorsDirAD.x;
			yyy = coorsDirAD.y;
			if (!this.isBanned(xxx, yyy)) {
				state = this.answerArray[yyy][xxx].getState(SPACE_SHUGAKU.OPEN);
				if (state == SPACE_CHOICE.YES) {
					openFound = true;
				} else if (state == SPACE_CHOICE.UNDECIDED) {
					if (foundAtLeastOne) {						
						xUndecided = null;
						autoLogFilter("Found several");
					} else {
						foundAtLeastOne = true;
						xUndecided = xxx;
						yUndecided = yyy;
						autoLogFilter(xxx + " " + yyy);
					}
				}
			}
		}
	}); // A null value for xUndecided can mean that either 2 or 0 undecided spaces have been found.
	return {openFound : openFound, foundAtLeastOne : foundAtLeastOne, xUndecided : xUndecided, yUndecided : yUndecided}
}