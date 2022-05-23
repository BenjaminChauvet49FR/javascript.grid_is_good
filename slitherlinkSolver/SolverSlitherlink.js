LOOP_PASS_CATEGORY.MESH = -1;

// ---------------------

function SolverSlitherlink(p_symbolGrid) {
	LoopSolver.call(this);
	this.construct(p_symbolGrid);
}

SolverSlitherlink.prototype = Object.create(LoopSolver.prototype);
SolverSlitherlink.prototype.constructor = SolverSlitherlink;

function DummySolver() {
	return new SolverSlitherlink(generateSymbolArray(1, 1));
}

SolverSlitherlink.prototype.construct = function(p_numberMeshGrid) {
    this.xLength = p_numberMeshGrid[0].length + 1;
	this.yLength = p_numberMeshGrid.length + 1;
	this.loopSolverConstruct( 
	{	setEdgeLinkedPSAtomicDos : setEdgeLinkedPSAtomicDosClosure(this),
		setEdgeClosedPSAtomicDos : setEdgeClosedPSAtomicDosClosure(this),
		setEdgeLinkedPSAtomicUndos : setEdgeLinkedPSAtomicUndosClosure(this),
		setEdgeClosedPSAtomicUndos : setEdgeClosedPSAtomicUndosClosure(this),
		setEdgeLinkedPSDeductions : setEdgeLinkedDeductionsClosure(this),
		setEdgeClosedPSDeductions : setEdgeClosedDeductionsClosure(this),
		quickStartEventsPS : quickStartEventsClosure(this),
		generateEventsForPassPS : generateEventsForMeshPassClosureSlitherlink(this),
		orderedListPassArgumentsPS : startingOrderedListPassArgumentsSlitherlink(this),
		namingCategoryPS : namingCategoryPassClosure(this),
		multipassPessimismPS : true
	});
	this.setResolution.searchSolutionMethod = loopNaiveSearchClosure(this);

	this.numericMeshArray = [];
	this.numericMeshCoordinatesListAndPassArguments = [];
	this.numericMeshCoordinatesList = []; // List of coordinates of numeric spaces. Public.
	var value;
	for (var iy = 0 ; iy <= this.yLength-2 ; iy++) {
		this.numericMeshArray.push([]);
		for (var ix = 0 ; ix <= this.xLength-2 ; ix++) {
			value = p_numberMeshGrid[iy][ix];
			if (value != null) {
				this.numericMeshCoordinatesListAndPassArguments.push({passCategory : LOOP_PASS_CATEGORY.MESH, x : ix, y : iy});
				this.numericMeshCoordinatesList.push({x : ix, y : iy});
				this.numericMeshArray[iy].push({number : value, notLinkedCirclingEdgesYet : value, notClosedCirclingEdgesYet : 4 - value});
            } else {
				this.numericMeshArray[iy].push({number : null});
			}
		}
	}
}

// -------------------
// Getters and setters

SolverSlitherlink.prototype.getNumberInMesh = function(p_x, p_y) {
	return this.numericMeshArray[p_y][p_x].number;
}

SolverSlitherlink.prototype.getXYMeshesSidesLink = function(p_x, p_y, p_dir) {
	var resultCoors = []; // Remember : mesh down-right of the (p_x, p_y) dot !
	switch(p_dir) {
		case DIRECTION.LEFT : 
			this.conditionalNumberedMesh(resultCoors, p_y > 0, p_x-1, p_y-1);
			this.conditionalNumberedMesh(resultCoors, p_y <= this.yLength-2, p_x-1, p_y);
		break;
		case DIRECTION.RIGHT : 
			this.conditionalNumberedMesh(resultCoors, p_y > 0, p_x, p_y-1);
			this.conditionalNumberedMesh(resultCoors, p_y <= this.yLength-2, p_x, p_y);
		break;
		case DIRECTION.UP :
			this.conditionalNumberedMesh(resultCoors, p_x > 0, p_x-1, p_y-1);
			this.conditionalNumberedMesh(resultCoors, p_x <= this.xLength-2, p_x, p_y-1);
		break;
		case DIRECTION.DOWN :
			this.conditionalNumberedMesh(resultCoors, p_x > 0, p_x-1, p_y);
			this.conditionalNumberedMesh(resultCoors, p_x <= this.xLength-2, p_x, p_y);
		break;		
	}
	return resultCoors;
}

SolverSlitherlink.prototype.conditionalNumberedMesh = function(p_coorsList, p_XYcondition, p_x, p_y) {
	if (p_XYcondition && this.numericMeshArray[p_y][p_x].number != null) {
		p_coorsList.push({x : p_x, y : p_y});
	}
}

// -------------------
// Input methods

SolverSlitherlink.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	if (p_y <= this.yLength-2) {
		this.tryToPutNewDown(p_x, p_y, p_state);
	}
}

SolverSlitherlink.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	if (p_x <= this.xLength-2) {
		this.tryToPutNewRight(p_x, p_y, p_state);
	}
}

SolverSlitherlink.prototype.emitHypothesisNode = function(p_x, p_y, p_state) {
	this.tryToPutNewSpace(p_x, p_y, p_state);
}

SolverSlitherlink.prototype.emitPassMesh = function(p_xSpace, p_ySpace) {
	if (this.numericMeshArray[p_ySpace][p_xSpace].number != null) {		// Note : we don't want an arbitrary set of spaces to be passed, even though it is possible...
		return this.passLoop({passCategory : LOOP_PASS_CATEGORY.MESH, x : p_xSpace, y : p_ySpace}); 
	} else {
		return null;
	}
}

SolverSlitherlink.prototype.emitPassNode = function(p_x, p_y) {
	return this.passLoop({passCategory : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y}); 
}

SolverSlitherlink.prototype.makeMultipass = function() {
	this.multipassLoop();
}

SolverSlitherlink.prototype.makeResolution = function() { 
	this.resolve();
}

// -------------------
// Atomic closures 

function setEdgeLinkedPSAtomicDosClosure(p_solver) {
	return function(p_args) { 
		p_solver.getXYMeshesSidesLink(p_args.x, p_args.y, p_args.direction).forEach(coors => {
			p_solver.numericMeshArray[coors.y][coors.x].notLinkedCirclingEdgesYet--;
		});
	}
}

function setEdgeClosedPSAtomicDosClosure(p_solver) {
	return function(p_args) {
		p_solver.getXYMeshesSidesLink(p_args.x, p_args.y, p_args.direction).forEach(coors => {
			p_solver.numericMeshArray[coors.y][coors.x].notClosedCirclingEdgesYet--;
		});
	}
}

function setEdgeLinkedPSAtomicUndosClosure(p_solver) {
	return function(p_args) {
		p_solver.getXYMeshesSidesLink(p_args.x, p_args.y, p_args.direction).forEach(coors => {
			p_solver.numericMeshArray[coors.y][coors.x].notLinkedCirclingEdgesYet++;
		});
	}
}

function setEdgeClosedPSAtomicUndosClosure(p_solver) {
	return function(p_args) {
		p_solver.getXYMeshesSidesLink(p_args.x, p_args.y, p_args.direction).forEach(coors => {
			p_solver.numericMeshArray[coors.y][coors.x].notClosedCirclingEdgesYet++;
		});
	}
}

// -------------------
// Closure deduction

function setEdgeClosedDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventToApply) {
		p_solver.getXYMeshesSidesLink(p_eventToApply.linkX, p_eventToApply.linkY, p_eventToApply.direction).forEach(coors => {
			p_solver.deductionsTestLinkAllAround(p_listEventsToApply, coors.x, coors.y);
		});
	}
}

function setEdgeLinkedDeductionsClosure(p_solver) {
	return function(p_listEventsToApply, p_eventToApply) {
		p_solver.getXYMeshesSidesLink(p_eventToApply.linkX, p_eventToApply.linkY, p_eventToApply.direction).forEach(coors => {
			p_solver.deductionsTestCloseAllAround(p_listEventsToApply, coors.x, coors.y);
		});		
	}
}

/*
OK, here are the things that are "deduced by pass only" right now and that should be deduced by deduction :
-If there is a linked link between 2 nodes and one of them is around a 3-mesh : link the 2 links of the 3-mesh that don't use that node.
-If a node has 2 remaining undecided links and no linked link AND is near a 1-mesh or a 3-mesh : either close or link these meshes.
But maybe writing the "whole solver" will actually do the trick.

Things that could have been deduced by QS but are deduced by multipass right now (inspecting around the 4 edges of a given numeric mesh) :
A 3-mesh has its 4 nodes surrounded
Two or more adjacent 3-meshs, : link orthogonal to the orientation of adjacency are linked
Two diagonally adjacent 3s : links on the outside are linked
*/

SolverSlitherlink.prototype.deductionsTestCloseAllAround = function(p_listEventsToApply, p_xMesh, p_yMesh) { 
	if (this.numericMeshArray[p_yMesh][p_xMesh].notLinkedCirclingEdgesYet == 0) {
		this.deductionsIfSpaceUndecided(p_listEventsToApply, p_xMesh, p_yMesh, DIRECTION.RIGHT, LOOP_STATE.CLOSED);
		this.deductionsIfSpaceUndecided(p_listEventsToApply, p_xMesh, p_yMesh, DIRECTION.DOWN, LOOP_STATE.CLOSED);
		this.deductionsIfSpaceUndecided(p_listEventsToApply, p_xMesh+1, p_yMesh, DIRECTION.DOWN, LOOP_STATE.CLOSED);
		this.deductionsIfSpaceUndecided(p_listEventsToApply, p_xMesh, p_yMesh+1, DIRECTION.RIGHT, LOOP_STATE.CLOSED);
	} 
}

SolverSlitherlink.prototype.deductionsTestLinkAllAround = function(p_listEventsToApply, p_xMesh, p_yMesh) {
	if (this.numericMeshArray[p_yMesh][p_xMesh].notClosedCirclingEdgesYet == 0) {
		this.deductionsIfSpaceUndecided(p_listEventsToApply, p_xMesh, p_yMesh, DIRECTION.RIGHT, LOOP_STATE.LINKED);
		this.deductionsIfSpaceUndecided(p_listEventsToApply, p_xMesh, p_yMesh, DIRECTION.DOWN, LOOP_STATE.LINKED);
		this.deductionsIfSpaceUndecided(p_listEventsToApply, p_xMesh+1, p_yMesh, DIRECTION.DOWN, LOOP_STATE.LINKED);
		this.deductionsIfSpaceUndecided(p_listEventsToApply, p_xMesh, p_yMesh+1, DIRECTION.RIGHT, LOOP_STATE.LINKED);
	} 
}

SolverSlitherlink.prototype.deductionsIfSpaceUndecided = function(p_listEventsToApply, p_x, p_y, p_direction, p_state) {
	if (this.getLink(p_x, p_y, p_direction) == LOOP_STATE.UNDECIDED) {
		p_listEventsToApply.push(new LinkEvent(p_x, p_y, p_direction, p_state));
	}
}


// -------------------
// Quickstart

quickStartEventsClosure = function(p_solver) {
	return function(p_listQSEvents) { 
		p_listQSEvents.push({quickStartLabel : "Slitherlink"});
		p_solver.numericMeshCoordinatesListAndPassArguments.forEach(coors => {
			p_solver.deductionsTestLinkAllAround(p_listQSEvents, coors.x, coors.y);
			p_solver.deductionsTestCloseAllAround(p_listQSEvents, coors.x, coors.y);
		});
	}
}

// -------------------
// Passing & multipassing

generateEventsForMeshPassClosureSlitherlink = function(p_solver) {
	return function(p_meshCoors) {		// p_meshCoors must hold a number
		var listPass = [];
		listPass.push(p_solver.generateEventChoiceForLink(p_meshCoors.x, p_meshCoors.y, DIRECTION.RIGHT));
		listPass.push(p_solver.generateEventChoiceForLink(p_meshCoors.x, p_meshCoors.y, DIRECTION.DOWN));
		listPass.push(p_solver.generateEventChoiceForLink(p_meshCoors.x+1, p_meshCoors.y, DIRECTION.DOWN));
		listPass.push(p_solver.generateEventChoiceForLink(p_meshCoors.x, p_meshCoors.y+1, DIRECTION.RIGHT));
		return listPass; 
	}
}

SolverSlitherlink.prototype.generateEventChoiceForLink = function(p_xLink, p_yLink, p_direction) {
	return [new LinkEvent(p_xLink, p_yLink, p_direction, LOOP_STATE.LINKED), new LinkEvent(p_xLink, p_yLink, p_direction, LOOP_STATE.CLOSED)];
}

function startingOrderedListPassArgumentsSlitherlink(p_solver) {
	return function() {
		return copyCoordinatesList(p_solver.numericMeshCoordinatesListAndPassArguments);
	}
}

function namingCategoryPassClosure(p_solver) {
	return function (p_indexPass) {
		const x = p_indexPass.x;
		const y = p_indexPass.y;
		return "(number " + p_solver.numericMeshArray[y][x].number + ") " + x + "," + y ;
	}
}