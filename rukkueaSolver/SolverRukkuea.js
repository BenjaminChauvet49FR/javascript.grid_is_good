// Setup
function SolverRukkuea(p_numbersArray) {
	GeneralSolver.call(this);
	this.construct(p_numbersArray);
}

function DummySolver() {	
	return new SolverRukkuea([[null]]);
}

SolverRukkuea.prototype = Object.create(GeneralSolver.prototype);
SolverRukkuea.prototype.constructor = SolverRukkuea;

SolverRukkuea.prototype.construct = function(p_numbersArray) {
	this.generalConstruct();

	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [lookForSquareClosure(this)]);

	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generatePassEventsClosure(this), 
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this), 
		passTodoMethod : multipassDefineTodoClosure(this)};
		
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}	

	this.xLength = p_numbersArray[0].length;
	this.yLength = p_numbersArray.length;
	
	this.answerArray = generateValueArray(this.xLength, this.yLength, FILLING.UNDECIDED);
	this.squareSizeArray = generateValueArray(this.xLength, this.yLength, null);
	this.viewArray = generateFunctionValueArray(this.xLength, this.yLength, function(){ return [null, null, null, null]}); // Supposes that all four directions are 1, 2, 3, 4
	// Definition and setup 
	this.numericArray = [];
	this.numberedSpacesCoors = [];
	for (y = 0 ; y < this.yLength ; y++) { 
		this.numericArray.push([]);
		for (x = 0 ; x < this.xLength ; x++) {
			this.numericArray[y].push({
				value : p_numbersArray[y][x],
				numberedNeighborsCoors : [],
				notPlacedOsYet : p_numbersArray[y][x],
				notPlacedXsYet : null
			});
			if (p_numbersArray[y][x] != null) {
				this.numberedSpacesCoors.push({x : x, y : y});
				this.numericArray[y][x].numberedNeighborsCoors = [{x : x, y : y}];
			}
		}
	}
	this.numberedSpacesCoors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		space = this.numericArray[y][x];
		space.notPlacedXsYet = 1 - space.notPlacedOsYet;
		this.existingNeighborsCoorsDirections(x, y).forEach(coors2 => {
			space.notPlacedXsYet++;
			this.numericArray[coors2.y][coors2.x].numberedNeighborsCoors.push({x : x, y : y});
		});
	});
	this.newlyAffectedRectChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.squareCheckedChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)
SolverRukkuea.prototype.getAnswer = function(p_x, p_y) {
	return this.answerArray[p_y][p_x];
}

SolverRukkuea.prototype.getNumber = function(p_x, p_y) {
	return this.numericArray[p_y][p_x].value;
}

//--------------------------------

// Input methods

SolverRukkuea.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverRukkuea.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverRukkuea.prototype.emitPassRowColumn = function(p_x, p_y) {
	const generatedEvents = this.generatePassEventsMethod(p_x, p_y);
	this.passEvents(generatedEvents, {x : p_x, y : p_y}); 
}

SolverRukkuea.prototype.makeMultiPass = function() {	
	this.multiPass(this.methodsSetMultipass);
}

SolverRukkuea.prototype.makeTotalPass = function() {	
	const eventsForPass = this.generateTotalPassEventsMethod();
	return this.passEvents(eventsForPass, {totalPass : true, numberSpaces : eventsForPass.length});
}

SolverRukkuea.prototype.passSelectedSpaces = function(p_coorsList) {
	const eventsForPass = this.generateEventsForSpacesList(p_coorsList);
	return this.passEvents(eventsForPass, {isCustom : true, numberSpaces : eventsForPass.length});
}

SolverRukkuea.prototype.makeQuickStart = function() {
	this.quickStart();
}

//--------------------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_event) {
		const x = p_event.x;
		const y = p_event.y;
		switch (p_event.kind) {
			case SPACE_KIND :
				const symbol = p_event.symbol
				if (p_solver.answerArray[y][x] == symbol) {
					return EVENT_RESULT.HARMLESS;
				}
				if (p_solver.answerArray[y][x] != FILLING.UNDECIDED) {
					return EVENT_RESULT.FAILURE;
				}
				p_solver.answerArray[y][x] = symbol;
				if (symbol == FILLING.YES) {
					p_solver.newlyAffectedRectChecker.add(x, y);
					p_solver.numericArray[y][x].numberedNeighborsCoors.forEach(coors => {
						p_solver.numericArray[coors.y][coors.x].notPlacedOsYet--;
					});
				} else {
					p_solver.existingNeighborsCoors(x, y).forEach(coors => {
						if (p_solver.answerArray[coors.y][coors.x] == FILLING.YES) {
							p_solver.newlyAffectedRectChecker.add(coors.x, coors.y);
						}
					});
					p_solver.numericArray[y][x].numberedNeighborsCoors.forEach(coors => {
						p_solver.numericArray[coors.y][coors.x].notPlacedXsYet--;
					});
				}
				// Numbers ... 
				return EVENT_RESULT.SUCCESS;
			break;
			case SIZE_KIND :
				const formerSize = p_solver.squareSizeArray[y][x];
				if (formerSize == p_event.size) {
					return EVENT_RESULT.HARMLESS;
				} else if (formerSize != null) {
					return EVENT_RESULT.FAILURE; // Should not happen as size is defined when a square is closed but who knows
				} else {
					for (var dirV = 0 ; dirV <= 3 ; dirV ++) {
						if (p_solver.viewArray[y][x][dirV] == p_event.size) { //Direction supposition
							return EVENT_RESULT.FAILURE;
						}
					};
				}
				p_solver.squareSizeArray[y][x] = p_event.size;
				return EVENT_RESULT.SUCCESS;
			break;
			case VIEW_KIND :
				const dir = p_event.direction;
				const formerSizeV = p_solver.viewArray[y][x][dir]; // "Identifier 'formerSize' has already been declared ... "
				if (formerSizeV == p_event.size) {
					return EVENT_RESULT.HARMLESS;
				} else if (formerSizeV != null) {
					return EVENT_RESULT.FAILURE; // Should not happen as size is defined when a square is closed but who knows
				} else {
					if (p_solver.squareSizeArray[y][x] == p_event.size) { // If it is seen by a square with the same size : fail HERE !
						return EVENT_RESULT.FAILURE;
					}
				}
				p_solver.viewArray[y][x][dir] = p_event.size;
				return EVENT_RESULT.SUCCESS;
			break;
		}
	}
}

undoEventClosure = function(p_solver) {
	return function(p_event) {
		const x = p_event.x;
		const y = p_event.y;
		const symbol = p_event.symbol;
		switch (p_event.kind) {
			case SPACE_KIND :
				var discardedSymbol = p_solver.answerArray[y][x]; 
				p_solver.answerArray[y][x] = FILLING.UNDECIDED;
				if (discardedSymbol == FILLING.YES) {
					p_solver.numericArray[y][x].numberedNeighborsCoors.forEach(coors => {
						p_solver.numericArray[coors.y][coors.x].notPlacedOsYet++;
					});
				} else {
					p_solver.numericArray[y][x].numberedNeighborsCoors.forEach(coors => {
						p_solver.numericArray[coors.y][coors.x].notPlacedXsYet++;
					});
				}
			break;
			case SIZE_KIND :
				p_solver.squareSizeArray[y][x] = null;
			break;
			case VIEW_KIND :
				p_solver.viewArray[y][x][p_event.direction] = null;
			break;
		}
	} 
}

function isSpaceEvent(p_event) {
	return p_event.symbol;
}

//--------------------------------
// Quickstart !

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvts = [{quickStartLabel : "Rukkuea"}];
		var x, y;
		p_solver.numberedSpacesCoors.forEach(coors => {
			x = coors.x;
			y = coors.y;
			listQSEvts = p_solver.checkZeroNosDeductions(listQSEvts, x, y);
			listQSEvts = p_solver.checkZeroYesDeductions(listQSEvts, x, y);
			if (p_solver.numericArray[y][x].value == 2) {
				listQSEvts.push(new SpaceEvent(x, y, FILLING.NO));
			}
			if (p_solver.numericArray[y][x].value == 4) {
				listQSEvts.push(new SpaceEvent(x, y, FILLING.YES));
			}
		});
		for (x = 0 ; x < p_solver.xLength ; x++) {
			if (p_solver.numericArray[0][x].value == 3) {
				listQSEvts.push(new SpaceEvent(x, 0, FILLING.YES)); // Note : xLength and yLength >= 2
				listQSEvts.push(new SpaceEvent(x, 1, FILLING.YES));
			}
			if (p_solver.numericArray[p_solver.yLength-1][x].value == 3) {
				listQSEvts.push(new SpaceEvent(x, p_solver.yLength-1, FILLING.YES));
				listQSEvts.push(new SpaceEvent(x, p_solver.yLength-2, FILLING.YES));
			}
		}
		for (y = 0 ; y < p_solver.yLength ; y++) {
			if (p_solver.numericArray[y][0].value == 3) {
				listQSEvts.push(new SpaceEvent(0, y, FILLING.YES));
				listQSEvts.push(new SpaceEvent(1, y, FILLING.YES));
			}
			if (p_solver.numericArray[y][p_solver.xLength-1].value == 3) {
				listQSEvts.push(new SpaceEvent(p_solver.xLength-1, y, FILLING.YES));
				listQSEvts.push(new SpaceEvent(p_solver.xLength-2, y, FILLING.YES));
			}
		}
		return listQSEvts;
	}
}

//--------------------------------
// Intelligence

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		switch (p_eventBeingApplied.kind) {
			case SPACE_KIND :
				// Numbers
				p_solver.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {		
					p_solver.deductionsLastUndecided2x2(p_listEventsToApply, coors.x, coors.y);
				});
				if (p_eventBeingApplied.symbol == FILLING.NO) {
					// Propagate visions !
					var xx, yy, sight, runDir;
					KnownDirections.forEach(sightDir => {
						sight = p_solver.viewArray[y][x][sightDir];
						if (sight != null) {
							runDir = OppositeDirection[sightDir];
							xx = x + DeltaX[runDir];
							yy = y + DeltaY[runDir];
							while(p_solver.testExistingCoordinates(xx, yy, runDir) && p_solver.answerArray[yy][xx] == FILLING.NO) {
								xx += DeltaX[runDir];
								yy += DeltaY[runDir];
							}
							if (p_solver.testExistingCoordinates(xx, yy, runDir)) {
								p_listEventsToApply.push(new ViewEvent(xx, yy, sightDir, sight));
							}
						}
					}) 
					p_solver.numericArray[y][x].numberedNeighborsCoors.forEach(coors => {						
						p_listEventsToApply = p_solver.checkZeroNosDeductions(p_listEventsToApply, coors.x, coors.y);
					});
					//  Note : lazy to be added (always in FILLING.NO case) : if among spaces unknown adjacent & diagonal one of them is constraint to 1 BUT is in the sight of 1, make it white (doing work of space)
				} else {
					p_solver.numericArray[y][x].numberedNeighborsCoors.forEach(coors => {						
						p_listEventsToApply = p_solver.checkZeroYesDeductions(p_listEventsToApply, coors.x, coors.y);
					});
				}
				return p_listEventsToApply;
			break;
			case SIZE_KIND :
				// Nothing to do : visions are already created, and incorrect visions are already dealt with in applying
				return p_listEventsToApply;
			break;
			case VIEW_KIND :
				// Test if another view in the opposite direction in this space.
				sightDir = p_eventBeingApplied.direction;
				sight = p_eventBeingApplied.size;
				runDir = OppositeDirection[sightDir];
				if (p_solver.viewArray[y][x][runDir] != null) {
					if (sight == p_solver.viewArray[y][x][runDir]) {
						if (sight == 1) {
							p_listEventsToApply.push(new FailureEvent());
							return p_listEventsToApply;
						} else {
							p_listEventsToApply.push(new SpaceEvent(x, y, FILLING.YES));
						}
					}
				} else { 
					// Note : lazy to be added "If the vision is 1 and the space would only lead to a square size 1 if blackened, color it white" (doing work of the pass)
					if (p_solver.answerArray[y][x] == FILLING.NO) {					
						// Propagate view / stop until a wiew is met in the opposite direction !
						sightDir = p_eventBeingApplied.direction;
						sight = p_eventBeingApplied.size;
						runDir = OppositeDirection[sightDir];
						xx = x + DeltaX[runDir];
						yy = y + DeltaY[runDir]; // C/P from the deductions from space event
						while(p_solver.testExistingCoordinates(xx, yy, runDir) && p_solver.answerArray[yy][xx] == FILLING.NO && p_solver.viewArray[yy][xx][runDir] != null) {
							xx += DeltaX[runDir];
							yy += DeltaY[runDir];
						}
						if (p_solver.testExistingCoordinates(xx, yy, runDir)) {		
							if (p_solver.viewArray[yy][xx][runDir] != null) { // Meet an opposite vision in a white (or not !) space
								if (sight == p_solver.viewArray[yy][xx][runDir]) { // C/P from the 'if' counterpart of this separation, which maybe could have been avoided
									if (sight == 1) {
										p_listEventsToApply.push(new FailureEvent());
										return p_listEventsToApply;
									} else {
										p_listEventsToApply.push(new SpaceEvent(xx, yy, FILLING.YES));
									}
								}								
							} else {								
								p_listEventsToApply.push(new ViewEvent(xx, yy, sightDir, sight));
								
							}
						}
					}
				}
				return p_listEventsToApply;
			break;
		}

	}
}

SolverRukkuea.prototype.checkZeroNosDeductions = function(p_listEvents, p_x, p_y) {
	if (this.numericArray[p_y][p_x].notPlacedXsYet == 0) {
		if (this.answerArray[p_y][p_x] == FILLING.UNDECIDED) {
			p_listEvents.push(new SpaceEvent(p_x, p_y, FILLING.YES));
		}
		this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
			if (this.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
				p_listEvents.push(new SpaceEvent(coors.x, coors.y, FILLING.YES));
			}
		});
	}
	return p_listEvents;
}

SolverRukkuea.prototype.checkZeroYesDeductions = function(p_listEvents, p_x, p_y) {
	if (this.numericArray[p_y][p_x].notPlacedOsYet == 0) {
		if (this.answerArray[p_y][p_x] == FILLING.UNDECIDED) {
			p_listEvents.push(new SpaceEvent(p_x, p_y, FILLING.NO));
		}
		this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
			if (this.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
				p_listEvents.push(new SpaceEvent(coors.x, coors.y, FILLING.NO));
			}
		});
	}
	return p_listEvents;
}

SolverRukkuea.prototype.deductionsLastUndecided2x2 = function(p_listEvents, p_x, p_y) {
	if (this.getAnswer(p_x, p_y) == FILLING.UNDECIDED) {
		conclusions = [FILLING.UNDECIDED, FILLING.UNDECIDED, FILLING.UNDECIDED, FILLING.UNDECIDED];
		if (leftNeighborExists(p_x)) {
			if (upNeighborExists(p_y)) {
				conclusions[0] = this.conclusionLastUndecided2x2(p_x-1, p_y-1, p_x, p_y);
			}
			if (downNeighborExists(p_y, this.yLength)) {
				conclusions[1] = this.conclusionLastUndecided2x2(p_x-1, p_y+1, p_x, p_y);
			}
		}
		if (rightNeighborExists(p_x, this.xLength)) {
			if (upNeighborExists(p_y)) {
				conclusions[2] = this.conclusionLastUndecided2x2(p_x+1, p_y-1, p_x, p_y);
			}
			if (downNeighborExists(p_y, this.yLength)) {
				conclusions[3] = this.conclusionLastUndecided2x2(p_x+1, p_y+1, p_x, p_y);
			}
		}
		var result = conclusions[0];
		var ok = true;
		var i = 1;
		// All 4 conclusions can be UNDECIDED, YES or NO. There mustn't be both YES and NO among the 4, and if successful either YES or NO is chosen in priority over UNDECIDED.
		while (ok && i < 4) {
			ok = (result == FILLING.UNDECIDED) || (conclusions[i] == FILLING.UNDECIDED) || (conclusions[i] == result);
			if (conclusions[i] != FILLING.UNDECIDED) {
				result = conclusions[i];				
			}
			i++;
		}
		if (ok) {
			if (result != FILLING.UNDECIDED) {
				p_listEvents.push(new SpaceEvent(p_x, p_y, result)); 
			}
		} else {
			p_listEvents.push({failure : true});
		}
	}
}

// Tests how should be filled the last square (x2, y2) in a 2x2 square from the remaining 3 ones (x1y1, x1y2, x2y1) (all 4 squares exist in the grid - the x2, y2 is in an unknown state)
SolverRukkuea.prototype.conclusionLastUndecided2x2 = function(p_x1, p_y1, p_x2, p_y2) {
	var count = 0;
	var atLeastOneUndecided = false; 
	var space1 = this.answerArray[p_y1][p_x1];
	var space2 = this.answerArray[p_y1][p_x2];
	var space3 = this.answerArray[p_y2][p_x1];
	[space1, space2, space3].forEach(state => {// Possible optimization that involves removing "atLeastOneUndecided"
		if (state == FILLING.UNDECIDED) {
			//return FILLING.UNDECIDED; // A "=> expression" is NOT a good place to write a return that should be the return of the function.
			atLeastOneUndecided = true;
		}
		if (state == FILLING.YES) {
			count++;
		}
	});
	if (!atLeastOneUndecided) {
		if (count == 3) {
			return FILLING.YES;
		} else if (count == 2) {
			return FILLING.NO;
		}
	}
	return FILLING.UNDECIDED;
}

// Filters

function abortClosure(p_solver) {
	return function() {
		p_solver.cleanSquareChecker();
	}
}

SolverRukkuea.prototype.cleanSquareChecker = function() {
	this.newlyAffectedRectChecker.clean();
}

// So far : all filled spaces form rectangles with correct white borders.
// All spaces in newlyAffectedRectChecker are either newly added black spaces OR black spaces adjacent to newly added white ones. Either one, it's about black rectangles affected since last filter.
// Lazy deductions notes : if a filled space is added after crosses, this filter applies, but if a cross is added after filled squares and it is not added orthogonally next to filled squares, this filter doesn't apply.
function lookForSquareClosure(p_solver) {
	return function() {
		var eventList = [];
		p_solver.squareCheckedChecker.clean();
		var x, y, stillLU, inedit;
		var xMin, yMin, xMax, yMax;
		p_solver.newlyAffectedRectChecker.list.forEach(coors => {
			if (eventList == EVENT_RESULT.FAILURE) {
				return;
			}
			x = coors.x;
			y = coors.y;
			inedit = p_solver.squareCheckedChecker.add(x, y);
			do {				
				stillLU = (x > 0 && p_solver.answerArray[y][x - 1] == FILLING.YES);
				if (stillLU) {
					x--;
					inedit = p_solver.squareCheckedChecker.add(x, y);
				}
				if (inedit && y > 0 && p_solver.answerArray[y - 1][x] == FILLING.YES) {
					stillLU = true;
					y--;
					inedit = p_solver.squareCheckedChecker.add(x, y);
				}
			} while(stillLU && inedit);
			if (inedit) { // Got left-up space of the rectangle ! Now right-bottom
				xMin = x;
				yMin = y;
				xMax = coors.x + 1;
				while (xMax < p_solver.xLength && p_solver.answerArray[yMin][xMax] == FILLING.YES) {
					xMax++;
				}
				xMax--;
				yMax = coors.y + 1;
				while (yMax < p_solver.yLength && p_solver.answerArray[yMax][xMin] == FILLING.YES) {
					yMax++;
				}
				yMax--;
				// Vertical dimension VS horizontal : 
					// The smaller dimension must be completed : look for free rows/columns in left/up, then in right/down. 1st column to be checked quickly because rectangles !
					// If # free RC < |gap| : failure 
					// Otherwise, complete the missing rows/columns
				const vMinusH = (yMax - yMin) - (xMax - xMin);
				const startCoors = [xMin, yMin, xMax, yMax];
				if (vMinusH > 0) { // Horizontal dimension is small
					freedoms = [];
					var xSearch, foundNoX;
					[DIRECTION.LEFT, DIRECTION.RIGHT].forEach(dirSearch => {
						y = yMin;
						xSearch = startCoors[dirSearch] + DeltaX[dirSearch]; // Start research on the left/up/right/down of starting space
						if (p_solver.neighborHorizontalExists(startCoors[dirSearch], dirSearch) && p_solver.answerArray[y][xSearch] == FILLING.UNDECIDED) {							
							foundNoX = true;
							xSearch += DeltaX[dirSearch];
							while (foundNoX && p_solver.neighborHorizontalExists(xSearch, dirSearch)) {
								y = yMin;
								while (y <= yMax && p_solver.answerArray[y][xSearch] != FILLING.NO) { // Note : to be optimized !!!!!
									y++;
								}
								foundNoX = (y > yMax);
								if (foundNoX) {		// foundNoX is true : this column doesn't contain any blocking FILLING.NO, let's check the next one !							
									xSearch += DeltaX[dirSearch];
								}
							}						
						}
						xSearch -= DeltaX[dirSearch];
						// xSearch : last column with undecided spaces. (or startCoors if the 1st column was blocked
						freedoms.push(Math.abs(startCoors[dirSearch] - xSearch)); // 1st : freedoms to the left. 2nd : freedoms to the right.								
					});
				
					// If the difference is 4, there is 1 freedom left, 2 freedom right : not enough gap to compensate 
					// If the difference is 4, there is 3 freedom left, 2 freedom right : we need to complete 2 columns left (4 - 2) and 1 column right (4 - 3)
					if ((freedoms[0] + freedoms[1]) < vMinusH) {
						eventList = EVENT_RESULT.FAILURE;
					} else {						
						if (freedoms[1] < vMinusH) { 
							for (var x = xMin-1 ; x >= xMin - (vMinusH - freedoms[1]) ; x--) {
								eventList.push(new SpaceEvent(x, yMin, FILLING.YES));
							}
						} 
						if (freedoms[0] < vMinusH) { 
							for (var x = xMax+1 ; x <= xMax + (vMinusH - freedoms[0]) ; x++) {
								eventList.push(new SpaceEvent(x, yMin, FILLING.YES));
							}
						} 
					}
				}
				if (vMinusH < 0) {
					freedoms = []; // Copy-pasted from above
					var ySearch, foundNoY;
					[DIRECTION.UP, DIRECTION.DOWN].forEach(dirSearch => {
						x = xMin;
						ySearch = startCoors[dirSearch] + DeltaY[dirSearch]; 
						if (p_solver.neighborVerticalExists(startCoors[dirSearch], dirSearch) && p_solver.answerArray[ySearch][x] == FILLING.UNDECIDED) {							
							foundNoY = true;
							ySearch += DeltaY[dirSearch];
							while (foundNoY && p_solver.neighborVerticalExists(ySearch, dirSearch)) {
								x = xMin;
								while (x <= xMax && p_solver.answerArray[ySearch][x] != FILLING.NO) {
									x++;
								}
								foundNoY = (x > xMax);
								if (foundNoY) {									
									ySearch += DeltaY[dirSearch];
								}
							}						
						}
						ySearch -= DeltaY[dirSearch];
						freedoms.push(Math.abs(startCoors[dirSearch] - ySearch)); 							
					});
					if ((freedoms[0] + freedoms[1]) < (-vMinusH)) {
						eventList = EVENT_RESULT.FAILURE;
					} else {						
						if (freedoms[1] < (-vMinusH)) { 
							for (var y = yMin-1 ; y >= yMin - ((-vMinusH) - freedoms[1]) ; y--) {
								eventList.push(new SpaceEvent(xMin, y, FILLING.YES));
							}
						} 
						if (freedoms[0] < (-vMinusH)) { 
							for (var y = yMax+1 ; y <= yMax + ((-vMinusH) - freedoms[0]) ; y++) {
								eventList.push(new SpaceEvent(xMax, y, FILLING.YES));
							}
						} 
					}
				}
				if (vMinusH == 0) {
					// Square ! Close it if all angles in free directions are unoccupied OR if two opposite edges are closed.
					const leftExists = (xMin > 0);
					const rightExists = (xMax <= p_solver.xLength-2);
					const upExists = (yMin > 0);
					const downExists = (yMax <= p_solver.yLength-2);
					const blockedLeft = (!leftExists || p_solver.answerArray[yMin][xMin-1] == FILLING.NO);
					const blockedRight = (!rightExists || p_solver.answerArray[yMax][xMax+1] == FILLING.NO);
					const blockedUp = (!upExists || p_solver.answerArray[yMin-1][xMin] == FILLING.NO);
					const blockedDown = (!downExists || p_solver.answerArray[yMax+1][xMax] == FILLING.NO);
					if ((blockedLeft && blockedRight) || (blockedUp && blockedDown)) {
						eventList = p_solver.deductionsCloseSquare(eventList, xMin, yMin, xMax, yMax);
					} else {
						const blockedLU = (!leftExists || !upExists || (p_solver.answerArray[yMin-1][xMin-1] == FILLING.NO));
						const blockedRU = (!rightExists || !upExists || (p_solver.answerArray[yMin-1][xMax+1] == FILLING.NO));
						const blockedRD = (!rightExists || !downExists || (p_solver.answerArray[yMax+1][xMax+1] == FILLING.NO));
						const blockedLD = (!leftExists || !downExists || (p_solver.answerArray[yMax+1][xMin-1] == FILLING.NO));
						if ((blockedLU && blockedRU && blockedRD && blockedLD) || (blockedLeft && blockedRD && blockedRU) || (blockedUp && blockedRD && blockedLD) ||
						(blockedRight && blockedLU && blockedLD) || (blockedDown && blockedLU && blockedRU)) {
							eventList = p_solver.deductionsCloseSquare(eventList, xMin, yMin, xMax, yMax);							
						}
					}
				}
				// For each unknown border, if it MUST be blackened for view reasons, open it (check near the edges of the rectangle) 
			} 
		});
		p_solver.cleanSquareChecker();
		return eventList;
	}
}

SolverRukkuea.prototype.deductionsCloseSquare = function(p_eventList, p_xMin, p_yMin, p_xMax, p_yMax) {
	const size = p_xMax - p_xMin + 1;
	if (p_xMin > 0) { // Left
		p_eventList.push(new SpaceEvent(p_xMin - 1, p_yMin, FILLING.NO));
		// Now, the Rukkuea part !
		for (var y = p_yMin ; y <= p_yMax ; y++) {
			p_eventList.push(new SizeEvent(p_xMin, y, size));
			p_eventList.push(new ViewEvent(p_xMin-1, y, DIRECTION.RIGHT, size));
		}
	}
	if (p_xMax <= this.xLength - 2) { // Right
		p_eventList.push(new SpaceEvent(p_xMax + 1, p_yMin, FILLING.NO));
		for (var y = p_yMin ; y <= p_yMax ; y++) {
			p_eventList.push(new SizeEvent(p_xMax, y, size));
			p_eventList.push(new ViewEvent(p_xMax+1, y, DIRECTION.LEFT, size));
		}
	}
	if (p_yMin > 0) { // Up
		p_eventList.push(new SpaceEvent(p_xMin, p_yMin - 1, FILLING.NO));
		for (var x = p_xMin ; x <= p_xMax ; x++) {
			p_eventList.push(new SizeEvent(x, p_yMin, size));
			p_eventList.push(new ViewEvent(x, p_yMin-1, DIRECTION.DOWN, size));
		}
	}
	if (p_yMax <= this.yLength - 2) { // Down
		p_eventList.push(new SpaceEvent(p_xMin, p_yMax + 1, FILLING.NO));
		for (var x = p_xMin ; x <= p_xMax ; x++) {
			p_eventList.push(new SizeEvent(x, p_yMax, size));
			p_eventList.push(new ViewEvent(x, p_yMax+1, DIRECTION.UP, size));
		}
	}
	
	
	return p_eventList;
}

//--------------------
// Passing

function copying(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.symbol]]);
}

namingCategoryClosure = function(p_solver) {
	return function (p_index) {
		if (p_index.isCustom) { // For custom passing... 
			return "Selection " + p_index.numberSpaces + " space" + (p_index.numberSpaces > 1 ? "s" : "");
		}
		if (p_index.totalPass) {
			return "Total pass ! Nb.spaces : " + p_index.numberSpaces;
		}
		return "Col/row " + p_index.x + "," + p_index.y;
	}
}

SolverRukkuea.prototype.generatePassEventsMethod = function(p_x, p_y) { 
	var answer = [];
	for (x = 0 ; x < this.xLength ; x++) {
		answer.push(this.generateEventsForOneSpace(x, p_y));
	}
	for (y = 0 ; y < p_y ; y++) {
		answer.push(this.generateEventsForOneSpace(p_x, y));
	}
	for (y = p_y+1 ; y < this.yLength ; y++) {
		answer.push(this.generateEventsForOneSpace(p_x, y));
	}
	return answer;
}

SolverRukkuea.prototype.generateTotalPassEventsMethod = function() { 
	var answer = [];
	for (y = 0 ; y < this.yLength ; y++) {
		for (x = 0 ; x < this.xLength ; x++) {
			if (this.answerArray[y][x] == FILLING.UNDECIDED) {				
				answer.push(this.generateEventsForOneSpace(x, y));
			}
		}
	}
	return answer;
}

// Custom passing...
SolverRukkuea.prototype.generateEventsForSpacesList = function(p_coors) {
	var answer = [];
	p_coors.forEach(coors => {
		answer.push(this.generateEventsForOneSpace(coors.x, coors.y));
	});
	return answer;
}

SolverRukkuea.prototype.generateEventsForOneSpace = function(p_x, p_y) {
	return [new SpaceEvent(p_x, p_y, FILLING.YES), new SpaceEvent(p_x, p_y, FILLING.NO)];
}

// -----------
// Multipassing

generatePassEventsClosure = function(p_solver) {
	return function(p_index) {
		if (p_index.totalPass) {
			return p_solver.generateTotalPassEventsMethod();
		}
		return p_solver.generatePassEventsMethod(p_index.x, p_index.y);
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		
		var unknownRows = [];
		var unknownColumns = [];
		var x, y;
		for (x = 0 ; x < p_solver.xLength ; x++) {
			unknownColumns.push(0);
		}			
		var atLeast2UnknownColumnIndexes = [];
		var atLeast2UnknownRowIndexes = [];
		var total = 0;
		for (y = 0 ; y < p_solver.yLength ; y++) {
			unknownRows.push(0);
			for (x = 0 ; x < p_solver.xLength ; x++) {
				if (p_solver.answerArray[y][x] == FILLING.UNDECIDED) {
					unknownColumns[x]++;
					unknownRows[y]++;
					total++;
				}
			}
			if (unknownRows[y] >= 2) {				
				atLeast2UnknownRowIndexes.push(y);
			}
		}
		for (x = 0 ; x < p_solver.xLength ; x++) {
			if (unknownColumns[x] >= 2) {				
				atLeast2UnknownColumnIndexes.push(x);
			}
		}
		
		var answer = [];
		if (total <= p_solver.xLength + p_solver.yLength-1 ) {
			answer.push({totalPass : true, numberSpaces : total});
		} else {
			var numberFirstXIndexes = gcd(atLeast2UnknownColumnIndexes.length, atLeast2UnknownRowIndexes.length);
			var yIndex = 0;
			for (firstXIndex = 0 ; firstXIndex < numberFirstXIndexes ; firstXIndex++) {
				 // Torsade indexes : in a (20, 18) puzzle, it gives : (0, 0) (1, 1) ... (17, 17) (1, 18) (2, 19) (3, 0) ... 
					yIndex = 0;
					xIndex = firstXIndex;
					do {
						x = atLeast2UnknownColumnIndexes[xIndex];
						y = atLeast2UnknownRowIndexes[yIndex];
						answer.push({x : x, y : y});
						xIndex++;
						yIndex++;
						if (yIndex == atLeast2UnknownRowIndexes.length) {
							yIndex = 0;
						}
						if (xIndex == atLeast2UnknownColumnIndexes.length) {
							xIndex = 0;
						}
					} while (yIndex != 0 && xIndex != firstXIndex);		
			}
			// WARNING : In very peculiar cases, a few spaces that are alone on their row and column are NOT passed. I think they should eventually get deducted by other passes anyway, or fall into the total pass.
			
		}
		return answer;
	}
}

multipassDefineTodoClosure = function(p_solver) {
	return function(p_index) {
		var todo = p_solver.answerArray[p_index.y][p_index.x] == FILLING.UNDECIDED;
		if (!todo && p_solver.numericArray[p_index.y][p_index.x].value != null) {
			p_solver.existingNeighborsCoors(p_index.x, p_index.y).forEach(coors => {
				todo &= (p_solver.answerArray[coors.y][coors.x] == FILLING.UNDECIDED);
			});
		}
		return todo;
	}
}