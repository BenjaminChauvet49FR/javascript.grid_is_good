const LUMINARY_KIND = "Lu" 

const LUMINARY = {
	MOON : 1,
	SUN : 2,
	UNDECIDED : 0
}

function LuminaryEvent(p_indexRegion, p_luminary) {
	this.kind = LUMINARY_KIND;
	this.index = p_indexRegion;
	this.luminary = p_luminary;
}

LuminaryEvent.prototype.copy = function() {
	return new LuminaryEvent(this.index, this.luminary);
}

LuminaryEvent.prototype.toLogString = function() {
	return "(MS reg. " + this.index + " " + (this.luminary == LUMINARY.MOON ? "M" : "S") + ")";
}

shouldBeLoggedLoopSolverEvent = function(p_event) {
	return p_event.kind == LUMINARY_KIND;
}
