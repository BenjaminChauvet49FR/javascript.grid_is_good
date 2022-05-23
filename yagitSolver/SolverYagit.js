const YAGIT_SHAPE = {
	ROUND : 2,
	SQUARE : 1,
	UNDECIDED : 0
}

const NODE_END = -1;
const OH = ORIENTATION.HORIZONTAL;
const OV = ORIENTATION.VERTICAL;

const PASS_CATEGORY = {
	NODE : 0,
	SPACE : 1
}

// ------------------------
// Setup
SolverYagit.prototype = Object.create(GeneralSolver.prototype);
SolverYagit.prototype.constructor = SolverYagit;

function SolverYagit(p_symbolArray, p_knotsArray) {
	GeneralSolver.call(this);
	this.construct(p_symbolArray, p_knotsArray);
}

function DummySolver() {
	return new SolverYagit([[null]], [[null]]);
}

SolverYagit.prototype.construct = function(p_symbolArray, p_knotsArray) {
	this.generalConstruct();
	this.yagitKnotsGrid = Grid_data(p_knotsArray); // For drawing
	this.yagitShapesGrid = Grid_data(p_symbolArray); 
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
			applyEventClosure(this), 
			deductionsClosure(this),  
			undoEventClosure(this));
	this.methodsSetDeductions.setOneAbortAndFilters(abortClosure(this), [filterNoCagesClosure(this), filterClaustrophobiaClosure(this)]); 
	
	this.methodsSetPass = {
		comparisonMethod : comparison, 
		copyMethod : copying, 
		argumentToLabelMethod : namingCategoryPassClosure(this)
	};
	
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};
	
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this)
		//searchSolutionMethod : searchClosure(this)
	}
	
	this.xLength = p_symbolArray[0].length;
	this.yLength = p_symbolArray.length;
	this.answerFenceGrid = new FencesGrid(this.xLength, this.yLength); // The answer fence grid
	this.shapeAreaArray = generateFunctionValueArray(this.xLength, this.yLength, function(p_x, p_y) {
		switch (p_symbolArray[p_y][p_x]) {
			case SYMBOL_ID.ROUND : return YAGIT_SHAPE.ROUND; break;
			case SYMBOL_ID.SQUARE : return YAGIT_SHAPE.SQUARE; break;
			default : return YAGIT_SHAPE.UNDECIDED;
		}
	});
	this.nodesOccupationRDArray = [];
	this.numberNodes = 0;
	this.coorsRDNodes = [];
	for (var y = 0 ; y <= this.yLength-2 ; y++) {
		this.nodesOccupationRDArray.push([]);
		for (var x = 0 ; x <= this.xLength-2 ; x++) {
			if (p_knotsArray[y][x] == null) {				
				this.nodesOccupationRDArray[y].push(null);
			} else {
				this.nodesOccupationRDArray[y].push({index : this.numberNodes, chains : [], stillUnknownYet : 4, oppositeEnd : null,
				fenceIndexesAround : [null, null, null, null],
				xRD : x, yRD : y}); // !!! Definition of a node !!!
				this.coorsRDNodes.push({x : x, y : y});
				this.numberNodes++;
			}
		}
	}

	this.fencesIDGrid = new FencesGrid(this.xLength, this.yLength); // Rather than states, this one contains IDs of potential fences that will be used in events
	this.fencesList = [[], []];
	var node1, node2;
	var xLeft, formerIndex;
	for (var y = 0 ; y <= this.yLength-2 ; y++) {
		node1 = null;
		node2 = null;
		xLeft = 0;
		for (var x = 0 ; x <= this.xLength-1 ; x++) {
			this.fencesIDGrid.setFenceDown(x, y, this.fencesList[OH].length);
			if (x < this.xLength-1 && this.nodesOccupationRDArray[y][x] != null) {
				this.fencesList[OH].push({xLeft : xLeft, xRight : x, y : y,    // !!! Definition of a Yagit fence !!! 
				state : FENCE_STATE.UNDECIDED, nodeLeft : node1, nodeRight : node2});  // BIG WARNING : xLeft and xRight are the first and the last xs the fence extends to, including them !
				xLeft = x + 1;

			}
		}
		this.fencesList[OH].push({xLeft : xLeft, xRight : x-1, y : y,    
		state : FENCE_STATE.UNDECIDED, nodeLeft : node1, nodeRight : null}); 
	}
	var yUp;
	for (var x = 0 ; x <= this.xLength-2 ; x++) {
		node1 = null;
		node2 = null;
		yUp = 0;
		for (var y = 0 ; y <= this.yLength-1 ; y++) {
			this.fencesIDGrid.setFenceRight(x, y, this.fencesList[OV].length);
			if (y < this.yLength-1 && this.nodesOccupationRDArray[y][x] != null) {
				this.fencesList[OV].push({yUp : yUp, yDown : y, x : x, 
				state : FENCE_STATE.UNDECIDED, nodeUp : node1, nodeDown : node2}); 
				yUp = y + 1;
			}
		}
		this.fencesList[OV].push({yUp : yUp, yDown : y-1, x : x, 
		state : FENCE_STATE.UNDECIDED, nodeUp : node1, nodeDown : null}); 
	}
	
	this.coorsRDNodes.forEach(coors => {
		x = coors.x;
		y = coors.y;
		node = this.nodesOccupationRDArray[y][x];
		node.fenceIndexesAround[DIRECTION.LEFT] = this.fencesIDGrid.getFence(x, y, DIRECTION.DOWN);
		node.fenceIndexesAround[DIRECTION.UP] = this.fencesIDGrid.getFence(x, y, DIRECTION.RIGHT);
		node.fenceIndexesAround[DIRECTION.RIGHT] = this.fencesIDGrid.getFence(x+1, y, DIRECTION.DOWN);
		node.fenceIndexesAround[DIRECTION.DOWN] = this.fencesIDGrid.getFence(x, y+1, DIRECTION.RIGHT);
	});
	
	// For quickstart. If a square and a round are orthogonally adjacent, go !
	this.roundAndSquareFencesCheckers = [new CheckCollection(this.fencesList[OH].length), new CheckCollection(this.fencesList[OV].length)];
	var shape1, shape2;
	for (y = 0 ; y < this.yLength ; y++) {
		for (x = 0 ; x < this.xLength; x++) {
			shape1 = this.shapeAreaArray[y][x];
			if (shape1 != FENCE_STATE.UNDECIDED) {
				if (x <= this.xLength-2) {					
					shape2 = this.shapeAreaArray[y][x+1];
					if (shape2 != FENCE_STATE.UNDECIDED && shape1 != shape2) {
						this.roundAndSquareFencesCheckers[OV].add(this.fencesIDGrid.getFence(x, y, DIRECTION.RIGHT));
					}
				}
				if (y <= this.yLength-2) {
					shape2 = this.shapeAreaArray[y+1][x];
					if (shape2 != FENCE_STATE.UNDECIDED && shape1 != shape2) {
						this.roundAndSquareFencesCheckers[OH].add(this.fencesIDGrid.getFence(x, y, DIRECTION.DOWN));
					}
				}
			}
		}
	}
	
	// For checking 
	this.nearToNewFencesChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength); // Initialized cluster
	this.exploredSpacesNoCagesChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength); // Cluster for the whole filter
	this.exploredSpacesNoCagesThisClusterChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength); // Cluster for a space of the filter
	
	this.claustrophobiaChecker = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.solvedTheOtherWayChecker = new CheckCollectionDoubleEntryDirectional(this.xLength, this.yLength);
	this.deadEndsArray = generateValueArray(this.xLength, this.yLength, false);
}

// ------------------------
// Getters & inner methods

// For drawer
SolverYagit.prototype.getArea = function(p_x, p_y) {
	return this.shapeAreaArray[p_y][p_x];
}

// They aren't classical fences !
SolverYagit.prototype.getFenceRight = function(p_x, p_y) {
	return this.fencesList[OV][this.fencesIDGrid.getFenceRight(p_x, p_y)];
}

SolverYagit.prototype.getFenceRightState = function(p_x, p_y) {
	return this.getFenceRight(p_x, p_y).state;
}

SolverYagit.prototype.getFenceDown = function(p_x, p_y) {
	return this.fencesList[OH][this.fencesIDGrid.getFenceDown(p_x, p_y)];
}

SolverYagit.prototype.getFenceDownState = function(p_x, p_y) {
	return this.getFenceDown(p_x, p_y).state;
}

// More subtle
SolverYagit.prototype.getIndexFence = function(p_x, p_y, p_direction) {
	switch(p_direction) {
		case DIRECTION.RIGHT : return this.fencesIDGrid.getFenceRight(p_x, p_y); break;
		case DIRECTION.DOWN : return this.fencesIDGrid.getFenceDown(p_x, p_y); break;
		case DIRECTION.LEFT : return this.fencesIDGrid.getFenceRight(p_x-1, p_y); break;
		default : return this.fencesIDGrid.getFenceDown(p_x, p_y-1); break;
	}
}

SolverYagit.prototype.getNodeFromIndex = function(p_indexNode) {
	const coors = this.coorsRDNodes[p_indexNode];
	return this.nodesOccupationRDArray[coors.y][coors.x];
}

SolverYagit.prototype.getFenceFromSpace = function(p_x, p_y, p_dir) { 
	// Direction from the space => orientation of fence is orthogonal
	return this.fencesList[OrthogonalOrientationDirection[p_dir]][this.fencesIDGrid.getFence(p_x, p_y, p_dir)];
}

SolverYagit.prototype.getFenceFromNode = function(p_node, p_dir) {
	return this.fencesList[OrientationDirection[p_dir]][p_node.fenceIndexesAround[p_dir]];
}

// Returns true if : space in direction exists, is accessible AND it's not counted as a dead-end space !
SolverYagit.prototype.neighborNotDeadEndAccessibleFrom = function(p_x, p_y, p_dir) {
	return (this.neighborExists(p_x, p_y, p_dir) && this.getFenceFromSpace(p_x, p_y, p_dir).state != FENCE_STATE.CLOSED && !this.deadEndsArray[p_y + DeltaY[p_dir]][p_x + DeltaX[p_dir]]);
}

// ------------------------
// Input methods 

SolverYagit.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	this.tryToPutNewFence(p_x, p_y, DIRECTION.RIGHT, p_state);
}

SolverYagit.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	this.tryToPutNewFence(p_x, p_y, DIRECTION.DOWN, p_state);
}

SolverYagit.prototype.emitPassAroundSpace = function(p_x, p_y) {
	const listPassNow = this.generateEventsAroundSpacePass(p_x, p_y);
	this.passEvents(listPassNow, {passCategory : PASS_CATEGORY.SPACE, x : p_x, y : p_y}); 
}

SolverYagit.prototype.emitPassNodeRD = function(p_x, p_y) {
	if (this.nodesOccupationRDArray[p_y][p_x] != null) {
		const listPassNow = this.generateEventsAroundNodePass(p_x, p_y);
		this.passEvents(listPassNow, {passCategory : PASS_CATEGORY.CORNER, x : p_x, y : p_y}); 
	}
}

SolverYagit.prototype.undo = function(){
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverYagit.prototype.makeMultiPass = function() {	
	this.multiPass(this.methodsSetMultipass);
}

// In this puzzle, quickstart is vital for the separation of centers
SolverYagit.prototype.makeQuickStart = function(p_x, p_y) {
	this.quickStart();
}

SolverYagit.prototype.tryToPutNewFence = function(p_x, p_y, p_directionFromSpace, p_state) {
	this.tryToApplyHypothesis(new YagitFenceEvent(OrthogonalOrientationDirection[p_directionFromSpace], 
	this.getIndexFence(p_x, p_y, p_directionFromSpace), 
	p_state), 
	this.methodsSetDeductions); // Unlike other solvers, this one is quite needed
}

//--------------------------------
// Doing and undoing

// Offensive programming : we assume x and y are consistent.

applyEventClosure = function(p_solver) {
	return function(p_eventToApply) {
		if (p_eventToApply.kind == YAGIT_FENCE_EVENT_KIND) {
			const index = p_eventToApply.index;
			const state = p_eventToApply.state;
			const orientation = p_eventToApply.orientation;
			var fence = p_solver.fencesList[orientation][index];
			// Classical state check
			if (state == fence.state) {
				return EVENT_RESULT.HARMLESS;
			} 
			if (fence.state != FENCE_STATE.UNDECIDED) {
				return EVENT_RESULT.FAILURE;
			}
			// Node 1, node 2, bounds, and then if it is fine, update nodes and state change !
			var okNode1, okNode2;
			if (orientation == OV) {
				var node1 = p_solver.nodeRDSelection(fence.yUp > 0, fence.x, fence.yUp-1, state);
				var node2 = p_solver.nodeRDSelection(fence.yDown <= p_solver.yLength - 2, fence.x, fence.yDown, state);
				if (handleNodesCompatibility(node1, node2, DIRECTION.DOWN, DIRECTION.UP, state) == EVENT_RESULT.FAILURE) {
					return EVENT_RESULT.FAILURE;
				}
			} else {
				var node1 = p_solver.nodeRDSelection(fence.xLeft > 0, fence.xLeft-1, fence.y, state);
				var node2 = p_solver.nodeRDSelection(fence.xRight <= p_solver.xLength - 2, fence.xRight, fence.y, state);
				if (handleNodesCompatibility(node1, node2, DIRECTION.RIGHT, DIRECTION.LEFT, state) == EVENT_RESULT.FAILURE) {
					return EVENT_RESULT.FAILURE;
				}
			}
			
			// Opposite ends
			if (state == FENCE_STATE.CLOSED) {
				if (node1 == null) {
					if (node2 != null) {
						p_solver.opposeNotNullToNull(node2);
					}
				} else if (node2 == null) {
					p_solver.opposeNotNullToNull(node1);
				} else {
					const oppo1 = node1.oppositeEnd;
					const oppo2 = node2.oppositeEnd;
					if (oppo1 == null) {
						if (oppo2 == null) {
							node1.oppositeEnd = node2.index; // Chain creation
							node2.oppositeEnd = node1.index;
						} else {
							p_solver.expandChain(node1, node2, oppo2); // Chain expansion
						}
					} else if (oppo2 == null) { // Chain expansion
						p_solver.expandChain(node2, node1, oppo1);
					} else { // Chain linking : Trade at extremities without caring what's inside
						if (oppo1 != NODE_END) {p_solver.getNodeFromIndex(oppo1).oppositeEnd = oppo2;}
						if (oppo2 != NODE_END) {p_solver.getNodeFromIndex(oppo2).oppositeEnd = oppo1;}
					}
				}
			}
			fence.state = state;
			
			// Non-cage (new spaces near these closures) & claustrophobia (don't want to be caged)
			if (orientation == OV) {
				const x = fence.x;
				for (var y = fence.yUp ; y <= fence.yDown ; y++) {
					p_solver.maybeAddClaustrophobia(x, y);
					p_solver.maybeAddClaustrophobia(x+1, y);
					if (state == FENCE_STATE.CLOSED) {						
						p_solver.nearToNewFencesChecker.add(x, y);
						p_solver.nearToNewFencesChecker.add(x+1, y);
					}
				}
			} else {
				const y = fence.y;
				for (var x = fence.xLeft ; x <= fence.xRight ; x++) {
					p_solver.maybeAddClaustrophobia(x, y);
					p_solver.maybeAddClaustrophobia(x, y+1);
					if (state == FENCE_STATE.CLOSED) {						
						p_solver.nearToNewFencesChecker.add(x, y);
						p_solver.nearToNewFencesChecker.add(x, y+1);					
					}
				}
			}
			return EVENT_RESULT.SUCCESS;
		} else if (p_eventToApply.kind == SHAPE_EVENT_KIND) {
			const x = p_eventToApply.x;
			const y = p_eventToApply.y;
			const shape = p_eventToApply.shape;
			const formerShape = p_solver.shapeAreaArray[y][x];
			if (formerShape == shape) {
				return EVENT_RESULT.HARMLESS;
			}
			if (formerShape != YAGIT_SHAPE.UNDECIDED) {
				return EVENT_RESULT.FAILURE;
			}
			p_solver.shapeAreaArray[y][x] = shape;
			return EVENT_RESULT.SUCCESS;
		} else {
			if (p_solver.deadEndsArray[p_eventToApply.y][p_eventToApply.x]) {
				return EVENT_RESULT.HARMLESS;			
			} else {				
				p_solver.deadEndsArray[p_eventToApply.y][p_eventToApply.x] = true;
				p_solver.existingNeighborsCoors(p_eventToApply.x, p_eventToApply.y).forEach(coors => {
					p_solver.maybeAddClaustrophobia(coors.x, coors.y);
				});
				return EVENT_RESULT.SUCCESS;
			}
		}
	}
}

// (node opposition) How does react a non-null node that is bound to a null node ? 
// Depends on whether the non-null node is opposed yet or not, and if it's opposed to null
SolverYagit.prototype.opposeNotNullToNull = function(p_notNullNode) {
	if (p_notNullNode.oppositeEnd == null) {
		p_notNullNode.oppositeEnd = NODE_END;
	} else if (p_notNullNode.oppositeEnd != NODE_END) {
		this.getNodeFromIndex(p_notNullNode.oppositeEnd).oppositeEnd = NODE_END;
	}
}


// (node opposition) A node that was unlinked is linked to an already linked one (and neither are null) : 
// Add the same opposite node to the chain, and warn the opposite end of the chain (if it exists) 
SolverYagit.prototype.expandChain = function(p_newNode, p_expandedNode, p_oppositeIndexChain) {	
	p_newNode.oppositeEnd = p_oppositeIndexChain;
	if (p_oppositeIndexChain != NODE_END) {
		this.getNodeFromIndex(p_oppositeIndexChain).oppositeEnd = p_newNode.index;
	}
}

// Returns : null if condition is not met (not existent node), the node in (p_x, p_y) if it exists and is valid, EVENT_RESULT.FAILURE if it is invalid.
// Validity ? It's self-explainatory below !
// Beware : The down-right node of the space is supposed to be returned and nothing else !
SolverYagit.prototype.nodeRDSelection = function(p_condition, p_x, p_y, p_state) {
	if (p_condition) {
		const resultNode = this.nodesOccupationRDArray[p_y][p_x];
		if (resultNode.chains.length == 2 && p_state == FENCE_STATE.CLOSED) { // Too many links ! We MUSTN'T add a 3rd one !
			return EVENT_RESULT.FAILURE;
		} else { 
			return resultNode;
		}
	} else {
		return null;
	}
}

// Adds a node to claustrophobia checker IF it has at least two orthogonal edges
SolverYagit.prototype.maybeAddClaustrophobia = function(p_x, p_y) { 
	if (this.shapeAreaArray[p_y][p_x] == YAGIT_SHAPE.UNDECIDED) {		
		var wallDirections = [];
		var directionRemaining = null;
		KnownDirections.forEach(dir => {
			if (!this.neighborNotDeadEndAccessibleFrom(p_x, p_y, dir)) {
				wallDirections.push(dir);
			} else {
				directionRemaining = dir;
			}
		});
		if (wallDirections.length >= 3 || (wallDirections.length == 2 && wallDirections[0] != OppositeDirection[wallDirections[1]])) {
			this.claustrophobiaChecker.add(p_x, p_y);
		}
	}
}

// Test if nodes are consistent AND if so pushes directions
handleNodesCompatibility = function(p_node1, p_node2, p_directionOccupiedBy1, p_directionOccupiedBy2, p_state) {
	if (p_node1 == EVENT_RESULT.FAILURE || p_node2 == EVENT_RESULT.FAILURE) {
		return EVENT_RESULT.FAILURE;
	}
	if ((p_state  == FENCE_STATE.CLOSED) && p_node1 != null && p_node2 != null && p_node1.oppositeEnd == p_node2.index) { // Note : possibly also see the other way around
		return EVENT_RESULT.FAILURE;
	}
	if (p_node1 != null) {					
		p_node1.stillUnknownYet--;
	}
	if (p_node2 != null) {
		p_node2.stillUnknownYet--;
	}
	if (p_state == FENCE_STATE.CLOSED) {		
		if (p_node1 != null) {					
			p_node1.chains.push(p_directionOccupiedBy1);
		}
		if (p_node2 != null) {
			p_node2.chains.push(p_directionOccupiedBy2);
		}
	}
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.kind == YAGIT_FENCE_EVENT_KIND) {
			const index = p_eventToUndo.index;
			const orientation = p_eventToUndo.orientation;
			const stateClosed = (p_eventToUndo.state == FENCE_STATE.CLOSED);
			var fence = p_solver.fencesList[orientation][index];		
			var node1 = null;
			var node2 = null;
			if (orientation == OV) {
				if (fence.yUp > 0) {
					node1 = p_solver.nodesOccupationRDArray[fence.yUp-1][fence.x];
					if (stateClosed) {node1.chains.pop();}
				}
				if (fence.yDown <= p_solver.yLength-2) {
					node2 = p_solver.nodesOccupationRDArray[fence.yDown][fence.x];
					if (stateClosed) {node2.chains.pop();}
				}  
			} else {
				if (fence.xLeft > 0) {
					node1 = p_solver.nodesOccupationRDArray[fence.y][fence.xLeft-1];
					if (stateClosed) {node1.chains.pop();}
				}
				if (fence.xRight <= p_solver.xLength-2) {
					node2 = p_solver.nodesOccupationRDArray[fence.y][fence.xRight];
					if (stateClosed) {node2.chains.pop();}
				} 
			}
			p_solver.undoNodeBounds(node1);
			p_solver.undoNodeBounds(node2);
			if (node1 != null) { node1.stillUnknownYet++; }
			if (node2 != null) { node2.stillUnknownYet++; }
			fence.state = FENCE_STATE.UNDECIDED;
		} else if (p_eventToUndo.kind == SHAPE_EVENT_KIND) {
			p_solver.shapeAreaArray[p_eventToUndo.y][p_eventToUndo.x] = YAGIT_SHAPE.UNDECIDED;
		} else {
			p_solver.deadEndsArray[p_eventToUndo.y][p_eventToUndo.x] = false;
		}
	}
}

// Node opposition ; unlike doing, it is possible to undo on each node separately. 
// Which makes sense : once the chain is broken, you don't care anymore about the what happens within the other end.
// Nice exploit of chains.length, I didn't expect that to be so simple however.
SolverYagit.prototype.undoNodeBounds = function(p_node) {
	if (p_node != null) {
		if (p_node.chains.length == 0) { p_node.oppositeEnd = null; } 
		const oppo = p_node.oppositeEnd;
		if (oppo != null && oppo != NODE_END) {this.getNodeFromIndex(oppo).oppositeEnd = p_node.index; }
	}
}

//-------------------------------- 
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function() {
		var listQSEvents = [{quickStartLabel : "Yagit"}];
		KnownOrientations.forEach(orientation => {
			p_solver.roundAndSquareFencesCheckers[orientation].list.forEach(index => {
				listQSEvents.push(new YagitFenceEvent(orientation, index, FENCE_STATE.CLOSED));
			});
		});
		return listQSEvents;
	}
}

//--------------------------------
// Deductions

deductionsClosure = function(p_solver) {
	return function (p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == YAGIT_FENCE_EVENT_KIND) {
			var node1, node2, fence;
			const orientation = p_eventBeingApplied.orientation;
			const state = p_eventBeingApplied.state;
			if (orientation == OV) {
				fence = p_solver.fencesList[OV][p_eventBeingApplied.index];
				node1 = p_solver.nodeRDSelectionDeduction(fence.yUp > 0, fence.x, fence.yUp-1);
				node2 = p_solver.nodeRDSelectionDeduction(fence.yDown <= p_solver.yLength - 2, fence.x, fence.yDown);
			} else {
				fence = p_solver.fencesList[OH][p_eventBeingApplied.index];
				node1 = p_solver.nodeRDSelectionDeduction(fence.xLeft > 0, fence.xLeft-1, fence.y);
				node2 = p_solver.nodeRDSelectionDeduction(fence.xRight <= p_solver.xLength - 2, fence.xRight, fence.y);				
			}
			[node1, node2].forEach(node => {
				if (node != null) {
					if (node.stillUnknownYet == 1) {
						var fence2, missingIndex, correctOrientation;
						KnownDirections.forEach(dir => {							
							fence2 = p_solver.getFenceFromNode(node, dir); 
							if (fence2.state == FENCE_STATE.UNDECIDED) {
								missingIndex = node.fenceIndexesAround[dir];
								correctOrientation = OrientationDirection[dir];
							}
						});
						p_listEventsToApply.push(new YagitFenceEvent(correctOrientation, missingIndex, node.chains.length == 1 ? FENCE_STATE.CLOSED : FENCE_STATE.OPEN));
					} else if (node.chains.length == 2) {
						var fence2, correctOrientation;
						KnownDirections.forEach(dir => {							
							fence2 = p_solver.getFenceFromNode(node, dir); 
							if (fence2.state == FENCE_STATE.UNDECIDED) {
								correctOrientation = OrientationDirection[dir];
								p_listEventsToApply.push(new YagitFenceEvent(correctOrientation , node.fenceIndexesAround[dir], FENCE_STATE.OPEN));
							}
						});
					}
				}
			});
			if (state == FENCE_STATE.CLOSED) {				
				// Avoid loops between nodes 1 and 2
				if (node1 != null && node2 != null && node1.oppositeEnd != NODE_END && node2.oppositeEnd != NODE_END && 
				!(node1.chains.length == 1 && node2.chains.length == 1)) {
					// Identify both nodes at extremity of chain. Remember, the chain may be an extension or a joining of two chains !
					const extremeNode1 = node1.chains.length == 1 ? node1 : p_solver.getNodeFromIndex(node1.oppositeEnd); 
					const extremeNode2 = node2.chains.length == 1 ? node2 : p_solver.getNodeFromIndex(node2.oppositeEnd);
					KnownDirections.forEach(dir => {
						if (extremeNode1.fenceIndexesAround[dir] == extremeNode2.fenceIndexesAround[OppositeDirection[dir]]) {
							p_listEventsToApply.push(new YagitFenceEvent(OrientationDirection[dir], extremeNode1.fenceIndexesAround[dir], FENCE_STATE.OPEN));
						}
					});				
				}
				// Extra check around one node (do the work of the pass)
				[node1, node2].forEach(node => {
					if (node != null && node.chains.length == 1) {
						x = node.xRD;
						y = node.yRD;
						p_solver.deductionsSmartOppositionCornerAroundCorner(p_listEventsToApply, x, y, x+1, y+1, node.chains[0], true, node.fenceIndexesAround);
						p_solver.deductionsSmartOppositionCornerAroundCorner(p_listEventsToApply, x+1, y, x, y+1, node.chains[0], false, node.fenceIndexesAround);
					}
				});
			} else {
				// For each pair of spaces, see if shapes can be shared
				if (orientation == OV) {
					const x = fence.x;
					for (var y = fence.yUp ; y <= fence.yDown ; y++) {
						p_solver.deductionsOpenFence(p_listEventsToApply, x, y, x+1, y);
					}
				} else {
					const y = fence.y;
					for (var x = fence.xLeft ; x <= fence.xRight ; x++) {
						p_solver.deductionsOpenFence(p_listEventsToApply, x, y, x, y+1);
					}
				}
			}
		} else if (p_eventBeingApplied.kind == SHAPE_EVENT_KIND) {
			const x = p_eventBeingApplied.x;
			const y = p_eventBeingApplied.y;
			const shape = p_eventBeingApplied.shape;
			var fence2, xx, yy, shapeN;
			p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir => {
				xx = coorsDir.x;
				yy = coorsDir.y;
				dir = coorsDir.direction;
				if (p_solver.getFenceFromSpace(x, y, dir).state == FENCE_STATE.OPEN) {
					p_listEventsToApply.push(new ShapeEvent(xx, yy, shape));
				}
				shapeN = p_solver.shapeAreaArray[yy][xx];
				if (shapeN != FENCE_STATE.UNDECIDED && shapeN != shape) {
					p_listEventsToApply.push(new YagitFenceEvent(OrthogonalOrientationDirection[dir], p_solver.fencesIDGrid.getFence(x, y, dir), FENCE_STATE.CLOSED));
				}
			});
			// For each node of the space : if the diagonally opposite space has the opposite shape AND there is a closed fence, open the fence !
			// Doing the work of the pass !
			otherShape = (shape == YAGIT_SHAPE.SQUARE ? YAGIT_SHAPE.ROUND : YAGIT_SHAPE.SQUARE);
			if (x > 0) {
				if (y > 0 && p_solver.nodesOccupationRDArray[y-1][x-1] != null) {
					p_solver.deductionsFromShapeSmartOppositionCornerFromShape(p_listEventsToApply, p_solver.nodesOccupationRDArray[y-1][x-1], x-1, y-1, otherShape, true);
				}
				if (y <= this.yLength-2 && p_solver.nodesOccupationRDArray[y][x-1] != null) {
					p_solver.deductionsFromShapeSmartOppositionCornerFromShape(p_listEventsToApply, p_solver.nodesOccupationRDArray[y][x-1], x-1, y+1, otherShape, false);
				}
			} 
			if (x <= this.xLength-2) {
				if (y > 0 && p_solver.nodesOccupationRDArray[y-1][x] != null) {
					p_solver.deductionsFromShapeSmartOppositionCornerFromShape(p_listEventsToApply, p_solver.nodesOccupationRDArray[y-1][x], x+1, y-1, otherShape, false);
				}
				if (y <= this.yLength-2 && p_solver.nodesOccupationRDArray[y][x] != null) {
					p_solver.deductionsFromShapeSmartOppositionCornerFromShape(p_listEventsToApply, p_solver.nodesOccupationRDArray[y][x], x+1, y+1, otherShape, true);
				}
			}
			
		}
	}
}

SolverYagit.prototype.nodeRDSelectionDeduction = function(p_condition, p_x, p_y) {
	if (p_condition) {
		return this.nodesOccupationRDArray[p_y][p_x];
	} else {
		return null;
	}
}

// x1, y1 and x2, y2 are coordinates of neighbor spaces separated by an open fence
SolverYagit.prototype.deductionsOpenFence = function(p_listEventsToApply, p_x1, p_y1, p_x2, p_y2) {
	const s1 = this.shapeAreaArray[p_y1][p_x1];
	const s2 = this.shapeAreaArray[p_y2][p_x2];
	if (s1 != YAGIT_SHAPE.UNDECIDED) {
		p_listEventsToApply.push(new ShapeEvent(p_x2, p_y2, s1));
	}
	if (s2 != YAGIT_SHAPE.UNDECIDED) {
		p_listEventsToApply.push(new ShapeEvent(p_x1, p_y1, s2));
	}
}


// Preconditions : between p_x, p_y and p_x2, p_y2, there is a node. That node has a closed fence in p_closedFenceDirection.
// p_LUvsRD true if we oppose left-up space to right-down, false otherwise
SolverYagit.prototype.deductionsSmartOppositionCornerAroundCorner = function(p_listEventsToApply, p_x, p_y, p_x2, p_y2, p_closedFenceDirection, p_LUvsRD, p_indexRoundingNodes) {
	const shape1 = this.shapeAreaArray[p_y][p_x];
	var directionToOpen;
	if (shape1 != YAGIT_SHAPE.UNDECIDED) {
		const shape2 = this.shapeAreaArray[p_y2][p_x2];
		if (shape2 != YAGIT_SHAPE.UNDECIDED && shape2 != shape1) {
			switch (p_closedFenceDirection) {
				case DIRECTION.LEFT : directionToOpen = p_LUvsRD ? DIRECTION.DOWN : DIRECTION.UP; break;
				case DIRECTION.UP : directionToOpen = p_LUvsRD ? DIRECTION.RIGHT : DIRECTION.LEFT; break;
				case DIRECTION.RIGHT : directionToOpen = p_LUvsRD ? DIRECTION.UP : DIRECTION.DOWN ; break;
				case DIRECTION.DOWN : directionToOpen = p_LUvsRD ? DIRECTION.LEFT : DIRECTION.RIGHT; break;
			}
			p_listEventsToApply.push(new YagitFenceEvent(OrientationDirection[directionToOpen], p_indexRoundingNodes[directionToOpen], FENCE_STATE.OPEN));
		}
	} 
}

// Preconditions : p_xTarget
SolverYagit.prototype.deductionsFromShapeSmartOppositionCornerFromShape = function(p_listEventsToApply, p_node, p_xTarget, p_yTarget, p_oppositeShape, p_LUvsRD) {
	if (node.chains.length == 1 && this.shapeAreaArray[p_yTarget][p_xTarget] == p_oppositeShape) {
		const closedFenceDirection = node.chains[0];
		var directionToOpen;
		switch (closedFenceDirection) {
			case DIRECTION.LEFT : directionToOpen = p_LUvsRD ? DIRECTION.DOWN : DIRECTION.UP; break;
			case DIRECTION.UP : directionToOpen = p_LUvsRD ? DIRECTION.RIGHT : DIRECTION.LEFT; break;
			case DIRECTION.RIGHT : directionToOpen = p_LUvsRD ? DIRECTION.UP : DIRECTION.DOWN ; break;
			case DIRECTION.DOWN : directionToOpen = p_LUvsRD ? DIRECTION.LEFT : DIRECTION.RIGHT; break;
		}
	}
}

// -------------------
// Filters and abortions

// Check that "no cage" (region without any symbol) has been generated
function filterNoCagesClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		var xi, yi, x, y, coors, x2, y2, dir2, found;
		var coorsInit, i;
		for (var i = 0 ; i < p_solver.nearToNewFencesChecker.list.length ; i++) {
			coorsInit = p_solver.nearToNewFencesChecker.list[i];
			p_solver.exploredSpacesNoCagesThisClusterChecker.clean();
			xi = coorsInit.x;
			yi = coorsInit.y;
			var spacesToExplore = [{x : xi, y : yi}];
			found = !p_solver.exploredSpacesNoCagesChecker.add(xi, yi); // See in setter the role of each of the three checkers.
			while (!found && spacesToExplore.length > 0) {
				coors = spacesToExplore.pop();
				x = coors.x;
				y = coors.y;
				p_solver.exploredSpacesNoCagesChecker.add(x, y);  
				found = p_solver.shapeAreaArray[y][x] != YAGIT_SHAPE.UNDECIDED;  // Note : because of events out of passes, areas cannot be coloured without actually belong to the same open cluster as a shape space. Great ! 
				// Don't forget that "thisCluster" checker ! exploredSpacesNoCagesChecker isn't enough because its only purpose is not to revisit spaces from the initial checker.
				if (!found && p_solver.exploredSpacesNoCagesThisClusterChecker.add(x, y)) {
					p_solver.existingNeighborsCoorsDirections(x, y).forEach(coorsDir2 => {
						x2 = coorsDir2.x;
						y2 = coorsDir2.y;
						dir2 = coorsDir2.direction;
						if (p_solver.getFenceFromSpace(x, y, dir2).state != FENCE_STATE.CLOSED) {
							spacesToExplore.push({x : x2, y : y2});
						}
					});
				}
			}
			if (!found) {
				listEventsToApply.push(new FailureEvent());
			}
		};
		p_solver.cleanNoCagesChecker();
		return listEventsToApply;
	}
}

// Preconditions : no cages generated. (see previous filter)
// Declares spaces that belongs to rectangles of empty un-coloured spaces as dead ends. Such rectangles are delimited by closed fences, edges of the grid and other dead-ends that aren't inspecte again.
// New open fences can be deducted as well.
function filterClaustrophobiaClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		var spaceToCheck;
		var freeDirectionsChecker = new CheckCollection(4);
		var xx, yy;
		p_solver.solvedTheOtherWayChecker.clean();
		for (var i = 0 ; i < p_solver.claustrophobiaChecker.list.length ; i++) {
			coors = p_solver.claustrophobiaChecker.list[i];
			x = coors.x;
			y = coors.y
			if (p_solver.shapeAreaArray[y][x] == YAGIT_SHAPE.UNDECIDED && !p_solver.deadEndsArray[y][x]) {
				freeDirectionsChecker.clean();
				p_solver.existingNeighborsDirections(x, y).forEach(dir => {
					if (p_solver.neighborNotDeadEndAccessibleFrom(x, y, dir)) {
						freeDirectionsChecker.add(dir);
					}
				});
				if (freeDirectionsChecker.list.length == 0) {				
					listEventsToApply.push(new FailureEvent());
					return listEventsToApply;
				} else if (freeDirectionsChecker.list.length == 1) {
					const dir = freeDirectionsChecker.list[0];
					listEventsToApply.push(new YagitFenceEvent(OrthogonalOrientationDirection[dir], p_solver.fencesIDGrid.getFence(x, y, dir), FENCE_STATE.OPEN));
					listEventsToApply.push(new DeadEndEvent(x, y));
				} else {
					// Okay ! For each free direction (at least 2), find potential dead ends.
					var canGoLeftTurn, canGoRightTurn, xx, yy, colourFound, canContinueAhead, listSpacesDeadEnd;
					var freeIndex;
					var fenceToOpenIndex = null;
					var fenceToOpenOrientation = null;
					freeDirectionsChecker.list.forEach(dir => {
						xx = x;
						yy = y;
						colourFound = false;
						canContinueAhead = true;
						fenceToOpenIndex = null;
						doubleFound = false;
						listSpacesDeadEnd = [];
						if (!p_solver.solvedTheOtherWayChecker.array[y][x][dir]) {
							while (!colourFound && !doubleFound && canContinueAhead) {								
								listSpacesDeadEnd.push({x : xx, y : yy});
								colourFound = (p_solver.shapeAreaArray[yy][xx] != YAGIT_SHAPE.UNDECIDED);
								if (!colourFound) {
									if (p_solver.neighborNotDeadEndAccessibleFrom(xx, yy, TurningLeftDirection[dir])) {
										index = p_solver.fencesIDGrid.getFence(xx, yy, TurningLeftDirection[dir]);
										if (fenceToOpenIndex != null && fenceToOpenIndex != index) {
											doubleFound = true;
										} else {
											fenceToOpenIndex = index;
										}
									}
									if (p_solver.neighborNotDeadEndAccessibleFrom(xx, yy, TurningRightDirection[dir])) {
										index = p_solver.fencesIDGrid.getFence(xx, yy, TurningRightDirection[dir]);
										if (fenceToOpenIndex != null && fenceToOpenIndex != index) {
											doubleFound = true;
										} else {
											fenceToOpenIndex = index;
										}
									}
									canContinueAhead = (p_solver.neighborExists(xx, yy, dir) && p_solver.getFenceFromSpace(xx, yy, dir).state != FENCE_STATE.CLOSED);
									if (canContinueAhead) {										
										xx += DeltaX[dir];
										yy += DeltaY[dir];
									}
								}
							}
							if (!canContinueAhead && !doubleFound) { // If we have !colourFound we have canContinueAhead
								listSpacesDeadEnd.forEach(coors => {
									listEventsToApply.push(new DeadEndEvent(coors.x, coors.y));
								});
								listEventsToApply.push(new YagitFenceEvent(OrientationDirection[dir], fenceToOpenIndex, FENCE_STATE.OPEN));
								p_solver.solvedTheOtherWayChecker.add(xx, yy, OppositeDirection[dir]);
							}
						}						
					});
				}
			}
		};
		p_solver.cleanClaustrophobiaChecker();
		return listEventsToApply;
	}
}

function abortClosure(p_solver) {
	return function() {
		p_solver.cleanNoCagesChecker();
		p_solver.cleanClaustrophobiaChecker();
	}
}

SolverYagit.prototype.cleanNoCagesChecker = function() {
	this.nearToNewFencesChecker.clean();
	this.exploredSpacesNoCagesChecker.clean();
}

SolverYagit.prototype.cleanClaustrophobiaChecker = function() {
	this.claustrophobiaChecker.clean();
}

// -------------------
// Pass

function copying(p_event) {
	return p_event.copy();
}

function comparison(p_event1, p_event2) { // Warning : more events to come soon !
	return commonComparison([p_event1.orientation, p_event1.index, p_event1.state], [p_event2.orientation, p_event2.index, p_event2.state])
}

SolverYagit.prototype.generateEventsAroundNodePass = function(p_x, p_y) {
	const node = this.nodesOccupationRDArray[p_y][p_x];
	var listPass = [];
	KnownDirections.forEach(dir => {		
		listPass.push([new YagitFenceEvent(OrientationDirection[dir], node.fenceIndexesAround[dir], FENCE_STATE.OPEN), 
		new YagitFenceEvent(OrientationDirection[dir], node.fenceIndexesAround[dir], FENCE_STATE.CLOSED)]);
	});
	return listPass;
}

SolverYagit.prototype.generateEventsAroundSpacePass = function(p_x, p_y) {
	var listPass = [];
	var x, y, index, orientation;
	this.existingNeighborsDirections(p_x, p_y).forEach(dir => {
		orientation = OrthogonalOrientationDirection[dir];
		index = this.getIndexFence(p_x, p_y, dir);
		listPass.push([new YagitFenceEvent(orientation, index, FENCE_STATE.OPEN), 
		new YagitFenceEvent(orientation, index, FENCE_STATE.CLOSED)]);
	});
	return listPass;
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_indexPass) {
		switch (p_indexPass.passCategory) {
			case PASS_CATEGORY.NODE : 
				return ("Node " + p_indexPass.x + "," + p_indexPass.y); break;
			case PASS_CATEGORY.SPACE : 
				return ("Space " + p_indexPass.x + "," + p_indexPass.y); break;
		}
	}
}

generateEventsForPassClosure = function(p_solver) {
	return function(p_indexPass) {
		switch (p_indexPass.passCategory) {
			case PASS_CATEGORY.NODE : 
				return p_solver.generateEventsAroundNodePass(p_indexPass.x, p_indexPass.y); break;
			case PASS_CATEGORY.SPACE : 
				return p_solver.generateEventsAroundSpacePass(p_indexPass.x, p_indexPass.y); break;			
		}
	}
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var listIndexesPass = [];
		var x, y, node;
		p_solver.coorsRDNodes.forEach(coors => {
			x = coors.x;
			y = coors.y;
			node = p_solver.nodesOccupationRDArray[y][x];
			if (node != null && node.stillUnknownYet > 0) {
				listIndexesPass.push({passCategory : PASS_CATEGORY.NODE, x : x, y : y});
			}
		});
		// TODO : okay, can be optimized !
		for(y = 0 ; y < p_solver.yLength ; y++) {			
			for (x = 0; x < p_solver.xLength ; x++) {
				if (p_solver.shapeAreaArray[y][x] == YAGIT_SHAPE.UNDECIDED) {
					listIndexesPass.push({passCategory : PASS_CATEGORY.SPACE, x : x, y : y});
				}
			}
		}
		return listIndexesPass;
	}	
}