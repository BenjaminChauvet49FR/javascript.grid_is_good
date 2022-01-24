function setEdgeLinkedPSAtomicDosClosure(p_solver) {
	return function(p_args) {
		const x = p_args.x;
		const y = p_args.y;
		const dir = p_args.direction;
		// The link goes from x, y in direction dir. So... 
		p_solver.dataArray[y][x].pearlsThatReachSameDir[dir].forEach(space => {
			p_solver.checkerMinsToUpdate.add(space.x, space.y, dir);
		});
		const dx = x + DeltaX[dir];
		const dy = y + DeltaY[dir];
		const odir = OppositeDirection[dir];
		p_solver.dataArray[dy][dx].pearlsThatReachSameDir[odir].forEach(space => {
			p_solver.checkerMinsToUpdate.add(space.x, space.y, odir);
		});	
	}
}

function setEdgeClosedPSAtomicDosClosure(p_solver) {
	return function(p_args) {
		const x = p_args.x; // Copy-pasted
		const y = p_args.y;
		const dir = p_args.direction;
		// The link goes from x, y in direction dir. So... 
		p_solver.dataArray[y][x].pearlsThatReachSameDir[dir].forEach(space => {
			p_solver.checkerMinMaxes.add(space.x, space.y);
		});
		const dx = x + DeltaX[dir];
		const dy = y + DeltaY[dir];
		const odir = OppositeDirection[dir];
		p_solver.dataArray[dy][dx].pearlsThatReachSameDir[odir].forEach(space => {
			p_solver.checkerMinMaxes.add(space.x, space.y);
		});	
	}
}

// -------------------
// Deductions

function otherAtomicDosClosure(p_solver) {
	return function(p_event) {
		const dir = p_event.direction;
		const space = p_solver.dataArray[p_event.y][p_event.x];
		if (p_event.kind == KIND_EVENT.RANGE_MIN) {			
			const min = p_event.min;
			if (min > space.maxes[dir]) {
				return EVENT_RESULT.FAILURE;
			}
			const formerMin = space.mins[dir];
			if (min <= formerMin) {
				return EVENT_RESULT.HARMLESS;
			} 
			p_event.formerMin = formerMin;
			space.mins[dir] = min;
		} else {
			const max = p_event.max;
			if (max < space.mins[dir]) {
				return EVENT_RESULT.FAILURE;
			}
			const formerMax = space.maxes[dir];
			if (max >= formerMax) {
				return EVENT_RESULT.HARMLESS;
			} 
			p_event.formerMax = formerMax;
			space.maxes[dir] = max;
		}
		p_solver.checkerMinMaxes.add(p_event.x, p_event.y);
		return EVENT_RESULT.SUCCESS;
	}
}

function otherAtomicUndosClosure(p_solver) {
	return function(p_event) {
		if (p_event.kind == KIND_EVENT.RANGE_MIN) {			
				numericSpace = p_solver.dataArray[p_event.y][p_event.x];
				numericSpace.mins[p_event.direction] = p_event.formerMin;
		} else {
				dir = p_event.direction;
				numericSpace = p_solver.dataArray[p_event.y][p_event.x];
				numericSpace.maxes[p_event.direction] = p_event.formerMax;
		}
	}
}


function setEdgeLinkedDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const dir = p_eventBeingApplied.direction;
		p_eventList = p_solver.oppositionPearlDeductions(p_eventList, x, y, dir, LOOP_STATE.LINKED, LOOP_STATE.CLOSED);
		p_eventList = p_solver.transversalMaxDeductions(p_eventList, x, y, OrthogonalDirections[dir]);
		p_eventList = p_solver.transversalMaxDeductions(p_eventList, x + DeltaX[dir], y + DeltaY[dir], OrthogonalDirections[dir]);
		return p_eventList;
	}
}

function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const dir = p_eventBeingApplied.direction;
		p_eventList = p_solver.oppositionPearlDeductions(p_eventList, x, y, dir, LOOP_STATE.CLOSED, LOOP_STATE.LINKED);
		p_eventList = p_solver.maxLinearDeductions(p_eventList, x, y, dir, true);
		p_eventList = p_solver.maxLinearDeductions(p_eventList, x+DeltaX[dir], y+DeltaY[dir], OppositeDirection[dir], true);
		return p_eventList;
	}
}

function distance(p_x, p_y, p_x2, p_y2) {
	return Math.abs(p_x2-p_x) + Math.abs(p_y2-p_y); // Note : Clearly there is something suboptimal in this chain of calls
}


LoopSolver.prototype.transversalMaxDeductions = function(p_deductions, p_x, p_y, p_directions) {
	p_deductions = this.maxLinearDeductions(p_deductions, p_x, p_y, p_directions[0], false);
	return this.maxLinearDeductions(p_deductions, p_x, p_y, p_directions[1], false);
}

LoopSolver.prototype.maxLinearDeductions = function(p_deductions, p_x, p_y, p_direction, p_closeFromClosedLink) {
	var distancePS; // PS = pearl-space
	this.dataArray[p_y][p_x].pearlsThatReachSameDir[p_direction].forEach(space => {
		distancePS = distance(p_x, p_y, space.x, space.y);
		if (distancePS > 0 || p_closeFromClosedLink) { // Assuming a pearl reaches itself (definition of pearlsThatReachSameDir) : it can't have a max of 0 in all four directions of course.
			// If not for the p_closeFromClosedLink, mins on pearls themselves would never get caught
			p_deductions.push(new MaxRangeEvent(space.x, space.y, p_direction, distancePS));
		} 
	});
	return p_deductions;
}

LoopSolver.prototype.oppositionPearlDeductions = function(p_eventList, p_x, p_y, p_dir, p_linkStateForWhite, p_linkStateForBlack) {
	if (this.isShingokiSolver) {		
		const dx = p_x + DeltaX[p_dir];
		const dy = p_y + DeltaY[p_dir];
		const ddir = OppositeDirection[p_dir];
		var colour;
		if (this.neighborExists(dx, dy, p_dir)) {	
			colour = this.getColourPearl(dx, dy);
			if (colour == SHINGOKI_PEARL.WHITE) {
				p_eventList.push(new LinkEvent(dx, dy, p_dir, p_linkStateForWhite));
			} else if (colour == SHINGOKI_PEARL.BLACK) {
				p_eventList.push(new LinkEvent(dx, dy, p_dir, p_linkStateForBlack));
			}
		}
		if (this.neighborExists(p_x, p_y, ddir)) {
			colour = this.getColourPearl(p_x, p_y);		
			if (colour == SHINGOKI_PEARL.WHITE) {
				p_eventList.push(new LinkEvent(p_x, p_y, ddir, p_linkStateForWhite));
			} else if (colour == SHINGOKI_PEARL.BLACK) {
				p_eventList.push(new LinkEvent(p_x, p_y, ddir, p_linkStateForBlack));
			}
		}
	} 
	return p_eventList;
}

function otherDeductionsClosure(p_solver) {
	return function(p_eventList, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const dir = p_eventBeingApplied.direction;
		const min = p_solver.getMin(x, y, dir);
		if (p_eventBeingApplied.kind == KIND_EVENT.RANGE_MIN) {			
			for (var i = p_eventBeingApplied.formerMin ; i < p_eventBeingApplied.min ; i++) {
				p_eventList.push(new LinkEvent(x + DeltaX[dir]*i , y + DeltaY[dir]*i, dir, LOOP_STATE.LINKED));
			}
			if (min == p_solver.getMax(x, y, dir) && p_solver.distantNeighborExists(x, y, min+1, dir)) {
				p_eventList.push(new LinkEvent(x + DeltaX[dir]*min, y + DeltaY[dir]*min, dir, LOOP_STATE.CLOSED));
			}
		} 
		if (p_eventBeingApplied.kind == KIND_EVENT.RANGE_MAX && p_eventBeingApplied.max == min && p_solver.distantNeighborExists(x, y, min+1, dir)) {			
			p_eventList.push(new LinkEvent(x + DeltaX[dir]*min, y + DeltaY[dir]*min, dir, LOOP_STATE.CLOSED));
		}		
		return p_eventList;
	}
}

// For each pearl which may have had an extended link, update the mins
function filterUpdateMinsClosure(p_solver) {
	return function() {
		var listEvents = [];
		var x, y, xx, yy, i, dir;
		p_solver.checkerMinsToUpdate.list.forEach(spaceDir => {
			direction = spaceDir.direction;
			x = spaceDir.x;
			y = spaceDir.y;
			i = p_solver.getMin(x, y, direction);
			xx = x + i*DeltaX[direction];
			yy = y + i*DeltaY[direction];
			while (p_solver.neighborExists(xx, yy, direction) && p_solver.getLink(xx, yy, direction) == LOOP_STATE.LINKED) {
				xx += DeltaX[direction];
				yy += DeltaY[direction];
				i++;
			}
			listEvents.push(new MinRangeEvent(spaceDir.x, spaceDir.y, direction, i));
		});
		p_solver.cleanCheckMinsToUpdate();
		return listEvents;
	}
}