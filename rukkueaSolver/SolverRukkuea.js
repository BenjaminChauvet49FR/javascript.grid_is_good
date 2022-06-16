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
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterLookForSquareClosure(this)]);

	this.methodsSetPass = {comparisonMethod : comparison, copyMethod : copying, argumentToLabelMethod : namingCategoryPassClosure(this)};
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
	this.numberedSpacesCoors = []; // Public for drawing
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
	this.tryToApplyHypothesisSafe(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverRukkuea.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverRukkuea.prototype.emitPassRowColumn = function(p_x, p_y) {
	const listPassNow = this.generatePassEventsMethod(p_x, p_y);
	this.passEventsSafe(listPassNow, {x : p_x, y : p_y}); 
}

SolverRukkuea.prototype.makeMultiPass = function() {	
	this.multiPassSafe(this.methodsSetMultipass);
}

SolverRukkuea.prototype.makeTotalPass = function() {	
	const listPassNow = this.generateTotalPassEventsMethod();
	return this.passEventsSafe(listPassNow, new PassCategoryTotal(listPassNow.length));
}

SolverRukkuea.prototype.passSelectedSpaces = function(p_coorsList) {
	const listPassNow = this.generateEventsForSpacesList(p_coorsList);
	return this.passEventsSafe(listPassNow, {isCustom : true, numberSpaces : listPassNow.length});
}

SolverRukkuea.prototype.makeQuickStart = function() {
	this.quickStart();
}

//--------------------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_eventToApply) { 
		const x = p_eventToApply.x;
		const y = p_eventToApply.y;
		switch (p_eventToApply.kind) {
			case SPACE_KIND :
				const symbol = p_eventToApply.symbol
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
				if (formerSize == p_eventToApply.size) {
					return EVENT_RESULT.HARMLESS;
				} else if (formerSize != null) {
					return EVENT_RESULT.FAILURE; // Should not happen as size is defined when a square is closed but who knows
				} else {
					for (var dirV = 0 ; dirV <= 3 ; dirV ++) {
						if (p_solver.viewArray[y][x][dirV] == p_eventToApply.size) { //Direction supposition
							return EVENT_RESULT.FAILURE;
						}
					};
				}
				p_solver.squareSizeArray[y][x] = p_eventToApply.size;
				return EVENT_RESULT.SUCCESS;
			break;
			case VIEW_KIND :
				const dir = p_eventToApply.direction;
				const formerSizeV = p_solver.viewArray[y][x][dir]; // "Identifier 'formerSize' has already been declared ... "
				if (formerSizeV == p_eventToApply.size) {
					return EVENT_RESULT.HARMLESS;
				} else if (formerSizeV != null) {
					return EVENT_RESULT.FAILURE; // Should not happen as size is defined when a square is closed but who knows
				} else {
					if (p_solver.squareSizeArray[y][x] == p_eventToApply.size) { // If it is seen by a square with the same size : fail HERE !
						return EVENT_RESULT.FAILURE;
					}
				}
				p_solver.viewArray[y][x][dir] = p_eventToApply.size;
				return EVENT_RESULT.SUCCESS;
			break;
		}
	}
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) { 
		const x = p_eventToUndo.x;
		const y = p_eventToUndo.y;
		const symbol = p_eventToUndo.symbol;
		switch (p_eventToUndo.kind) {
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
				p_solver.viewArray[y][x][p_eventToUndo.direction] = null;
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
		var listQSEvents = [{quickStartLabel : "Rukkuea"}];
		var x, y;
		p_solver.numberedSpacesCoors.forEach(coors => {
			x = coors.x;
			y = coors.y;
			p_solver.deductionsCheckZeroNos(listQSEvents, x, y);
			p_solver.deductionsCheckZeroYes(listQSEvents, x, y);
			if (p_solver.numericArray[y][x].value == 2) {
				listQSEvents.push(new SpaceEvent(x, y, FILLING.NO));
			}
			if (p_solver.numericArray[y][x].value == 4) {
				listQSEvents.push(new SpaceEvent(x, y, FILLING.YES));
			}
		});
		for (x = 0 ; x < p_solver.xLength ; x++) {
			if (p_solver.numericArray[0][x].value == 3) {
				listQSEvents.push(new SpaceEvent(x, 0, FILLING.YES)); // Note : xLength and yLength >= 2
				listQSEvents.push(new SpaceEvent(x, 1, FILLING.YES));
			}
			if (p_solver.numericArray[p_solver.yLength-1][x].value == 3) {
				listQSEvents.push(new SpaceEvent(x, p_solver.yLength-1, FILLING.YES));
				listQSEvents.push(new SpaceEvent(x, p_solver.yLength-2, FILLING.YES));
			}
		}
		for (y = 0 ; y < p_solver.yLength ; y++) {
			if (p_solver.numericArray[y][0].value == 3) {
				listQSEvents.push(new SpaceEvent(0, y, FILLING.YES));
				listQSEvents.push(new SpaceEvent(1, y, FILLING.YES));
			}
			if (p_solver.numericArray[y][p_solver.xLength-1].value == 3) {
				listQSEvents.push(new SpaceEvent(p_solver.xLength-1, y, FILLING.YES));
				listQSEvents.push(new SpaceEvent(p_solver.xLength-2, y, FILLING.YES));
			}
		}
		return listQSEvents;
	}
}

//--------------------------------
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		switch (p_eventBeingApplied.kind) {
			case SPACE_KIND :
				// Numbers
				p_solver.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {		
					p_solver.deductionsLastUndecided2x2ForRectangle(p_listEventsToApply, coors.x, coors.y, FILLING.UNDECIDED, FILLING.NO, FILLING.YES, answerValueClosure(p_solver.answerArray), methodEventForSpaceFill);
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
						p_solver.deductionsCheckZeroNos(p_listEventsToApply, coors.x, coors.y);
					});
					//  Note : lazy to be added (always in FILLING.NO case) : if among spaces unknown adjacent & diagonal one of them is constraint to 1 BUT is in the sight of 1, make it white (doing work of space)
				} else {
					p_solver.numericArray[y][x].numberedNeighborsCoors.forEach(coors => {						
						p_solver.deductionsCheckZeroYes(p_listEventsToApply, coors.x, coors.y);
					});
				}
				return;
			break;
			case SIZE_KIND :
				// Nothing to do : visions are already created, and incorrect visions are already dealt with in applying
				return;
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
							return;
						} else {
							p_listEventsToApply.push(new SpaceEvent(x, y, FILLING.YES));
						}
					}
				} else { 
					// Note : lazy to be added "If the vision is 1 and the space would only lead to a square size 1 if blackened, colour it white" (doing work of the pass)
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
										return;
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
				return;
			break;
		}

	}
}

SolverRukkuea.prototype.deductionsCheckZeroNos = function(p_listEventsToApply, p_x, p_y) {
	if (this.numericArray[p_y][p_x].notPlacedXsYet == 0) {
		if (this.answerArray[p_y][p_x] == FILLING.UNDECIDED) {
			p_listEventsToApply.push(new SpaceEvent(p_x, p_y, FILLING.YES));
		}
		this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
			if (this.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
				p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, FILLING.YES));
			}
		});
	}
}

SolverRukkuea.prototype.deductionsCheckZeroYes = function(p_listEventsToApply, p_x, p_y) {
	if (this.numericArray[p_y][p_x].notPlacedOsYet == 0) {
		if (this.answerArray[p_y][p_x] == FILLING.UNDECIDED) {
			p_listEventsToApply.push(new SpaceEvent(p_x, p_y, FILLING.NO));
		}
		this.existingNeighborsCoors(p_x, p_y).forEach(coors => {
			if (this.answerArray[coors.y][coors.x] == FILLING.UNDECIDED) {
				p_listEventsToApply.push(new SpaceEvent(coors.x, coors.y, FILLING.NO));
			}
		});
	}
}

// For deductions too

methodEventForSpaceFill = function(p_x, p_y, p_value) {
	return new SpaceEvent(p_x, p_y, p_value);
}

answerValueClosure = function(p_array) { // No needs to generalize this method. For now.
	return function(p_x, p_y) {
		return p_array[p_y][p_x];
	}
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
function filterLookForSquareClosure(p_solver) { 
	return function() {
		var listEventsToApply = [];
		p_solver.squareCheckedChecker.clean();
		var x, y, stillLU, inedit;
		var xMin, yMin, xMax, yMax;
		var i, coors;
		for (var i = 0 ; i < p_solver.newlyAffectedRectChecker.list.length ; i++) {
			coors = p_solver.newlyAffectedRectChecker.list[i];
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
						listEventsToApply.push(new FailureEvent());
						return listEventsToApply;
					} else {						
						if (freedoms[1] < vMinusH) { 
							for (var x = xMin-1 ; x >= xMin - (vMinusH - freedoms[1]) ; x--) {
								listEventsToApply.push(new SpaceEvent(x, yMin, FILLING.YES));
							}
						} 
						if (freedoms[0] < vMinusH) { 
							for (var x = xMax+1 ; x <= xMax + (vMinusH - freedoms[0]) ; x++) {
								listEventsToApply.push(new SpaceEvent(x, yMin, FILLING.YES));
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
						listEventsToApply.push(new FailureEvent());
						return listEventsToApply;
					} else {						
						if (freedoms[1] < (-vMinusH)) { 
							for (var y = yMin-1 ; y >= yMin - ((-vMinusH) - freedoms[1]) ; y--) {
								listEventsToApply.push(new SpaceEvent(xMin, y, FILLING.YES));
							}
						} 
						if (freedoms[0] < (-vMinusH)) { 
							for (var y = yMax+1 ; y <= yMax + ((-vMinusH) - freedoms[0]) ; y++) {
								listEventsToApply.push(new SpaceEvent(xMax, y, FILLING.YES));
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
						p_solver.deductionsCloseSquare(listEventsToApply, xMin, yMin, xMax, yMax);
					} else {
						const blockedLU = (!leftExists || !upExists || (p_solver.answerArray[yMin-1][xMin-1] == FILLING.NO));
						const blockedRU = (!rightExists || !upExists || (p_solver.answerArray[yMin-1][xMax+1] == FILLING.NO));
						const blockedRD = (!rightExists || !downExists || (p_solver.answerArray[yMax+1][xMax+1] == FILLING.NO));
						const blockedLD = (!leftExists || !downExists || (p_solver.answerArray[yMax+1][xMin-1] == FILLING.NO));
						if ((blockedLU && blockedRU && blockedRD && blockedLD) || (blockedLeft && blockedRD && blockedRU) || (blockedUp && blockedRD && blockedLD) ||
						(blockedRight && blockedLU && blockedLD) || (blockedDown && blockedLU && blockedRU)) {
							p_solver.deductionsCloseSquare(listEventsToApply, xMin, yMin, xMax, yMax);							
						}
					}
				}
				// For each unknown border, if it MUST be blackened for view reasons, blacken it (check near the edges of the rectangle) 
			} 
		};
		p_solver.cleanSquareChecker();
		return listEventsToApply;
	}
}

SolverRukkuea.prototype.deductionsCloseSquare = function(p_listEventsToApply, p_xMin, p_yMin, p_xMax, p_yMax) {
	const size = p_xMax - p_xMin + 1;
	if (p_xMin > 0) { // Left
		p_listEventsToApply.push(new SpaceEvent(p_xMin - 1, p_yMin, FILLING.NO));
		// Now, the Rukkuea part !
		for (var y = p_yMin ; y <= p_yMax ; y++) {
			p_listEventsToApply.push(new SizeEvent(p_xMin, y, size));
			p_listEventsToApply.push(new ViewEvent(p_xMin-1, y, DIRECTION.RIGHT, size));
		}
	}
	if (p_xMax <= this.xLength - 2) { // Right
		p_listEventsToApply.push(new SpaceEvent(p_xMax + 1, p_yMin, FILLING.NO));
		for (var y = p_yMin ; y <= p_yMax ; y++) {
			p_listEventsToApply.push(new SizeEvent(p_xMax, y, size));
			p_listEventsToApply.push(new ViewEvent(p_xMax+1, y, DIRECTION.LEFT, size));
		}
	}
	if (p_yMin > 0) { // Up
		p_listEventsToApply.push(new SpaceEvent(p_xMin, p_yMin - 1, FILLING.NO));
		for (var x = p_xMin ; x <= p_xMax ; x++) {
			p_listEventsToApply.push(new SizeEvent(x, p_yMin, size));
			p_listEventsToApply.push(new ViewEvent(x, p_yMin-1, DIRECTION.DOWN, size));
		}
	}
	if (p_yMax <= this.yLength - 2) { // Down
		p_listEventsToApply.push(new SpaceEvent(p_xMin, p_yMax + 1, FILLING.NO));
		for (var x = p_xMin ; x <= p_xMax ; x++) {
			p_listEventsToApply.push(new SizeEvent(x, p_yMax, size));
			p_listEventsToApply.push(new ViewEvent(x, p_yMax+1, DIRECTION.UP, size));
		}
	}
}

//--------------------
// Passing

function copying(p_event) {
	return p_event.copy();
}

comparison = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol], [p_event2.y, p_event2.x, p_event2.symbol]]);
}

namingCategoryPassClosure = function(p_solver) {
	return function (p_indexPass) {
		if (p_indexPass.isCustom) { // For custom passing... 
			return "Selection " + p_indexPass.numberSpaces + " space" + (p_indexPass.numberSpaces > 1 ? "s" : "");
		}
		if (hasTotalPass(p_indexPass)) {
			return "Total pass ! Nb.spaces : " + p_indexPass.numberSpaces;
		}
		return "Col/row " + p_indexPass.x + "," + p_indexPass.y;
	}
}

SolverRukkuea.prototype.generatePassEventsMethod = function(p_x, p_y) { 
	var listPass = [];
	for (x = 0 ; x < this.xLength ; x++) {
		listPass.push(this.generateEventsForOneSpace(x, p_y));
	}
	for (y = 0 ; y < p_y ; y++) {
		listPass.push(this.generateEventsForOneSpace(p_x, y));
	}
	for (y = p_y+1 ; y < this.yLength ; y++) {
		listPass.push(this.generateEventsForOneSpace(p_x, y));
	}
	return listPass;
}

SolverRukkuea.prototype.generateTotalPassEventsMethod = function() { 
	var listPass = []; 
	for (y = 0 ; y < this.yLength ; y++) {
		for (x = 0 ; x < this.xLength ; x++) {
			if (this.answerArray[y][x] == FILLING.UNDECIDED) {				
				listPass.push(this.generateEventsForOneSpace(x, y));
			}
		}
	}
	return listPass;
}

// Custom passing...
SolverRukkuea.prototype.generateEventsForSpacesList = function(p_coors) {
	var listPass = [];
	p_coors.forEach(coors => {
		listPass.push(this.generateEventsForOneSpace(coors.x, coors.y));
	});
	return listPass;
}

SolverRukkuea.prototype.generateEventsForOneSpace = function(p_x, p_y) {
	return [new SpaceEvent(p_x, p_y, FILLING.YES), new SpaceEvent(p_x, p_y, FILLING.NO)];
}

// -----------
// Multipassing

generatePassEventsClosure = function(p_solver) {
	return function(p_indexPass) {
		if (hasTotalPass(p_indexPass)) {
			return p_solver.generateTotalPassEventsMethod();
		}
		return p_solver.generatePassEventsMethod(p_indexPass.x, p_indexPass.y);
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		return listCoordinatesPassRowColumnWithGCD(function(p_x, p_y) {return p_solver.answerArray[p_y][p_x] == FILLING.UNDECIDED}, p_solver.xLength, p_solver.yLength);
	}
}

multipassDefineTodoClosure = function(p_solver) {
	return function(p_indexPass) {
		var todo = p_solver.answerArray[p_indexPass.y][p_indexPass.x] == FILLING.UNDECIDED;
		if (!todo && p_solver.numericArray[p_indexPass.y][p_indexPass.x].value != null) {
			p_solver.existingNeighborsCoors(p_indexPass.x, p_indexPass.y).forEach(coors => {
				todo &= (p_solver.answerArray[coors.y][coors.x] == FILLING.UNDECIDED);
			});
		}
		return todo;
	}
}