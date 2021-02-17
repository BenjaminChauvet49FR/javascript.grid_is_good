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

RegionLoopSolver.prototype.regionLoopSolverConstruct = function(p_wallArray, p_packMethods) {
	this.loopSolverConstruct(p_wallArray, {
		setSpaceClosedPSAtomicDos : p_packMethods.setSpaceClosedPSAtomicDos,
		setSpaceLinkedPSAtomicDos : p_packMethods.setSpaceLinkedPSAtomicDos,
		setEdgeClosedPSAtomicDos : setEdgeClosedAtomicDoRLSClosure(this),
		setEdgeLinkedPSAtomicDos : setEdgeLinkedAtomicDoRLSClosure(this),
		otherPSAtomicDos : otherAtomicDoRLSClosure(this),
		setSpaceClosedPSAtomicUndos : p_packMethods.setSpaceClosedPSAtomicUndos,
		setSpaceLinkedPSAtomicUndos : p_packMethods.setSpaceLinkedPSAtomicUndos,
		setEdgeClosedPSAtomicUndos : setEdgeClosedAtomicUndosRLSClosure(this),
		setEdgeLinkedPSAtomicUndos : setEdgeLinkedAtomicUndosRLSClosure(this),
		otherPSAtomicUndos : otherAtomicUndosRLSClosure(this),
		setSpaceClosedPSDeductions : p_packMethods.setSpaceClosedPSDeductions,
		setSpaceLinkedPSDeductions : p_packMethods.setSpaceLinkedPSDeductions,
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsRLSClosure(this),
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsRLSClosure(this),
		otherPSDeductions : otherDeductionsRLSClosure(this),
		PSQuickStart : quickStartRegionLoopSolverClosure(this, p_packMethods.PSQuickStart)
	}); 
	this.gridWall = WallGrid_data(p_wallArray);
	this.borders = []; // Triangular array of borders
	//this.bordersEdgesIndexesGrid = []; // Array that gives spaces that share edges with regions border, 
	//giving the index of these edges in this border [y][x][dir]
	this.regionGrid = this.gridWall.toRegionGrid();
	this.regions = [];
	this.adjacentRegionsGrid = []; // contains list of {direction : dir, index : ir}. Indicates spaces that belong to a foreign region and their neighbors.

	var ix,iy;
	var lastRegionNumber = 0;
	
	// Number of regions + adjacentRegionsGrid // + this.bordersEdgesIndexesGrid
	for(iy = 0; iy < this.yLength; iy++) {
		this.adjacentRegionsGrid.push([]);
		//this.bordersEdgesIndexesGrid.push([]);
		for(ix = 0; ix < this.xLength; ix++) {
			lastRegionNumber = Math.max(this.regionGrid[iy][ix], lastRegionNumber);
			this.adjacentRegionsGrid[iy].push([]);
			//this.bordersEdgesIndexesGrid[ix].push({});
		}
	}
	
	this.nbRemainingLinksBetweenRegions = lastRegionNumber;
	
	// Region defintion
	for(var i=0 ; i<=lastRegionNumber ; i++) {
		this.regions.push( {
			spaces : [],
			size : 0,
			neighboringRegions : [],
			linkedRegions : [], // Allows to deduce "notYetOpenBorders"
			notYetClosedBorders : 0,
			oppositeLinkedRegion : LOOP_REGION_UNDEFINED,
			index : i
		});
	}
	
	// Spaces in each region
	for(iy = 0;iy < this.yLength;iy++) {
		for(ix = 0;ix < this.xLength;ix++) {
			if(this.regionGrid[iy][ix] >= 0) {
				this.regions[this.regionGrid[iy][ix]].spaces.push({x:ix, y:iy});
			}
		}
	}
	
	// Part specific for RegionLoopSolver
	this.defineBorders(); // initialize this.borders 
	this.buildBorders(); // fills this.borders with interesting data
	
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


// If properties "state" "edgesClosed" "edgesLinked" are undefined, this "borders" entry remain untouched as the border between regions i and j doesn't exist.
// borders[i1][i2].length can be called as a shortcut of borders[i1][i2].edges.length too.
// TODO warning : possible confusion between edgesLinked / edgesClosed
RegionLoopSolver.prototype.defineBorders = function() {
	for (var i = 0; i < this.regions.length ; i++) {
		this.borders.push([]);
		for (var j = 0; j < i ; j++) {
			this.borders[i].push({
				edges : []
			});
		}
	}
}

RegionLoopSolver.prototype.buildBorders = function() {
	var x, y, dx, dy, ir, dr, region;
	for(var ir = 0;ir < this.regions.length ; ir++) {
		region = this.regions[ir];
		region.size = region.spaces.length;
		region.index = ir;
		for(is = 0; is < region.size; is++) {
			space = region.spaces[is];
			x = space.x;
			y = space.y;
			LoopKnownDirections.forEach(dir => {
				if (this.neighborExists(x, y, dir)) {
					dx = x + DeltaX[dir];
					dy = y + DeltaY[dir];
					dr = this.getRegionIndex(dx, dy);
					if ((ir > dr) && (dr != WALLGRID.OUT_OF_REGIONS)) { // ir > dr test so a region doesn't get added twice.
						//Warning : name 'borders' of the array written here to optimize efficiency.
						l = this.borders[ir][dr].edges.length;
						this.borders[ir][dr].edges.push({
							x : dx, 
							y : dy, 
							direction : OppositeDirection[dir]
						}); 
						this.adjacentRegionsGrid[y][x].push({direction : dir, index : dr});
						this.adjacentRegionsGrid[dy][dx].push({direction : OppositeDirection[dir], index : ir});
						//this.bordersEdgesIndexesGrid[y][x][dir] = l;
						//this.bordersEdgesIndexesGrid[dy][dx][OppositeDirection[dir]] = l;
					}
				}
			});
		}
	}
	
	// Set borders length. Required for (areRegionsAdjacent) method.
	for(ir = 1; ir < this.regions.length ; ir++) {
		for(dr = 0; dr < ir; dr++) {
			this.borders[ir][dr].length = this.borders[ir][dr].edges.length; // The word length is allowed even for non-array items.
		}
	}
	
	// Set borders informations
	for(ir = 1; ir < this.regions.length ; ir++) {
		for(dr = 0; dr < ir; dr++) {
			if (this.areRegionsAdjacent(ir, dr)) {
				this.borders[ir][dr].state = BORDER_STATE.UNDECIDED;
				this.borders[ir][dr].edgesClosed = 0;
				this.borders[ir][dr].edgesLinked = 0;
				this.regions[ir].neighboringRegions.push(dr);
				this.regions[dr].neighboringRegions.push(ir);
			}
		}
	} 
	
	// Set "not yet..." informations on regions
	for (ir = 0 ; ir < this.regions.length ; ir++) {
		this.regions[ir].notYetClosedBorders = this.regions[ir].neighboringRegions.length - 2;
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
	return this.regionGrid[p_y][p_x];
}

RegionLoopSolver.prototype.getRegion = function(p_x, p_y) {
	if (p_y || p_y == 0) {
		return this.regions[this.regionGrid[p_y][p_x]];
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

// ---------------------------
// Classic getters

RegionLoopSolver.prototype.getSpaceCoordinates = function(p_indexRegion, p_indexSpace) {
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

// ---------------------------
// Applying

setEdgeClosedAtomicDoRLSClosure = function(p_solver) {
	return function (p_args) {
		const ri1 = p_solver.getRegionIndex(p_args.x, p_args.y);
		const ri2 = p_solver.getRegionIndex(p_args.otherX, p_args.otherY);
		if (ri1 != ri2 && ri1 != WALLGRID.OUT_OF_REGIONS && ri2 != WALLGRID.OUT_OF_REGIONS) {
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
		if (ri1 != ri2) {
			p_solver.getBorder(ri1, ri2).edgesLinked++;
		}
	}
}


otherAtomicDoRLSClosure = function(p_solver) {
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
					p_solver.nbRemainingLinksBetweenRegions--; //TODO 551551 gérer pour quand c'est égal à 0
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
			// ... 
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

otherAtomicUndosRLSClosure = function(p_solver) {
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
			// ...
		}
	}
}

// ---------------------------
// Deductions

setEdgeClosedDeductionsRLSClosure = function(p_solver) {
	return function (p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const ir = p_solver.getRegionIndex(x, y);
		const dx = x + DeltaX[p_eventBeingApplied.direction];
		const dy = y + DeltaY[p_eventBeingApplied.direction]; 
		const dr = p_solver.getRegionIndex(dx, dy);
		const border = p_solver.getBorder(ir, dr);
		if ((ir != dr) && (border.edgesClosed == border.length)) { 
			p_eventList.push(new RegionJunctionEvent(ir, dr, BORDER_STATE.CLOSED));
		}
		return p_eventList;
	}
}

setEdgeLinkedDeductionsRLSClosure = function(p_solver) {
	return function (p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const ir = p_solver.getRegionIndex(x, y);
		const dx = x + DeltaX[p_eventBeingApplied.direction];
		const dy = y + DeltaY[p_eventBeingApplied.direction]; 
		const dr = p_solver.getRegionIndex(dx, dy);
		const border = p_solver.getBorder(ir, dr);
		if (ir != dr) { 
			// Linked link crosses a region border. What happens ?
			p_eventList.push(new RegionJunctionEvent(ir, dr, BORDER_STATE.LINKED));
			p_eventList = p_solver.closeNotLinkedEdgesBorder(p_eventList, border);
		}
		return p_eventList;
	}
}

otherDeductionsRLSClosure = function(p_solver) {
	return function (p_eventList, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == LOOP_EVENT.REGION_JUNCTION) {
			const border = p_solver.getBorder(p_eventBeingApplied.index1, p_eventBeingApplied.index2);
			const region1 = p_solver.getRegion(p_eventBeingApplied.index1);
			const region2 = p_solver.getRegion(p_eventBeingApplied.index2);
			if (p_eventBeingApplied.state == BORDER_STATE.CLOSED) {
				border.edges.forEach(edge => {
					p_eventList.push(new LinkEvent(edge.x, edge.y, edge.direction, LOOP_STATE.CLOSED));
				});
				// If all borders surrounding a region but 2 are closed, these regions must be open. (Also, should be added to quickstart.)
				p_eventList = p_solver.alertClosedBorders(p_eventList, region1);
				p_eventList = p_solver.alertClosedBorders(p_eventList, region2);
			} else { // p_eventBeingApplied.state == BORDER_STATE.LINKED
				// When a border  has a linked edge, close the other edges.
				if (border.edgesLinked == 1) { // Warning : different behaviour in 2-region grid !
					p_eventList = p_solver.closeNotLinkedEdgesBorder(p_eventList, border);
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
			}
		} else {
			// ...
		}
		return p_eventList;
	}
}

// One edge in a region border is linked : close the other ones.
RegionLoopSolver.prototype.closeNotLinkedEdgesBorder = function(p_eventList, p_border) {
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

RegionLoopSolver.prototype.alertClosedBorders = function(p_eventList, p_region) {
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
			events = p_solver.alertClosedBorders(events, p_solver.regions[i]);
		}
		events.forEach(event_ => {
			p_solver.tryToApplyHypothesis(event_, p_solver.methodSetDeductions);
		});
		p_solver.terminateQuickStart();
		if (p_PSQuickStart) {
			p_PSQuickStart();			
		}
	}
}