// When a region contains 4 open spaces
SolverLITS.prototype.eventsTetrominoIdentification = function(p_eventsList, p_indexRegion) {
	//var eventsList = []; //TODO erase these comments later, but somehow keep displayed the deltax and deltay.
	const firstSpace = getFirstLexicalOrderSpace(this.regions[p_indexRegion].openSpaces);
	const x1 = firstSpace.x;
	const y1 = firstSpace.y;
	var shape = LITS.UNDECIDED;
	if (this.isOpenInRegionAtRight(x1+1, y1, p_indexRegion)) { //10
		if (this.isOpenInRegionAtRight(x1+2, y1, p_indexRegion)) { //10 20
			if (this.isOpenInRegionAtRight(x1+3, y1, p_indexRegion)) {
				shape = LITS.I; //eventsList = shape4(x1, y1, 1, 0, 2, 0, 3, 0, LITS.I);
			} else if (y1 <= this.yLength-2) {
				if (this.isOpenInRegion(x1+2, y1+1, p_indexRegion)) {
					shape = LITS.L; //eventsList = shape4(x1, y1, 1, 0, 2, 0, 2, 1, LITS.L);
				} else if (this.isOpenInRegion(x1+1, y1+1, p_indexRegion)) {
					shape = LITS.T; //eventsList = shape4(x1, y1, 1, 0, 2, 0, 1, 1, LITS.T);
				} else if (this.isOpenInRegion(x1, y1+1, p_indexRegion)) {
					shape = LITS.L; //eventsList = shape4(x1, y1, 1, 0, 2, 0, 0, 1, LITS.L);
				} 
			}
		} else if (this.isOpenInRegionAtDown(x1+1, y1+1, p_indexRegion)) { //10 11
			if (this.isOpenInRegionAtRight(x1+2, y1+1, p_indexRegion)) {
				shape = LITS.S; //eventsList = shape4(x1, y1, 1, 0, 1, 1, 2, 1, LITS.S);
			} else if (this.isOpenInRegionAtDown(x1+1, y1+2, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 1, 0, 1, 1, 1, 2, LITS.L);
			} 
		} else if (this.isOpenInRegionAtDown(x1, y1+1, p_indexRegion)) {// 10 01
			if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 1, 0, 0, 1, 0, 2, LITS.L);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.S; //eventsList = shape4(x1, y1, 1, 0, 0, 1, -1, 1, LITS.S);
			}
		}
	} else if (this.isOpenInRegionAtDown(x1, y1+1, p_indexRegion)) { // 01
		if (this.isOpenInRegionAtRight(x1+1, y1+1, p_indexRegion)) { // 01 11
			if (this.isOpenInRegionAtRight(x1+2, y1+1, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 0, 1, 1, 1, 2, 1, LITS.L);
			} else if (this.isOpenInRegionAtDown(x1+1, y1+2, p_indexRegion)) { //TODO factoriser avec ci-dessous
				shape = LITS.S; //eventsList = shape4(x1, y1, 0, 1, 1, 1, 1, 2, LITS.S);
			} else if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) {
				shape = LITS.T; //eventsList = shape4(x1, y1, 0, 1, 1, 1, 0, 2, LITS.T);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.T; //eventsList = shape4(x1, y1, 0, 1, 1, 1, -1, 1, LITS.T);
			}
		} else if (this.isOpenInRegionAtDown(x1, y1+2, p_indexRegion)) { // 01 02
			if (this.isOpenInRegionAtRight(x1+1, y1+2, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 0, 1, 0, 2, 1, 2, LITS.L);
			} else if (this.isOpenInRegionAtDown(x1, y1+3, p_indexRegion)) {
				shape = LITS.I; //eventsList = shape4(x1, y1, 0, 1, 0, 2, 0, 3, LITS.I);
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+2, p_indexRegion)) { // TODO factoriser avec ci-dessous
				shape = LITS.L; //eventsList = shape4(x1, y1, 0, 1, 0, 2, -1, 2, LITS.L);
			}  else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				shape = LITS.T; //eventsList = shape4(x1, y1, 0, 1, 0, 2, -1, 1, LITS.T);
			}
		} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) { // 01 -11 
			if (this.isOpenInRegionAtDown(x1-1, y1+2, p_indexRegion)) {
				shape = LITS.S; //eventsList = shape4(x1, y1, 0, 1, -1, 1, -1, 2, LITS.S);
			} else if (this.isOpenInRegionAtLeft(x1-2, y1+1, p_indexRegion)) {
				shape = LITS.L; //eventsList = shape4(x1, y1, 0, 1, -1, 1, -2, 1, LITS.L);
			}
		}
	}
	
	if (shape == LITS.UNDECIDED) {
		return EVENT_RESULT.FAILURE;
	} else {
		p_eventsList.push(new ShapeRegionEvent(p_indexRegion, shape));
		return p_eventsList;
	}
}

// When a region contains 3 open spaces
SolverLITS.prototype.eventsTripletPlacement = function(p_eventsList, p_indexRegion) {
	const firstSpace = getFirstLexicalOrderSpace(this.regions[p_indexRegion].openSpaces);
	const x1 = firstSpace.x;
	const y1 = firstSpace.y;
	const beforeLength = p_eventsList.length;
	var ok = false;
	if (this.isOpenInRegionAtRight(x1+1, y1, p_indexRegion)) { //10
		if (this.isOpenInRegionAtRight(x1+2, y1, p_indexRegion)) { 
			p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 1);
			ok = true;
		} else if (y1 <= this.yLength-2) {
			if (this.isOpenInRegion(x1+2, y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 11);
				ok = true;
			} else if (this.isOpenInRegion(x1+1, y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 4);
				ok = true;
			} else if (this.isOpenInRegion(x1, y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 3);
				ok = true;
			} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 14);
				ok = true;
			}
		} 
	} else if (y1 <= this.yLength-2) {
		if (this.isOpenInRegion(x1, y1+1, p_indexRegion)) {  // 01
			if (this.isOpenInRegionAtRight(x1+1,y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 6);
				ok = true;
			} else if (this.isOpenInRegionAtDownRight(x1+1,y1+2, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 12);
				ok = true;
			} else if (this.isOpenInRegionAtDown(x1,y1+2, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 2);
				ok = true;
			} else if  (this.isOpenInRegionAtDownLeft(x1-1,y1+2, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 13);
				ok = true;
			} else if (this.isOpenInRegionAtLeft(x1-1,y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 5);
				ok = true;
			}
		} else if (this.isOpenInRegionAtRight(x1+1, y1+1, p_indexRegion)) { // 11
			if (this.isOpenInRegionAtRight(x1+2,y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 7);
				ok = true;
			} else if (this.isOpenInRegionAtDown(x1+1,y1+2, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 8);
				ok = true;
			}
		} else if (this.isOpenInRegionAtLeft(x1-1, y1+1, p_indexRegion)) { // -11
			if (this.isOpenInRegionAtDown(x1-1,y1+2,p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 9);
				ok = true;
			} else if (this.isOpenInRegionAtLeft(x1-2,y1+1, p_indexRegion)) {
				p_eventsList = this.shapeFrom3Open(p_eventsList, x1, y1, p_indexRegion, 10);
				ok = true;
			}
		}
	}
	// No "new events" found ? 
	if (!ok) {
		return EVENT_RESULT.FAILURE;
	}		
	return p_eventsList;
}

const spaceDelta = {};
const spaceDelta_01 = {x:0, y:1};
const spaceDelta_02 = {x:0, y:2};
const spaceDelta_03 = {x:0, y:3};
const spaceDelta_10 = {x:1, y:0};
const spaceDelta_20 = {x:2, y:0};
const spaceDelta_30 = {x:3, y:0};
const spaceDelta_0M = {x:0, y:-1};
const spaceDelta_M0 = {x:-1, y:0};
const spaceDelta_11 = {x:1, y:1};
const spaceDelta_12 = {x:1, y:2};
const spaceDelta_21 = {x:2, y:1};
const spaceDelta_M1 = {x:-1, y:1};
const spaceDelta_1M = {x:1, y:-1};
const spaceDelta_M2 = {x:-1, y:2};
const spaceDelta_2M = {x:2, y:-1};
const spaceDelta_MM1 = {x:-2, y:1};


// For each of the configurations, give : list of L-placements, list of I-placements, list of T-placements, list of S-placements
const arrayOfEventsBy3SpaceConfig = [
[[],[],[],[]], // config 0, nonexistent (numerotation starts at 1)
[[spaceDelta_0M, spaceDelta_01, spaceDelta_2M, spaceDelta_21],  [spaceDelta_M0, spaceDelta_30], [spaceDelta_1M, spaceDelta_11],[]], // config 1 Ooo
[[spaceDelta_M0, spaceDelta_10, spaceDelta_M2, spaceDelta_12],  [spaceDelta_0M, spaceDelta_03], [spaceDelta_M1, spaceDelta_11],[]], //config 2 going down
[[spaceDelta_02, spaceDelta_20], [], [spaceDelta_M0, spaceDelta_0M], [spaceDelta_1M, spaceDelta_M1]], // Config 3 angle with legs DR
[[spaceDelta_M0, spaceDelta_12], [], [spaceDelta_1M, spaceDelta_20], [spaceDelta_0M, spaceDelta_21]], // Config 4 angle with legs DL
[[spaceDelta_0M, spaceDelta_MM1], [], [spaceDelta_11, spaceDelta_02], [spaceDelta_M2, spaceDelta_10]], // Config 5 : angle with legs LU
[[spaceDelta_0M, spaceDelta_21], [], [spaceDelta_M1, spaceDelta_02], [spaceDelta_12, spaceDelta_M0]], // Config 6 : angle with legs RU
[[spaceDelta_01], [], [], [spaceDelta_10]], // Config 7 : 1-then-2 right down
[[spaceDelta_10], [], [], [spaceDelta_01]], // Config 8 : 1-then-2 down right
[[spaceDelta_M0], [], [], [spaceDelta_01]], // Config 9 : 1-then-2 down left
[[spaceDelta_01], [], [], [spaceDelta_M0]], // Config 10 : 1-then-2 left down
[[spaceDelta_20], [], [], [spaceDelta_11]], // Config 11 : 2-then-1 right down
[[spaceDelta_02], [], [], [spaceDelta_11]], // Config 12 : 2-then-1 down right
[[spaceDelta_02], [], [], [spaceDelta_M1]], // Config 13 : 2-then-1 down left
[[spaceDelta_M0], [], [], [spaceDelta_01]] // Config 14 : 2-then-1 left down
];

const arrayOfSpaceDeltasBy3SpaceConfig = [ // List of space-deltas of spaces 2 and 3 from the first space of the config to obtain all the 3-space configs 
[],
[spaceDelta_10, spaceDelta_20],
[spaceDelta_01, spaceDelta_02],
[spaceDelta_10, spaceDelta_01],
[spaceDelta_10, spaceDelta_11],
[spaceDelta_M1, spaceDelta_01],
[spaceDelta_01, spaceDelta_11],
[spaceDelta_11, spaceDelta_21],
[spaceDelta_11, spaceDelta_12],
[spaceDelta_M1, spaceDelta_M2],
[spaceDelta_M1, spaceDelta_MM1],
[spaceDelta_10, spaceDelta_21],
[spaceDelta_01, spaceDelta_12],
[spaceDelta_01, spaceDelta_M2],
[spaceDelta_10, spaceDelta_M1]
];

/**
3 spaces are open - deduce events from it, e.g. placing shapes L,I,T,S for the 4th missing spaces. Also, if there is only one possible new space, make it open (the "4th deduction" will clear the work) and if there are at least 2 deductions with all the same shape, affect shapes to all 3 open spaces.
p_ix, p_iy : origin space (1st in lexical order), p_ir : region index,
p_identifiant : identifiant of the triplet of spaces. See text doc for list of shapes.
*/ 
SolverLITS.prototype.shapeFrom3Open = function(p_eventsList, p_x, p_y, p_ir, p_identifiant) {
	const eventsByConfig = arrayOfEventsBy3SpaceConfig[p_identifiant];
	
	const startingEventsLength = p_eventsList.length;
	var currentEventsLength = p_eventsList.length;
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[0], LITS.L);
	const noLFound = (p_eventsList.length == currentEventsLength);
	
	currentEventsLength = p_eventsList.length;
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[1], LITS.I);
	const noIFound = (p_eventsList.length == currentEventsLength);
	
	currentEventsLength = p_eventsList.length;
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[2], LITS.T);
	const noTFound = (p_eventsList.length == currentEventsLength);
	
	currentEventsLength = p_eventsList.length;
	p_eventsList = this.pushShapeEventsDelta(p_eventsList, p_x, p_y, p_ir, eventsByConfig[3], LITS.S);
	const noSFound = (p_eventsList.length == currentEventsLength);
	
	if (p_eventsList.length == startingEventsLength + 1) {
		// Only one event ! That means only one possibility of 4th open space ! 
		const onlyShapeEvent = p_eventsList[p_eventsList.length-1];
		p_eventsList.push(new SpaceEvent(onlyShapeEvent.x, onlyShapeEvent.y, ADJACENCY.YES));
	} else if (noLFound && noIFound && noTFound) { //If only one shape is possible, place it in all 3 open spaces. If no shape is possible, failure.
		if (noSFound) {
			return EVENT_RESULT.FAILURE;
		} else {
			p_eventsList = this.affectShapes(p_eventsList, p_x, p_y, p_identifiant, LITS.S);
		}
	} else if (noSFound) {
		if (noLFound) {
			if (noIFound) {
				p_eventsList = this.affectShapes(p_eventsList, p_x, p_y, p_identifiant, LITS.T);
			} else if (noTFound) {
				p_eventsList = this.affectShapes(p_eventsList, p_x, p_y, p_identifiant, LITS.I);
			}
		} else if (noIFound && noTFound) {
			p_eventsList = this.affectShapes(p_eventsList, p_x, p_y, p_identifiant, LITS.L);
		}
	}

	return p_eventsList;
}

// TODO peut-on avoir un cas de figure où 2 cases peuvent être ouvertes, dans la même région, et avec des formes différentes ? Peut-être ai-je déjà traité ce cas de figure dans les déductions mais j'ai la flemme de vérifier...
// Add shape-affectation events where it can be useful among the "potential spaces" (e.g. not on closed spaces for instance)
SolverLITS.prototype.pushShapeEventsDelta = function (p_eventsList, p_x, p_y, p_ir, p_spaceDeltas, p_shape) {
	p_spaceDeltas.forEach(delta => {
		const x = p_x + delta.x;
		const y = p_y + delta.y;
		if ((y >= 0) && (y < this.yLength) && (x >= 0) && (x < this.xLength) && (this.regionArray[y][x] == p_ir) && (this.answerArray[y][x] != ADJACENCY.NO)) {
			p_eventsList.push(new ShapeEvent(x, y, p_shape));
		}
	});
	return p_eventsList;
}

// Tests if the space coordinates are valid and contain a space open in region (even "atLeft, atRight..." test for (p_x, p_y) and not (p_x-1, p_y) nor (p_x+1, p_y) )
SolverLITS.prototype.isOpenInRegion = function(p_x, p_y, p_ir) {
	return (this.answerArray[p_y][p_x] == ADJACENCY.YES) && (this.regionArray[p_y][p_x] == p_ir);
}	

SolverLITS.prototype.isOpenInRegionAtLeft = function(p_x, p_y, p_ir) {
	return (p_x >= 0) && (this.isOpenInRegion(p_x, p_y, p_ir));
}
SolverLITS.prototype.isOpenInRegionAtRight = function(p_x, p_y, p_ir) {
	return (p_x <= this.xLength-1) && (this.isOpenInRegion(p_x, p_y, p_ir));
}
SolverLITS.prototype.isOpenInRegionAtDown = function(p_x, p_y, p_ir) {
	return (p_y <= this.yLength-1) && (this.isOpenInRegion(p_x, p_y, p_ir));
}

SolverLITS.prototype.isOpenInRegionAtDownRight = function(p_x, p_y, p_ir) {
	return (p_y <= this.yLength-1) && (this.isOpenInRegionAtRight(p_x, p_y, p_ir));
}

SolverLITS.prototype.isOpenInRegionAtDownLeft = function(p_x, p_y, p_ir) {
	return (p_y <= this.yLength-1) && (this.isOpenInRegionAtLeft(p_x, p_y, p_ir));
}



// Get first space in lexical order. Takes in argument a non-empty array of items with x,y properties.
function getFirstLexicalOrderSpace(p_spaceArray) {
	var answer = p_spaceArray[0];
	for (var i = 1; i < p_spaceArray.length ; i++) {
		if ((p_spaceArray[i].y < answer.y) || ((p_spaceArray[i].y == answer.y) && (p_spaceArray[i].x < answer.x))) {
			answer = p_spaceArray[i];
		}
	}
	return answer;
}

// Fills all 3 spaces (one at x,y, the other 2 given by the "array of deltas by 3-spaces config") with shapes. Precondition : the 3 spaces are already open.
SolverLITS.prototype.affectShapes = function(p_eventsList, p_x, p_y, p_config, p_shape) {
	const spaceDeltas = arrayOfSpaceDeltasBy3SpaceConfig[p_config];
	p_eventsList.push(new ShapeEvent(p_x, p_y, p_shape));
	p_eventsList.push(new ShapeEvent(p_x+spaceDeltas[0].x, p_y+spaceDeltas[0].y, p_shape));
	p_eventsList.push(new ShapeEvent(p_x+spaceDeltas[1].x, p_y+spaceDeltas[1].y, p_shape));
	return p_eventsList;
}
