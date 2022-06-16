LOOP_PASS_CATEGORY.REGION_GrandTour = -1;

function SolverGrandTour(p_linkGrid) {
	LoopSolver.call(this);
	this.construct(p_linkGrid);
}

SolverGrandTour.prototype = Object.create(LoopSolver.prototype);
SolverGrandTour.prototype.constructor = SolverGrandTour;

function DummySolver() {
	return new SolverGrandTour(generateLinkArray(1,1)); 
}

SolverGrandTour.prototype.construct = function(p_linkArray) {
	this.locked = true;
    this.xLength = p_linkArray[0].length;
	this.yLength = p_linkArray.length;
	this.loopSolverConstruct( 
	{	
		multipassPessimismPS : true,
		quickStartEventsPS : quickStartEventsClosure(this) // Note : well, this is the first puzzles with preset fences... not handled in main solver !
	});
	this.linksArrayBlockedR = generateValueArray(this.xLength-1, this.yLength, false);
	this.linksArrayBlockedD = generateValueArray(this.xLength, this.yLength-1, false);
	this.linksListBlockedR = [];
	this.linksListBlockedD = [];
	this.setResolution.searchSolutionMethod = loopNaiveSearchClosure(this);
	
	this.signalAllLinkedSpaces(); 
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			this.setLinkSpace(ix, iy, LOOP_STATE.LINKED); // Note : no automatic deductions for puzzles
			if (ix <= this.xLength-2) {
				if (getLinkRFromArray(p_linkArray, ix, iy) == LINKGRID.LINKED) {
					this.linksArrayBlockedR[iy][ix] = true;
					this.linksListBlockedR.push({x : ix, y : iy});
				}
			}
			if (iy <= this.yLength-2) {
				if (getLinkDFromArray(p_linkArray, ix, iy) == LINKGRID.LINKED) {
					this.linksArrayBlockedD[iy][ix] = true;
					this.linksListBlockedD.push({x : ix, y : iy});
				}
			}
		}
	}
}

// -------------------
// Getters and setters

SolverGrandTour.prototype.getLinkRBlocked = function(p_x, p_y) {
	return this.linksArrayBlockedR[p_y][p_x]; 
} 

SolverGrandTour.prototype.getLinkDBlocked = function(p_x, p_y) {
	return this.linksArrayBlockedD[p_y][p_x]; // Trick !
} 

// -------------------
// Input methods

SolverGrandTour.prototype.emitHypothesisDown = function(p_x, p_y, p_state) {
	this.tryToPutNewDown(p_x, p_y, p_state);
}

SolverGrandTour.prototype.emitHypothesisRight = function(p_x, p_y, p_state) {
	this.tryToPutNewRight(p_x, p_y, p_state);
}

SolverGrandTour.prototype.emitPassNode = function(p_x, p_y) {
	return this.passLoop({category : LOOP_PASS_CATEGORY.SPACE_STANDARD, x : p_x, y : p_y});
}

SolverGrandTour.prototype.makeMultipass = function() {
	this.multipassLoop();
}

SolverGrandTour.prototype.makeResolution = function() { 
	this.resolve();
}

// -------------------
// Quick start !

quickStartEventsClosure = function(p_solver) { // If no quickstart, these links don't exist ! Hence the locks on input methods provided by quickStartDone (btw mind the noun).
	return function(p_listQSEvents) { 
		p_listQSEvents.push({quickStartLabel : "Grand Tour"});
		p_solver.linksListBlockedR.forEach(coorsLink => {
			p_listQSEvents.push(new LinkEvent(coorsLink.x, coorsLink.y, DIRECTION.RIGHT, LOOP_STATE.LINKED));
		});
		p_solver.linksListBlockedD.forEach(coorsLink =>{
			p_listQSEvents.push(new LinkEvent(coorsLink.x, coorsLink.y, DIRECTION.DOWN, LOOP_STATE.LINKED));
		});
	}
}