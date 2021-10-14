/**
Purpose : like LoopSolver, except the loop contains regions ; it must pass through each of them exactly once.
And at least one space in each region.
*/

// -------
// Consts 

LOOP_REGION_UNDEFINED = -1;

// -------
// Setup

RegionLoopSolver.prototype = Object.create(LoopSolver.prototype);

function RegionLoopSolver() { 
	LoopSolver.call(this);
}

RegionLoopSolver.prototype.constructor = RegionLoopSolver;

function identityDeductionsClosure() {return function(p_listEvents) {return p_listEvents}}
function doNothingClosure() {return function() {}}

RegionLoopSolver.prototype.regionLoopSolverConstruct = function(p_wallArray, p_packMethods) {
	if (!p_packMethods.setSpaceClosedPSAtomicDos) {
		p_packMethods.setSpaceClosedPSAtomicDos = doNothingClosure();
	}
	if (!p_packMethods.setSpaceLinkedPSAtomicDos) {
		p_packMethods.setSpaceLinkedPSAtomicDos = doNothingClosure();
	}
	if (!p_packMethods.setSpaceClosedPSAtomicUndos) {
		p_packMethods.setSpaceClosedPSAtomicUndos = doNothingClosure();
	}
	if (!p_packMethods.setSpaceLinkedPSAtomicUndos) {
		p_packMethods.setSpaceLinkedPSAtomicUndos = doNothingClosure();
	}
	if (!p_packMethods.setBorderLinkedPSDeductions) {
		p_packMethods.setBorderLinkedPSDeductions = identityDeductionsClosure();
	}
	if (!p_packMethods.setBorderClosedPSDeductions) {
		p_packMethods.setBorderClosedPSDeductions = identityDeductionsClosure();
	}
	if (!p_packMethods.setEdgeLinkedPSDeductions) {
		p_packMethods.setEdgeLinkedPSDeductions = identityDeductionsClosure();
	}
	if (!p_packMethods.setEdgeClosedPSDeductions) {
		p_packMethods.setEdgeClosedPSDeductions = identityDeductionsClosure();
	}
	if (!p_packMethods.otherPSDeductions) {
		p_packMethods.otherPSDeductions = identityDeductionsClosure();
	}
	
	// Pass and multipass related 
	p_packMethods.comparisonPS = p_packMethods.comparisonPS;
	if (!p_packMethods.comparisonPS) { p_packMethods.comparisonPS = function(){}} // Should not be sollicited
	p_packMethods.namingCategoryPS = p_packMethods.namingCategoryPS;
	if (!p_packMethods.namingCategoryPS) { p_packMethods.namingCategoryPS = function() {} } // Should not be sollicited 
	if (!p_packMethods.orderedListPassArgumentsPS) {p_packMethods.orderedListPassArgumentsPS = function() { return []}}
	if (!p_packMethods.generateEventsForPassPS) {p_packMethods.generateEventsForPassPS = function() { return []}}
	
	// Transmit the pack method to above 
	this.loopSolverConstruct(p_wallArray, {
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDoRLSClosure(this, p_packMethods.setSpaceClosedPSAtomicDos),
		setSpaceLinkedPSAtomicDos : p_packMethods.setSpaceLinkedPSAtomicDos,
		setEdgeClosedPSAtomicDos : setEdgeClosedAtomicDoRLSClosure(this),
		setEdgeLinkedPSAtomicDos : setEdgeLinkedAtomicDoRLSClosure(this),
		otherPSAtomicDos : otherAtomicDoRLSClosure(this, p_packMethods.otherPSAtomicDos),
		setSpaceClosedPSAtomicUndos : p_packMethods.setSpaceClosedPSAtomicUndos,
		setSpaceLinkedPSAtomicUndos : p_packMethods.setSpaceLinkedPSAtomicUndos,
		setEdgeClosedPSAtomicUndos : setEdgeClosedAtomicUndosRLSClosure(this),
		setEdgeLinkedPSAtomicUndos : setEdgeLinkedAtomicUndosRLSClosure(this),
		otherPSAtomicUndos : otherAtomicUndosRLSClosure(this, p_packMethods.otherPSAtomicUndos),
		setSpaceClosedPSDeductions : p_packMethods.setSpaceClosedPSDeductions,
		setSpaceLinkedPSDeductions : p_packMethods.setSpaceLinkedPSDeductions,
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsRLSClosure(this, p_packMethods.setEdgeClosedPSDeductions),
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsRLSClosure(this, p_packMethods.setEdgeLinkedPSDeductions),
		otherPSDeductions : otherDeductionsRLSClosure(this, p_packMethods.setBorderLinkedPSDeductions, p_packMethods.setBorderClosedPSDeductions, p_packMethods.otherPSDeductions), // "setBorder" methods arguments : p_eventList, index1, index2
		PSQuickStart : quickStartRegionLoopSolverClosure(this, p_packMethods.PSQuickStart),
		// Pass related. Note that not all the methods '"pass and multipass related" in LoopSolver' have been used.
		multipassPessimismPS : false, 
		comparisonPS : comparisonRegionLoopSolverEventsClosure(p_packMethods.comparisonPS),
		generateEventsForPassPS : generateEventsForPassRegionLoopClosure(this, p_packMethods.generateEventsForPassPS),
		orderedListPassArgumentsPS : orderedListPassArgumentsRegionLoopClosure(this, p_packMethods.orderedListPassArgumentsPS),
		namingCategoryPS : namingCategoryRegionLoopClosure(this, p_packMethods.namingCategoryPS)
	}); 
	this.gridWall = WallGrid_data(p_wallArray);
	this.borders = []; // Triangular array of borders
	this.regionArray = this.gridWall.toRegionArray();
	//this.adjacentRegionsArray = generateFunctionValueArray(this.xLength, this.yLength, function(){{return []}} );
	const spacesByRegion = listSpacesByRegion(this.regionArray);
	this.regions = [];
	this.nbRemainingLinksBetweenRegions = spacesByRegion.length - 1;
	
	// Region defintion
	for(var i=0 ; i < spacesByRegion.length ; i++) {
		this.regions.push( {
			spaces : spacesByRegion[i],
			size : spacesByRegion[i].length,
			neighboringRegions : [],
			linkedRegions : [], // Allows to deduce "notYetOpenBorders"
			notYetClosedBorders : 0,
			oppositeLinkedRegion : LOOP_REGION_UNDEFINED,
			index : i
		});
	}
	
	// Part specific for RegionLoopSolver
	this.otherRegionsDirectionsArray = getOtherRegionDirectionsArray(this.regionArray);
	this.borders = getBordersTriangle(this.regionArray, this.regions.length);
	
	var tmp;
	for(ir = 1; ir < this.regions.length ; ir++) {
		for(dr = 0; dr < ir; dr++) {
			if (this.areRegionsAdjacent(ir, dr)) {
				tmp = this.borders[ir][dr];
				this.borders[ir][dr] = {
					edges : tmp,
					length : tmp.length, 
					edgesClosed : 0,
					edgesLinked : 0,
					state : BORDER_STATE.UNDECIDED
				}
				this.regions[ir].neighboringRegions.push(dr);
				this.regions[dr].neighboringRegions.push(ir);
			} 
		}
	} 
	
	// Set "not yet..." informations on regions
	for (ir = 0 ; ir < this.regions.length ; ir++) {
		this.regions[ir].notYetClosedBorders = this.regions[ir].neighboringRegions.length - 2;
	}
	
	// Purification
	for (y = 0 ; y < this.yLength ; y++) {
		for (x = 0 ; x < this.xLength ; x++) {
			if (p_wallArray[y][x].state == WALLGRID.CLOSED) {
				this.banSpace(x, y);
			}
		}
	}
}

RegionLoopSolver.prototype.constructor = RegionLoopSolver;

// Contact between regions. Triangular array where column indexes are lower than row indexes.
RegionLoopSolver.buildContacts = function(p_i1, p_i2) {
	this.contactsRegion = [];
	for (var i = 0; i < this.regions.length ; i++) {
		this.contactsRegion.push([]);
		for (var j = 0; j < i ; j++) {
			this.contactsRegion[i].push(false);
		}
	}
}

RegionLoopSolver.prototype.getContact = function(p_i1, p_i2) {
	if (p_i2 > p_i1) {
		return this.getContact(p_i2, p_i1);
	} else {
		return this.contact[p_i1][p_i2];
	}
}

RegionLoopSolver.prototype.setContact = function(p_i1, p_i2) {
	if (p_i2 > p_i1) {
		this.getContact(p_i2, p_i1);
	} else {
		this.contact[p_i1][p_i2] = true;
	}
}


// ---------------------------
// Getters

RegionLoopSolver.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionArray[p_y][p_x];
}

RegionLoopSolver.prototype.getRegion = function(p_x, p_y) {
	if (p_y || p_y == 0) {
		return this.regions[this.regionArray[p_y][p_x]];
	} else {
		return this.regions[p_x];
	}
}

// Return the item border. A list of edges that symbolize the separation of 2 regions.
RegionLoopSolver.prototype.getBorder = function (p_i1, p_i2) {
	if (p_i2 > p_i1) {
		return this.getBorder(p_i2, p_i1);
	} else {
		return this.borders[p_i1][p_i2];
	}
}

// Requires that p_i1 > p_i2
RegionLoopSolver.prototype.areRegionsAdjacent = function(p_i1, p_i2) {
	return this.borders[p_i1][p_i2].length > 0;
}

// Equivalent of areRegionsAdjacent except it makes sure it is callable re
RegionLoopSolver.prototype.areRegionsAdjacentSafe = function(p_i1, p_i2) {
	if (p_i2 > p_i1) {
		return this.borders[p_i2][p_i1].length > 0;
	} else {
		return this.borders[p_i1][p_i2].length > 0;
	}
}

function borderingIndexes(p_index1, p_index2) {
	return p_index1 != WALLGRID.OUT_OF_REGIONS && p_index2 != WALLGRID.OUT_OF_REGIONS && p_index1 != p_index2;
}

// ---------------------------
// Classic getters

RegionLoopSolver.prototype.getSpaceCoordinates = function(p_indexRegion, p_Argumentspace) {
	return this.regions[p_indexRegion].spaces[p_Argumentspace];
}

// ---------------------------
// Applying

setSpaceClosedPSAtomicDoRLSClosure = function(p_solver, p_methodSetSpaceClosedPSAtomicDos) {
	return function(p_args) {
		const ir = p_solver.getRegionIndex(p_args.x, p_args.y);
		p_methodSetSpaceClosedPSAtomicDos(p_args);
	}
}

setEdgeClosedAtomicDoRLSClosure = function(p_solver) {
	return function (p_args) {
		const ri1 = p_solver.getRegionIndex(p_args.x, p_args.y);
		const ri2 = p_solver.getRegionIndex(p_args.otherX, p_args.otherY);
		if (borderingIndexes(ri1, ri2)) {
			// These OUT_OF_REGIONS checks are due to the banning time.
			// TODO I wish I could pass ri1 and ri2 as args to the event to make undo easier.
			p_solver.getBorder(ri1, ri2).edgesClosed++;
		}
	}
}

setEdgeLinkedAtomicDoRLSClosure = function(p_solver) {
	return function (p_args) {
		const ri1 = p_solver.getRegionIndex(p_args.x, p_args.y);
		const ri2 = p_solver.getRegionIndex(p_args.otherX, p_args.otherY);
		if (borderingIndexes(ri1, ri2)) {
			p_solver.getBorder(ri1, ri2).edgesLinked++;
		}
	}
}


otherAtomicDoRLSClosure = function(p_solver, p_methodOtherPSDos) {
	return function (p_event) {
		if (p_event.kind == LOOP_EVENT.REGION_JUNCTION) {
			const newState = p_event.state;
			const border = p_solver.getBorder(p_event.index1, p_event.index2);
			const oldState = border.state;
			if (newState == oldState) {
				return EVENT_RESULT.HARMLESS;
			} else if (oldState != BORDER_STATE.UNDECIDED) {
				return EVENT_RESULT.FAILURE;
			} else {
				border.state = newState;
				const region1 = p_solver.regions[p_event.index1];
				const region2 = p_solver.regions[p_event.index2];
				if (newState == BORDER_STATE.LINKED) {
					region1.linkedRegions.push(p_event.index2);
					region2.linkedRegions.push(p_event.index1);
					const l1 = region1.linkedRegions.length;
					const l2 = region2.linkedRegions.length;
					p_solver.nbRemainingLinksBetweenRegions--; 
					if (l1 == 1) { 
						if (l2 == 1) {
							region1.oppositeLinkedRegion = p_event.index2;
							region2.oppositeLinkedRegion = p_event.index1;
						} else {
							const oppo2 = region2.oppositeLinkedRegion;
							p_solver.regions[oppo2].oppositeLinkedRegion = p_event.index1;
							region1.oppositeLinkedRegion = oppo2;
						}
					} else {
						if (l2 == 1) {
							const oppo1 = region1.oppositeLinkedRegion;
							p_solver.regions[oppo1].oppositeLinkedRegion = p_event.index2;
							region2.oppositeLinkedRegion = oppo1;
						} else {
							const oppo1 = region1.oppositeLinkedRegion;
							const oppo2 = region2.oppositeLinkedRegion;
							/*
							if ((thisOpposite.x == p_x2) && (thisOpposite.y == p_y2) && (otherOpposite.x == p_x) && (otherOpposite.y == p_y)) { // If (p_x, p_y) and (p_x2, p_y2) were already opposed prior to be linked, a loop is made. 
								this.loopMade++; // TODO maybe this can be sped up : if we have 2 loops or more, it should be aborted !
							}	
							*/
							p_solver.regions[oppo1].oppositeLinkedRegion = oppo2;
							p_solver.regions[oppo2].oppositeLinkedRegion = oppo1;
						}
					}
				} else { //p_event.state == BORDER_STATE.CLOSED
					region1.notYetClosedBorders--;
					region2.notYetClosedBorders--;
				}
				return EVENT_RESULT.SUCCESS;			
			}	
		} else {
			return p_methodOtherPSDos(p_event);
		}
	}
}

setEdgeClosedAtomicUndosRLSClosure = function(p_solver) {
	return function (p_args) {
		const ri1 = p_solver.getRegionIndex(p_args.x, p_args.y);
		const ri2 = p_solver.getRegionIndex(p_args.otherX, p_args.otherY);
		if (ri1 != ri2) {
			p_solver.getBorder(ri1, ri2).edgesClosed--;
		}
	}
}

setEdgeLinkedAtomicUndosRLSClosure = function(p_solver) {
	return function (p_args) {
		const ri1 = p_solver.getRegionIndex(p_args.x, p_args.y);
		const ri2 = p_solver.getRegionIndex(p_args.otherX, p_args.otherY);
		if (ri1 != ri2) {
			p_solver.getBorder(ri1, ri2).edgesLinked--;
		}
	}
}

otherAtomicUndosRLSClosure = function(p_solver, p_methodOtherPSUndos) {
	return function (p_event) {
		if (p_event.kind == LOOP_EVENT.REGION_JUNCTION) {
			const region1 = p_solver.regions[p_event.index1];
			const region2 = p_solver.regions[p_event.index2];
			if (p_event.state == BORDER_STATE.LINKED) {
				region1.linkedRegions.pop();
				region2.linkedRegions.pop();
				const l1 = region1.linkedRegions.length;
				const l2 = region2.linkedRegions.length;
				this.nbRemainingLinksBetweenRegions++;
				if (l1 == 0) {
					region1.oppositeLinkedRegion = LOOP_REGION_UNDEFINED;
					if (l2 == 0) {
						region2.oppositeLinkedRegion = LOOP_REGION_UNDEFINED;
					} else {
						const remainingEnd = region2.oppositeLinkedRegion;
						p_solver.regions[remainingEnd].oppositeLinkedRegion = p_event.index2;
					}
				} else {
					const remainingEnd = region1.oppositeLinkedRegion;
					p_solver.regions[remainingEnd].oppositeLinkedRegion = p_event.index1;
					if (l2 == 0) {
						region2.oppositeLinkedRegion = LOOP_REGION_UNDEFINED;
					} else {
						const remainingEnd2 = region2.oppositeLinkedRegion;
						p_solver.regions[remainingEnd2].oppositeLinkedRegion = p_event.index2;
					}
				}
			} else { //p_event.state == BORDER_STATE.CLOSED
				region1.notYetClosedBorders++;
				region2.notYetClosedBorders++;
			}				
			p_solver.getBorder(p_event.index1, p_event.index2).state = BORDER_STATE.UNDECIDED;	
		} else {
			return p_methodOtherPSUndos(p_event);
		}
	}
}

// ---------------------------
// Deductions

setEdgeClosedDeductionsRLSClosure = function(p_solver, p_methodEdgeClosedDeductionsPS) {
	return function (p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const ir = p_solver.getRegionIndex(x, y);
		if (ir != WALLGRID.OUT_OF_REGIONS) {			
			const dx = x + DeltaX[p_eventBeingApplied.direction];
			const dy = y + DeltaY[p_eventBeingApplied.direction]; 
			const dr = p_solver.getRegionIndex(dx, dy);
			if (dr != WALLGRID.OUT_OF_REGIONS) {
				const border = p_solver.getBorder(ir, dr);				
				if ((ir != dr) && (border.edgesClosed == border.length)) { 
					p_eventList.push(new RegionJunctionEvent(ir, dr, BORDER_STATE.CLOSED));
				}
			}
		}
		p_eventList = p_methodEdgeClosedDeductionsPS(p_eventList, p_eventBeingApplied);
		return p_eventList;
	}
}

setEdgeLinkedDeductionsRLSClosure = function(p_solver, p_methodEdgeLinkedDeductionsPS) {
	return function (p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const ir = p_solver.getRegionIndex(x, y);
		const dx = x + DeltaX[p_eventBeingApplied.direction];
		const dy = y + DeltaY[p_eventBeingApplied.direction]; 
		const dr = p_solver.getRegionIndex(dx, dy);
		const border = p_solver.getBorder(ir, dr);
		if (borderingIndexes(ir, dr)) { 
			// Linked link crosses a region border. What happens ?
			p_eventList.push(new RegionJunctionEvent(ir, dr, BORDER_STATE.LINKED));
			p_eventList = p_solver.deductionsCloseNotLinkedEdgesBorder(p_eventList, border);
		}
		p_eventList = p_methodEdgeLinkedDeductionsPS(p_eventList, p_eventBeingApplied);
		return p_eventList;
	}
}

otherDeductionsRLSClosure = function(p_solver, p_methodSetBorderLinkedPSDeductions, p_methodSetBorderClosedPSDeductions, p_methodOtherPSDeductions) {
	return function (p_eventList, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == LOOP_EVENT.REGION_JUNCTION) {
			if (borderingIndexes(p_eventBeingApplied.index1, p_eventBeingApplied.index2)) {
				const border = p_solver.getBorder(p_eventBeingApplied.index1, p_eventBeingApplied.index2);
				const region1 = p_solver.getRegion(p_eventBeingApplied.index1);
				const region2 = p_solver.getRegion(p_eventBeingApplied.index2);
				if (p_eventBeingApplied.state == BORDER_STATE.CLOSED) {
					border.edges.forEach(edge => {
						p_eventList.push(new LinkEvent(edge.x, edge.y, edge.direction, LOOP_STATE.CLOSED));
					});
					// If all borders surrounding a region but 2 are closed, these regions must be open. (Also, should be added to quickstart.)
					p_eventList = p_solver.deductionsAlertClosedBorder(p_eventList, region1);
					p_eventList = p_solver.deductionsAlertClosedBorder(p_eventList, region2);
					p_eventList = p_methodSetBorderClosedPSDeductions(p_eventList, p_eventBeingApplied.index1, p_eventBeingApplied.index2);
				} else { // p_eventBeingApplied.state == BORDER_STATE.LINKED
					// When a border  has a linked edge, close the other edges.
					if (border.edgesLinked == 1) { // Warning : different behaviour in 2-region grid !
						p_eventList = p_solver.deductionsCloseNotLinkedEdgesBorder(p_eventList, border);
					}

					// If a region is fully crossed
					if (region1.linkedRegions.length == 2) {
						region1.neighboringRegions.forEach(ri => {
							if (ri != region1.linkedRegions[0] && ri != region1.linkedRegions[1]) {
								p_eventList.push(new RegionJunctionEvent(p_eventBeingApplied.index1, ri, BORDER_STATE.CLOSED));
							}
						});
					} 
					if (region2.linkedRegions.length == 2) {
						region2.neighboringRegions.forEach(ri => {
							if (ri != region2.linkedRegions[0] && ri != region2.linkedRegions[1]) {
								p_eventList.push(new RegionJunctionEvent(p_eventBeingApplied.index2, ri, BORDER_STATE.CLOSED));
							}
						});
					}
					
					// If a chain of opposite regions are adjacent but not immediately linked, close their border immediately ! Unless the loop is ended.
					const oppo1 = region1.oppositeLinkedRegion;
					const oppo2 = p_solver.regions[oppo1].oppositeLinkedRegion;
					if (p_solver.nbRemainingLinksBetweenRegions > 0) {
						if (oppo1 == oppo2) {
							p_eventList.push(new FailureEvent());
							return p_eventList;
						}
						if (p_solver.getBorder(oppo1, oppo2).length > 0 && p_solver.getBorder(oppo1, oppo2).state == BORDER_STATE.UNDECIDED) {
							p_eventList.push(new RegionJunctionEvent(oppo1, oppo2, BORDER_STATE.CLOSED));
						} 
					}
					
					// If a border is linked and has only one non-closed edge yet :
					if ((border.edgesClosed == border.length - 1) && (border.edgesLinked == 0)) {
						var ok = false;
						border.edges.forEach(edge => {
							if (p_solver.getLink(edge.x, edge.y, edge.direction) != LOOP_STATE.CLOSED) {
								p_eventList.push(new LinkEvent(edge.x, edge.y, edge.direction, LOOP_STATE.LINKED));
								ok = true;
								//return;
							}
						});
						if (!ok) {
							p_eventList.push(new FailureEvent());
						}
					}
					p_eventList = p_methodSetBorderLinkedPSDeductions(p_eventList, p_eventBeingApplied.index1, p_eventBeingApplied.index2);
				}
			}	
		} else {
			p_eventList = p_methodOtherPSDeductions(p_eventList, p_eventBeingApplied);
		}
		return p_eventList;
	}
}

// One edge in a region border is linked : close the other ones.
RegionLoopSolver.prototype.deductionsCloseNotLinkedEdgesBorder = function(p_eventList, p_border) {
	var indexOpening = 0;
	var foundOpening = false;
	while (!foundOpening && indexOpening < p_border.length) { // Also warning ! 
		edge = p_border.edges[indexOpening];
		foundOpening = (this.getLink(edge.x, edge.y, edge.direction) == LOOP_STATE.LINKED);
		if (!foundOpening) {
			p_eventList.push(new LinkEvent(edge.x, edge.y, edge.direction, LOOP_STATE.CLOSED));							
		}
		indexOpening++;
	} // indexOpening == (index of the linked edge in the border plus 1. (if found)
	if (!foundOpening) {
		p_eventList.push(new FailureEvent());
		return p_eventList;
	} else {
		var edge;
		for (var i = indexOpening; i < p_border.length ; i++) { 
			edge = p_border.edges[i];
			p_eventList.push(new LinkEvent(edge.x, edge.y, edge.direction, LOOP_STATE.CLOSED));
		} 
	}
	return p_eventList;
}

RegionLoopSolver.prototype.deductionsAlertClosedBorder = function(p_eventList, p_region) {
	if (p_region.notYetClosedBorders == 0) {
		var linkedFound = 0;
		const index = p_region.index;
		p_region.neighboringRegions.forEach(ir => {
			if (this.getBorder(ir, index).state != BORDER_STATE.CLOSED) {
				linkedFound++;
				p_eventList.push(new RegionJunctionEvent(ir, index, BORDER_STATE.LINKED));
				if (linkedFound == 2) {
					return;
				}
			}
		});
	}
	return p_eventList;
}

// ---------------------------
// Quick start

quickStartRegionLoopSolverClosure = function(p_solver, p_PSQuickStart) {
	return function() {
		p_solver.initiateQuickStart("Region loop");
		var events = [];
		for (var i = 0; i < p_solver.regions.length ; i++) {
			events = p_solver.deductionsAlertClosedBorder(events, p_solver.regions[i]);
			if (p_solver.regions[i].size == 1) { // "Each region must be crossed exactly once"
				const space = p_solver.regions[i].spaces[0];
				events.push(new SpaceEvent(space.x, space.y, LOOP_STATE.LINKED));
			}
		}
		events.forEach(event_ => {
			p_solver.tryToApplyHypothesis(event_);
		});
		p_solver.terminateQuickStart();
		if (p_PSQuickStart) {
			p_PSQuickStart();			
		}
	}
}

// ---------------------------
// Pass

function generateEventsForPassRegionLoopClosure(p_solver, p_methodPS) {
	return function(p_passIndex) {
		return p_solver.generateEventsForRegionPass(p_passIndex, p_methodPS);
	}
}

RegionLoopSolver.prototype.generateEventsForRegionPass = function(p_passIndex, p_methodPS) {
	switch(p_passIndex.passCategory) {
		case LOOP_PASS_CATEGORY.REGION : 
			return this.generateEventsForRegionPassStandard(p_passIndex.index);
		break;
		default : 
			return p_methodPS(p_passIndex);
		break;
	}
}

RegionLoopSolver.prototype.generateEventsForRegionPassStandard = function(p_indexRegion) {
	var answer = [];
	const region = this.regions[p_indexRegion];
	var x, y;
	region.spaces.forEach(coors => {
		x = coors.x;
		y = coors.y;
		KnownDirections.forEach(dir => {			
			if (this.neighborExists(x, y, dir) && this.regionArray[y + DeltaY[dir]][x + DeltaX[dir]] != WALLGRID.OUT_OF_REGIONS) {
				if (this.regionArray[y+ DeltaY[dir]][x + DeltaX[dir]] != p_indexRegion || dir == DIRECTION.LEFT || dir == DIRECTION.UP) {
					answer.push([new LinkEvent(x, y, dir, LOOP_STATE.LINKED), new LinkEvent(x, y, dir, LOOP_STATE.CLOSED)]);
				}
			}
		});
	});
	return answer;
}

// Rememver : the function inside CLSEC (see LoopSolver) is called only if p_event1.kind == p_event2.kind
comparisonRegionLoopSolverEventsClosure = function(p_methodPS) {
	return comparisonLoopSolverEventsClosure(
		function(p_event1, p_event2) {
			if (p_event1.kind == LOOP_EVENT.REGION_JUNCTION) {
				return commonComparison([p_event1.index1, p_event1.index2, p_event1.state], [p_event2.index1, p_event2.index2, p_event2.state]);
			} else {
				return p_methodPS(p_event1, p_event2);
			}
		}
	);
}

function orderedListPassArgumentsRegionLoopClosure(p_solver, p_methodPS) {
	return function() {
		return p_solver.orderedListPassArgumentsRegionLoop(p_methodPS);
	}
}

RegionLoopSolver.prototype.orderedListPassArgumentsRegionLoop = function(p_methodPS) {	
	var answer = p_methodPS();
	const list2 = this.orderedListPassArgumentsRegionLoopStandard();
	list2.forEach(passArg => {
		answer.push(passArg);
	});
	return answer;
}

RegionLoopSolver.prototype.orderedListPassArgumentsRegionLoopStandard = function() { // Shouldn't have any level below. 
	var answer = [];
	for (var i = 0 ; i < this.regions.length ; i++) {
		answer.push({passCategory : LOOP_PASS_CATEGORY.REGION, index : i});
	}
	var regions = this.regions; 
	answer.sort(function(i1, i2) {
		//return this.regions[i1.index].size - this.regions[i2.index].size; // Inside sort, "this" is window. Well... 
		return regions[i1.index].size - regions[i2.index].size;
	});
	return answer;
}

function namingCategoryRegionLoopClosure (p_solver, p_namingCategoryPSMethod) { // Should also not have any level below, but...
	return function(p_passIndex) {
		switch(p_passIndex.passCategory) {
			case LOOP_PASS_CATEGORY.REGION : 
				const regionSpace = p_solver.regions[p_passIndex.index].spaces[0];
				return "Region " + p_passIndex.index + " (" + regionSpace.x + "," + regionSpace.y + ")";
			break;
			default : 
				return p_namingCategoryPSMethod(p_passIndex);
			break;
		}
	}
}