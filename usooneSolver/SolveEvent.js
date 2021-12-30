const USOONE = {
	TRUTH : 2,
	LIE : 1,
	UNDECIDED : 0
}
const LabelUsooneTruth = ['-' , 'X', 'O'];

const USOONE_EVENT = {
	TRUTH : 0,
	SPACE : 1
}


function TruthEvent(p_x, p_y, p_truth) {
	this.kind = USOONE_EVENT.TRUTH;
	this.x = p_x;
	this.y = p_y;
	this.truth = p_truth;
}

TruthEvent.prototype.copy = function() {
	return new TruthEvent(this.x, this.y, this.truth);
}

TruthEvent.prototype.opening = function() {
	return ADJACENCY.UNDECIDED; 
}

TruthEvent.prototype.toLogString = function() {	
	return "[T"+ LabelUsooneTruth[this.truth]+" "+this.x+","+this.y+"]";
}

function isSpaceEvent(p_event) {
	return p_event.kind == USOONE_EVENT.SPACE;
}

function SpaceEvent(p_x, p_y, p_symbol) {
	this.kind = USOONE_EVENT.SPACE;
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.coordinateX = function() {
	return this.x;
}

SpaceEvent.prototype.coordinateY = function() {
	return this.y;
}

SpaceEvent.prototype.opening = function() {
	return this.symbol;
}

SpaceEvent.prototype.toLogString = function() {	
	return standardAdjacencyEventString(this.x, this.y, this.symbol, "S");
}

SpaceEvent.prototype.copy = function() {
	return new SpaceEvent(this.x, this.y, this.symbol);
}