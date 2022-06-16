const PASS_GATE = "PG";

const SURAROMU_LINKING = {
	BINDING : 2,
	ONE_SPACE : 1,
	NOTHING : 0,
}

function SolverSuraromu(p_valueGrid) {
	LoopSolver.call(this);
	this.construct(p_valueGrid);
}

SolverSuraromu.prototype = Object.create(LoopSolver.prototype);
SolverSuraromu.prototype.constructor = SolverSuraromu;

function DummySolver() {
	return new SolverSuraromu(generateSymbolArray(1, 1));
}

SolverSuraromu.prototype.construct = function(p_valueArray) {
    this.xLength = p_valueArray[0].length; 
	this.yLength = p_valueArray.length;
	this.loopSolverConstruct( 
	{	setSpaceLinkedPSAtomicDos : setSpaceLinkedPSAtomicDosClosure(this),
		setEdgeLinkedPSAtomicDos : setEdgeLinkedPSAtomicDosClosure(this),
		setSpaceClosedPSAtomicDos : setSpaceClosedPSAtomicDosClosure(this),
		setSpaceLinkedPSAtomicUndos : setSpaceLinkedPSAtomicUndosClosure(this),
		setEdgeLinkedPSAtomicUndos : setEdgeLinkedPSAtomicUndosClosure(this),
		setSpaceClosedPSAtomicUndos : setSpaceClosedPSAtomicUndosClosure(this),
		setSpaceLinkedPSDeductions : setSpaceLinkedPSDeductionsClosure(this),
		setSpaceClosedPSDeductions : setSpaceClosedPSDeductionsClosure(this),
		otherPSAtomicDos : otherAtomicDosClosure(this),
		otherPSAtomicUndos : otherAtomicUndosClosure(this),
		otherPSDeductions : otherDeductionsClosure(this),
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		PSFilters : [filterTODOClosure(this)],
		PSAbortMethods : [abortTODOClosure(this)],
		
		generateEventsForPassPS : generateEventsForGatesClosure(this),
		comparisonPS : comparisonSuraromuMethod,
		orderedListPassArgumentsPS : orderedListPassArgumentsClosureSuraromu(this),
		namingCategoryPS : namingCategoryPassClosure(this),
		multipassPessimismPS : true,
		amazeingPS : true
	});
	this.dataArray = p_valueArray;
	
	// Extend gates to horizontal and vertical walls (High convention : Correct puzzle data assumption (and somehow data assumption) : only the left/topmost part of the gate is given. They must not cross each other !)
	this.gatesList = [];
	this.gatesIdArray = generateValueArray(this.xLength, this.yLength, null); // Used at start and for drawing.
	this.closestGateArray = []; // Used in-game. When a link end is closer to a space, it is deduced by atomic dos.
	this.startPointX = 0; 
	this.startPointY = 0; // Initialized at 0 for dummy solver !
	this.takenNumbers = []; // takenNumbers is built entierely after all gates data are built, including starting point.
	this.numberPossibleGateIDs = []; 
	
	// Initializing;
	// Important : ID order of the gates is first the horizontal ones, then the vertical ones. 
	var xx, yy, number;
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (this.dataArray[y][x] != null && this.dataArray[y][x].charAt(0) == SYMBOL_ID.HORIZONTAL_DOTS) {
				this.gatesIdArray[y][x] = this.gatesList.length;
				number = this.getNumberBeforeTooLate(x, y);
				this.dataArray[y][x] = SYMBOL_ID.HORIZONTAL_DOTS;
				xx = x+1;
				while(xx < this.xLength && this.dataArray[y][xx] != SYMBOL_ID.X) {
					this.dataArray[y][xx] = SYMBOL_ID.HORIZONTAL_DOTS;
					this.gatesIdArray[y][xx] = (this.gatesList.length);
					xx++;
				} 
				this.gatesList.push({xMin : x, xMax : xx-1, y : y, closedLeft : xx-x-1, bounds : [], number : number, fixedNumber : number != null, twoPossibilities : null});
				x = xx; // Wheee, reaffecting x.
			} 
			if (this.dataArray[y][x] == SYMBOL_ID.START_POINT) {
				this.startPointX = x;
				this.startPointY = y;
			}
			if (this.dataArray[y][x] == SYMBOL_ID.X) {
				this.banSpace(x, y);
			}
		}
	}
	for (var x = 0 ; x < this.xLength ; x++) {
		for (var y = 0 ; y < this.yLength ; y++) {
			if (this.dataArray[y][x] != null && this.dataArray[y][x].charAt(0) == SYMBOL_ID.VERTICAL_DOTS) {
				number = this.getNumberBeforeTooLate(x, y);
				this.dataArray[y][x] = SYMBOL_ID.VERTICAL_DOTS;
				this.gatesIdArray[y][x] = this.gatesList.length;
				yy = y+1;
				while(yy < this.yLength && this.dataArray[yy][x] != SYMBOL_ID.X) {
					this.dataArray[yy][x] = SYMBOL_ID.VERTICAL_DOTS;
					this.gatesIdArray[yy][x] = this.gatesList.length;
					yy++;
				}
				this.gatesList.push({yMin : y, yMax : yy-1, x : x, closedLeft : yy-y-1, bounds : [], number : number, fixedNumber : number != null, twoPossibilities : null});
				y = yy;
			}
		}
	}
	
	// The starting point counts as a gate as well. Let's put its id (not number) to the max so that it can easily be exploited.
	this.gatesIdArray[this.startPointY][this.startPointX] = this.gatesList.length;
	this.gatesList.push({bounds : [], number : 0, fixedNumber : true});

	// Bogus because "this" is the windo
	//this.closestGateArray = generateFunctionValueArray(this.xLength, this.yLength, function(p_x, p_y) {return this.gatesIdArray[p_y][p_x]});
	for (var y = 0 ; y < this.yLength ; y++) {
		this.closestGateArray.push([]);
		for (var x = 0 ; x < this.xLength ; x++) {
			this.closestGateArray[y].push(this.gatesIdArray[y][x]);
		}
	}
	
	for (var i = 0 ; i < this.gatesList.length ; i++) {
		this.takenNumbers.push(false);
		this.numberPossibleGateIDs.push([]);
	}
	for (var i = 0 ; i < this.gatesList.length ; i++) {
		if (this.gatesList[i].number != null) {			
			this.takenNumbers[this.gatesList[i].number] = true;
		}
	}
	
	this.listMarkersOnLinkingEvents = []; // Note : list of what happened whenever a linked space event is applied. The last entry can be used immediately after in deductions, and the events can be undone in reverse order when undoing. 
	
	this.gatesNumber = this.gatesList.length;
	this.gatesIDChecker = new CheckCollection(this.gatesNumber);
	
	this.setResolution.searchSolutionMethod = loopNaiveSearchClosure(this);
}

SolverSuraromu.prototype.getNumberBeforeTooLate = function(p_x, p_y) { // Must be called BEFORE this.dataArray is updated, hence the "before too late".
	const entry = this.dataArray[p_y][p_x];
	return (entry != null && entry.length > 1) ? parseInt(entry.substring(1), 10) : null;
}

// -------------------
// Getters (for drawing but not only ; offensive !)

SolverSuraromu.prototype.hasGateH = function(p_x, p_y) {
	return this.dataArray[p_y][p_x] == SYMBOL_ID.HORIZONTAL_DOTS;
}

SolverSuraromu.prototype.hasGateV = function(p_x, p_y) {
	return this.dataArray[p_y][p_x] == SYMBOL_ID.VERTICAL_DOTS;	
}

SolverSuraromu.prototype.hasFixedNumber = function(p_x, p_y) {
	const gate = this.getGate(p_x, p_y);
	return gate != null && gate.fixedNumber;
}

SolverSuraromu.prototype.getNumberGate = function(p_x, p_y) {
	const gate = this.getGate(p_x, p_y);
	if (gate != null) {		
		return gate.number;
	}
	return null;
}

SolverSuraromu.prototype.isStartPoint = function(p_x, p_y) {
	return this.startPointX == p_x && this.startPointY == p_y;
}

SolverSuraromu.prototype.getGate = function(p_x, p_y) {
	if (this.gatesIdArray[p_y][p_x] == null) {
		return null;
	}
	return this.gatesList[this.gatesIdArray[p_y][p_x]];
}

// offensive : must be not null
isHorizontalGate = function(p_gate) {
	return p_gate.xMax || p_gate.xMax == 0;
}

isVerticalGate = function(p_gate) {
	return p_gate.yMax || p_gate.yMax == 0;
}

// Note about modulus : (-5) % 3 = -2...
SolverSuraromu.prototype.modulus = function(p_id) {
	return (p_id + this.gatesNumber) % this.gatesNumber;	
} 

// -------------------
// Input methods

SolverSuraromu.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverSuraromu.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverSuraromu.prototype.emitHypothesisSpace = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverSuraromu.prototype.passSpace = function(p_x, p_y) {
	var indexPass;
	const indexGate = this.gatesIdArray[p_y][p_x];
	if (indexGate != null) {
		indexPass = {category : PASS_GATE, index : indexGate}
	} else if (!this.isBanned(p_x, p_y)) {		
		indexPass = {category : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y};
	} 
	if (indexPass) {
		this.passLoop(indexPass); 
	}
}

SolverSuraromu.prototype.makeMultipass = function() {
	this.multipassLoop();
}

SolverSuraromu.prototype.makeResolution = function (p_solver) {
	this.resolve();
}

// -------------------
// Atomic closures 

function setSpaceLinkedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		var gate = p_solver.getGate(p_space.x, p_space.y);
		if (gate != null) {			
			// gate.LinkedLeft--;		
		}
	}
}

function setSpaceClosedPSAtomicDosClosure(p_solver) {
	return function(p_space) {
		var gate = p_solver.getGate(p_space.x, p_space.y);
		if (gate != null) {			
			gate.closedLeft--;		
		}
	}
}

function setSpaceLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		var gate = p_solver.getGate(p_space.x, p_space.y);
		if (gate != null) {			
			// gate.LinkedLeft++;		
		}
	}
}

function setSpaceClosedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		var gate = p_solver.getGate(p_space.x, p_space.y);
		if (gate != null) {			
			gate.closedLeft++;		
		}
	}
}

/*
Linked binding : 
Create gate ID binding as well, and retain the list of events in push, so they will be undone whenever a linked binding will be undone. 
After all, a "closeset ID gate" is always bound to its gate. 
*/
function setEdgeLinkedPSAtomicDosClosure(p_solver) {
	return function(p_args) {
		const x = p_args.x;
		const y = p_args.y;
		const dx = x + DeltaX[p_args.direction];
		const dy = y + DeltaY[p_args.direction];
		const id1 = p_solver.closestGateArray[y][x];
		const id2 = p_solver.closestGateArray[dy][dx];
		if (id1 != null) {
			if (id2 != null) {
				p_solver.listMarkersOnLinkingEvents.push({kind : SURAROMU_LINKING.BINDING, id1 : id1, id2 : id2});
			} else {
				const oSpace = (p_solver.getLinkedEdges(dx, dy) == 2) ? p_solver.getOppositeEnd(dx, dy) : {x : dx, y : dy}; // High convention : how opposite end works.
				p_solver.closestGateArray[oSpace.y][oSpace.x] = id1;
				p_solver.listMarkersOnLinkingEvents.push({kind : SURAROMU_LINKING.ONE_SPACE, id : id1, x : oSpace.x, y : oSpace.y});				
			}
		} else {
			if (id2 != null) {
				const oSpace = (p_solver.getLinkedEdges(x, y) == 2) ? p_solver.getOppositeEnd(x, y) : {x : x, y : y};
				p_solver.closestGateArray[oSpace.y][oSpace.x] = id2;
				p_solver.listMarkersOnLinkingEvents.push({kind : SURAROMU_LINKING.ONE_SPACE, id : id2, x : oSpace.x, y : oSpace.y});
			} else {
				p_solver.listMarkersOnLinkingEvents.push({kind : SURAROMU_LINKING.NOTHING});
			}
		}
	}
}

function setEdgeLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_space) {
		const linkingEvent = p_solver.listMarkersOnLinkingEvents.pop();
		if (linkingEvent.kind == SURAROMU_LINKING.ONE_SPACE) {
			p_solver.closestGateArray[linkingEvent.y][linkingEvent.x] = null;
		}
	}
}

function otherAtomicDosClosure(p_solver) {
	return function(p_eventToApply) {
		switch (p_eventToApply.kind) {
			case GATE_BIND_EVENT : 
				var bounds1 = p_solver.gatesList[p_eventToApply.id1].bounds;
				var bounds2 = p_solver.gatesList[p_eventToApply.id2].bounds; 
				bounds1.push(p_eventToApply.id2);
				bounds2.push(p_eventToApply.id1); 
				return EVENT_RESULT.SUCCESS;
			break;
			case GATE_NUMBER_EVENT : 
				const gatesList = p_solver.gatesList[p_eventToApply.id];
				if (gatesList.number != null) { 
					if (gatesList.number != p_eventToApply.number) {
						return EVENT_RESULT.FAILURE;
					} else {
						return EVENT_RESULT.HARMLESS;
					}
				} else if (p_solver.takenNumbers[p_eventToApply.number]) {
					return EVENT_RESULT.FAILURE;
				} else {
					gatesList.number = p_eventToApply.number;
					p_solver.takenNumbers[p_eventToApply.number] = true;
					return EVENT_RESULT.SUCCESS;
				}
			break;
			case TAKE_TWO_EVENT : 
				if (p_solver.gatesList[p_eventToApply.id].twoPossibilities == null) {					
					p_solver.gatesList[p_eventToApply.id].twoPossibilities = {center : p_eventToApply.center, delta : p_eventToApply.delta};
					if (p_eventToApply.center != 0) {	 // Remember : No loop of ids (48, 49, 0, 1, 2) in takeTwos around ID 0 since it's the start point					
						p_solver.numberPossibleGateIDs[p_eventToApply.center + p_eventToApply.delta].push(p_eventToApply.id);
						p_solver.numberPossibleGateIDs[p_eventToApply.center - p_eventToApply.delta].push(p_eventToApply.id);
					} else {
						p_solver.numberPossibleGateIDs[p_eventToApply.delta].push(p_eventToApply.id);
						p_solver.numberPossibleGateIDs[p_solver.gatesNumber-p_eventToApply.delta].push(p_eventToApply.id);
					}
					return EVENT_RESULT.SUCCESS;
				} else {
					return EVENT_RESULT.HARMLESS;
				}
			break;
		}
	}
}

function otherAtomicUndosClosure(p_solver) {
	return function(p_eventToUndo) {
		switch (p_eventToUndo.kind) {
			case GATE_BIND_EVENT : 
				p_solver.gatesList[p_eventToUndo.id1].bounds.pop();
				p_solver.gatesList[p_eventToUndo.id2].bounds.pop();
				
			break;
			case GATE_NUMBER_EVENT : 
				p_solver.takenNumbers[p_eventToUndo.number] = false;
				p_solver.gatesList[p_eventToUndo.id].number = null;
			break;
			case TAKE_TWO_EVENT : 
				if (p_eventToUndo.center != 0) {					
					p_solver.numberPossibleGateIDs[p_eventToUndo.center + p_eventToUndo.delta].pop();
					p_solver.numberPossibleGateIDs[p_eventToUndo.center - p_eventToUndo.delta].pop();
				} else {
					p_solver.numberPossibleGateIDs[p_eventToUndo.delta].pop();
					p_solver.numberPossibleGateIDs[p_solver.gatesNumber-p_eventToUndo.delta].pop();
				}
				p_solver.gatesList[p_eventToUndo.id].twoPossibilities = null;
			break;
		}
	}
}

// -------------------
// Closure deduction

// Space closed 
function setSpaceClosedPSDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const gate = p_solver.getGate(x, y);
		// One linked space per gate
		if (gate != null) {			
			if (isVerticalGate(gate) && gate.closedLeft == 0) {
				for (var yy = gate.yMin ; yy <= gate.yMax ; yy++) {
					if (p_solver.getLinkSpace(x, yy) == LOOP_STATE.UNDECIDED) {
						p_listEventsToApply.push(new SpaceEvent(x, yy, LOOP_STATE.LINKED));
						break;
					}
				}
			} 
			if (isHorizontalGate(gate) && gate.closedLeft == 0) {
				for (var xx = gate.xMin ; xx <= gate.xMax ; xx++) {
					if (p_solver.getLinkSpace(xx, y) == LOOP_STATE.UNDECIDED) {
						p_listEventsToApply.push(new SpaceEvent(xx, y, LOOP_STATE.LINKED));
						break;
					}
				}
			}
		}
	}
}

// Space linked
function setSpaceLinkedPSDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.x;
		const y = p_eventBeingApplied.y;
		const gate = p_solver.getGate(x, y);
		// One linked space per gate
		if (gate != null) {	
			if (isVerticalGate(gate)) {
				for (var yy = gate.yMin ; yy <= gate.yMax ; yy++) {
					if (yy != y) {
						p_listEventsToApply.push(new SpaceEvent(x, yy, LOOP_STATE.CLOSED));
					}
				}
			} 
			if (isHorizontalGate(gate)) {
				for (var xx = gate.xMin ; xx <= gate.xMax ; xx++) {
					if (xx != x) {
						p_listEventsToApply.push(new SpaceEvent(xx, y, LOOP_STATE.CLOSED));
					}
				}
			}
		}
	}
}


// Edge linked
function setEdgeLinkedDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		const x = p_eventBeingApplied.linkX;
		const y = p_eventBeingApplied.linkY;
		const dir = p_eventBeingApplied.direction;
		const dx = p_eventBeingApplied.linkX + DeltaX[dir];
		const dy = p_eventBeingApplied.linkY + DeltaY[dir];
		const id1 = p_solver.closestGateArray[y][x];
		const id2 = p_solver.closestGateArray[dy][dx];
		const lastLinkingEvent = p_solver.listMarkersOnLinkingEvents[p_solver.listMarkersOnLinkingEvents.length-1];
		switch(lastLinkingEvent.kind) {
			case SURAROMU_LINKING.BINDING :
				p_listEventsToApply.push(new GateBindEvent(lastLinkingEvent.id1, lastLinkingEvent.id2));
			break;
			case SURAROMU_LINKING.ONE_SPACE :
				p_solver.deductionsLookAroundGateNumbers(p_listEventsToApply, lastLinkingEvent.x, lastLinkingEvent.y);
			break;
		}
	}
}

// Looks around a space (p_x, p_y) that got a "closest door id" if it has spaces around with incompatible numbers.
SolverSuraromu.prototype.deductionsLookAroundGateNumbers = function(p_listEventsToApply, p_x, p_y) {
	/*const id = this.closestGateArray[p_y][p_x];
	const num = this.gatesList[id].number;
	if (num != null) {		
		this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
			id2 = this.closestGateArray[coorsDir.y][coorsDir.x];
			if (id2 != null) {
				num2 = this.gatesList[id2].number;*/
				/*if ( (num2 != null) && (Math.abs(num2 - num) > 1) && 
						!((num2 == 0 || num2 == this.gatesNumber-1) && (num == 0 || num == this.gatesNumber-1))  
				) {					
					p_listEventsToApply.push(new LinkEvent(p_x, p_y, coorsDir.direction, LOOP_STATE.CLOSED));
				} */ // Actually you need to see compatibilities between numbers by looking at real/potential numbers but it will be easier with filters
					
				// OK what's next is in French
				// Filtre : pour une "case d'extrêmité avec id gate" : vérifier si c'est toujours une extremité et si elle est adjacente à une extrêmité d'id strictement inférieur (les 2 id doivent être connus donc). Si oui, vérifier leurs compatibilités de numéros :
				// Pour chaque id, un numéro ou un takeTwo qui conduit à 2 numéros possibles. 
				// Si incompatibilité des takeTwos et des numéros : on bloque !
				
				// A moins que ce soit redondant avec la passe... 
				// Car ça ne ppermet de résoudre que les voisins immédiats, pas les pseudo-voisins reliés par tunnels. Ou bbien il faudrait mettre de tels voisins en place mais c'est chiant, autant laisser la passe faire le taf !
				// et le puzzle 137 alors ?
/*			}
		});
	}*/
}

function otherDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == GATE_NUMBER_EVENT) {
			// Try to propagade the bind
			const evtNumber = p_eventBeingApplied.number;
			const evtId = p_eventBeingApplied.id;
			ids = p_solver.gatesList[evtId].bounds;
			if (ids.length > 0) {				
				p_solver.deductionsBinding(p_listEventsToApply, evtId, ids[0]);
				if (ids.length > 1) {					
					p_solver.deductionsBinding(p_listEventsToApply, evtId, ids[1]);
				}
			}
			// let N the current number ; i a possible gate for N ;  gate i had possibilites N (= (N+p)-p) and (N+p)+p ; but N is already taken, so affect N+2p to i. At least, no loopings around 0 should be involved. Well, actually 0 may be the center...
			var twoPos, numberDeduced;
			p_solver.numberPossibleGateIDs[evtNumber].forEach(id => {
				if (id != evtId) {					
					twoPos = p_solver.gatesList[id].twoPossibilities;
					numberDeduced = ( (twoPos.center + twoPos.delta) == evtNumber) ? p_solver.modulus(twoPos.center - twoPos.delta) : (twoPos.center + twoPos.delta);
					p_listEventsToApply.push(new GateNumberEvent(id, numberDeduced));
				}
			});
		} else if (p_eventBeingApplied.kind == GATE_BIND_EVENT) {
			// If one of the gate is numbered and the other isn't : 
				// Propagate a "CanBe" event to both numbers (gate (id 10, nb 7) is linked with (gate (id 11, nb ??)) )
				// id 11 can be number 6 or number 8.
				// 
			
			// If both gates are numbered : propagate in both directions
			const evtId1 = p_eventBeingApplied.id1;
			const evtId2 = p_eventBeingApplied.id2;
			const gate1 = p_solver.gatesList[evtId1];
			const gate2 = p_solver.gatesList[evtId2];
			const number1 = gate1.number;
			const number2 = gate2.number;
			if (number1 != null && number2 != null) {
				const gapNumbers = Math.abs(number1 - number2);
				if (gapNumbers != 1 && gapNumbers != p_solver.gatesNumber-1) {					
					p_listEventsToApply.push(new FailureEvent());
					return;
				}
			} 
			if (number1 == null && number2 != null) {
				p_solver.deductionsBinding(p_listEventsToApply, evtId2, evtId1);
			} else if (number1 != null && number2 == null) {
				p_solver.deductionsBinding(p_listEventsToApply, evtId1, evtId2);
			} else {
				// Neither gate is numbered : check their takeTwos.
				// Both have a takeTwo : see their compatibility.
				// Otherwise, recursively check the binds.
				if (gate1.twoPossibilities != null && gate2.twoPossibilities != null) {
					// Zero may be the center ! 
					const bindWithCenterGate1Above = gate1.twoPossibilities.center - gate1.twoPossibilities.delta - (gate2.twoPossibilities.center + gate2.twoPossibilities.delta);
					if (bindWithCenterGate1Above == 1 || bindWithCenterGate1Above == (1-p_solver.gatesNumber)) {
							p_listEventsToApply.push(new GateNumberEvent(evtId1, p_solver.modulus(gate1.twoPossibilities.center - gate1.twoPossibilities.delta) ));
							p_listEventsToApply.push(new GateNumberEvent(evtId2, p_solver.modulus(gate2.twoPossibilities.center + gate2.twoPossibilities.delta) ));
					} else {
						const bindWithCenterGate2Above = gate2.twoPossibilities.center - gate2.twoPossibilities.delta - (gate1.twoPossibilities.center + gate1.twoPossibilities.delta);
						if (bindWithCenterGate2Above == 1 || bindWithCenterGate2Above == (1-p_solver.gatesNumber)) {
								p_listEventsToApply.push(new GateNumberEvent(evtId1, p_solver.modulus(gate1.twoPossibilities.center + gate1.twoPossibilities.delta) ));
								p_listEventsToApply.push(new GateNumberEvent(evtId2, p_solver.modulus(gate2.twoPossibilities.center - gate2.twoPossibilities.delta) )); // Note : not optimal.
						} else {
								p_listEventsToApply.push(new FailureEvent());
								return;
						}
						
					}
				} else {
					p_solver.deductionsBindingAdvanced(p_listEventsToApply, evtId1, evtId2);
				}
			}
			
		} else if (p_eventBeingApplied.kind == TAKE_TWO_EVENT) {
			
		}
	}
}

// Deductions bindings :
// p_idFrom and p_idTowards are ids of two bound gates. 
// Number of gate in p_idFrom is also known and number of gate in p_idTowards is not.
// First, we will run all gates starting with p_idTowards in the way defined by "from" to "towards" until we meet one that is numbered 
SolverSuraromu.prototype.deductionsBinding = function(p_listEventsToApply, p_idFrom, p_idTowards) {
	var idsMet = [p_idTowards];
	var gate;
	var currentID = p_idTowards; 
	var previousID = p_idFrom;
	var numberStart = this.gatesList[p_idFrom].number;
	var stop = false;
	do { 
		gate = this.gatesList[currentID];
		if (gate.bounds.length == 1 || gate.number != null || this.takenNumbers[this.modulus(numberStart + idsMet.length)] || this.takenNumbers[this.modulus(numberStart - idsMet.length)] || p_idFrom == currentID)  { 
			stop = true;
		} else if (gate.bounds[0] != previousID) {
			previousID = currentID;
			currentID = gate.bounds[0];
		} else {
			previousID = currentID;
			currentID = gate.bounds[1];
		}
		if (!stop) {
			idsMet.push(currentID);
		}
	} while (!stop);
	
	if (p_idFrom == currentID) { // It seems possible to loop... well, actually, deductions of applied bindings are done before deductions of closed spaces (by gate or standard). If this happens, just let it go, a mistake will be raised anyway. 
		return;
	}

	// Note : very specific case : it is possible that exactly half the total number of doors are crossed. But this actually doesn't matter !
	// In order for this to happen, let 2N the total number of gates, there must be (N-1) gates in a row unknow, a known gate, another (N-1) gates in a row, and the "p_idFrom". This is only possible if p_idFrom is 0, and if the known gate is number N. This may happen in a puzzle, but if this happen we can arbitrarly number the unknown gates from 1 to N-1 or from N+1 to 2N-1.
	
	var lastNumber = gate.number;
	var poss1 = this.modulus(numberStart + idsMet.length);
	var poss2 = this.modulus(numberStart - idsMet.length);
	if (gate.number != null) {
		lastNumber = gate.number;
	} else if (this.takenNumbers[poss2]) {
		lastNumber = poss1;
	} else if (this.takenNumbers[poss1]) {
		lastNumber = poss2;
	}
	
	if (lastNumber != null) {
		if (this.modulus(lastNumber - numberStart) == idsMet.length) {
			for (var i = 0 ; i < idsMet.length ; i++) {
				p_listEventsToApply.push(new GateNumberEvent(idsMet[i], this.modulus(numberStart + i + 1) ));	// Associating numbers in ascending order			
			}
		} else if (this.modulus(numberStart - lastNumber) == idsMet.length) { 
			for (var i = 0 ; i < idsMet.length ; i++) {
				p_listEventsToApply.push(new GateNumberEvent(idsMet[i], this.modulus(numberStart - i - 1) ));	// Or in descending number
			}
		} else { // The corresponding number does not fit !
			p_listEventsToApply.push(new FailureEvent());
		}
	} else {
		for (var i = 0 ; i < idsMet.length ; i++) {
			p_listEventsToApply.push(new TakeTwoEvent(idsMet[i], numberStart, i+1));
		} // No need for modulus since 0 must already have been found

	}		
}

// Not both gates have a takeTwo, yet they are bound. Maybe one is bound to a gate which is bound to one with a number (and maybe the takeTwos aren't applied yet - so this is not optimized ...)
// Rewind until a gate is found with a number. 
// If unsuccessful, try the other way around. 
SolverSuraromu.prototype.deductionsBindingAdvanced = function(p_listEventsToApply, p_id1, p_id2) {
	this.numberedGateWasFound = false;
	this.deductionsBindingAdvancedSearching(p_listEventsToApply, p_id1, p_id2);
	if (!this.numberedGateWasFound) {		
		this.deductionsBindingAdvancedSearching(p_listEventsToApply, p_id2, p_id1);
	}
}

SolverSuraromu.prototype.deductionsBindingAdvancedSearching = function(p_listEventsToApply, p_idFrom, p_idTowards) {
	var previousId = p_idFrom;
	var currentId = p_idTowards;
	var gate = this.gatesList[currentId];
	var newId;
	this.gatesIDChecker.clean();
	while (gate.number == null && gate.bounds.length == 2 && !this.gatesIDChecker.array[currentId]) { 
		this.gatesIDChecker.add(currentId);
		newId = (gate.bounds[1] == previousId ? gate.bounds[0] : gate.bounds[1]);
		previousId = currentId;
		currentId = newId;
		gate = this.gatesList[currentId];
	}
	if (this.gatesIDChecker.array[currentId]){
		p_listEventsToApply.push(new FailureEvent());
		return;
	}
	if (gate.number != null) {
		this.numberedGateWasFound = true;
		this.deductionsBinding(p_listEventsToApply, currentId, previousId); // Remember, 1st argument in this.deductionsBinding is "come from" with a not null number, 2nd is "go towards" with a null number.
	}
}

// -------------------
// Filters

function filterTODOClosure(p_solver) {
	return function() {
		var listEventsToApply = [];
		return listEventsToApply;
	}
}

SolverSuraromu.prototype.cleanCheckStrips = function() {
	
}

abortTODOClosure = function(p_solver) {
	return function() {
		p_solver.cleanCheckStrips();
	}
} // Some wrapping here...


// -------------------
// Quickstart

// Note : spaces by doors already have numbers by now. 
quickStartEventsClosure = function(p_solver) {
	return function(p_listQSEvents) { 
		p_listQSEvents.push({quickStartLabel : "Suararomu"});
		
		// 1-long gates
		p_solver.gatesList.forEach(gate => {
			if (isHorizontalGate(gate)) {
				if (gate.xMin == gate.xMax) {					
					p_listQSEvents.push(new SpaceEvent(gate.xMin, gate.y, LOOP_STATE.LINKED));
				} else {
					for (var x = gate.xMin ; x < gate.xMax ; x++) {
						p_listQSEvents.push(new LinkEvent(x, gate.y, DIRECTION.RIGHT, LOOP_STATE.CLOSED));
					}
				}
			}
			if (isVerticalGate(gate) && gate.yMin == gate.yMax) {
				p_listQSEvents.push(new SpaceEvent(gate.x, gate.yMin, LOOP_STATE.LINKED));				
			} else {
				for (var y = gate.yMin ; y < gate.yMax ; y++) {
					p_listQSEvents.push(new LinkEvent(gate.x, y, DIRECTION.DOWN, LOOP_STATE.CLOSED));
				}
			}
		})
		// Start point
		p_listQSEvents.push(new SpaceEvent(p_solver.startPointX, p_solver.startPointY, LOOP_STATE.LINKED));
	}
}

// -------------------
// Passing & multipassing (copied onto Yajikabe)
		
generateEventsForGatesClosure = function (p_solver) {
	return function (p_indexPass) {
		var listPass = [];
		const gate = p_solver.gatesList[p_indexPass.index];
		var x, y;
		const twoPos = gate.twoPossibilities;
		if (twoPos) {
			listPass.push([new GateNumberEvent(p_indexPass.index, twoPos.center + twoPos.delta), new GateNumberEvent(p_indexPass.index, p_solver.modulus(twoPos.center - twoPos.delta))]);
		}
		if (isVerticalGate(gate)) {
			x = gate.x;
			for (y = gate.yMin ; y <= gate.yMax ; y++) {
				listPass.push([new SpaceEvent(x, y, LOOP_STATE.LINKED), new SpaceEvent(x, y, LOOP_STATE.CLOSED)]);
			}
		} else {
			y = gate.y;
			for (x = gate.xMin ; x <= gate.xMax ; x++) {
				listPass.push([new SpaceEvent(x, y, LOOP_STATE.LINKED), new SpaceEvent(x, y, LOOP_STATE.CLOSED)]);
			}			
		}
		return listPass;
	}
}

orderedListPassArgumentsClosureSuraromu = function(p_solver) {
	return function() {
		var listIndexesPass = [];
		for (var i = 1 ; i < p_solver.gatesNumber ; i++) { // Gate 0 is excluded.
			listIndexesPass.push({category : PASS_GATE, index : i});
		}
		return listIndexesPass;
	}
}

comparisonSuraromuMethod = function(p_event1, p_event2) {
	return commonComparison([p_event1.id, p_event1.number], [p_event2.id, p_event2.number]);
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_indexPass) {
		if (p_indexPass.category == PASS_GATE) {	
			return "Gate " + logGate(p_solver.gatesList[p_indexPass.index]);
		}
	}
}