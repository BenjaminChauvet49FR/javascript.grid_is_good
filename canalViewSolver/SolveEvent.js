const KIND_EVENT = {
	SPACE : 0,
	RANGE_MAX : 1,
	RANGE_MIN : 2
}


function SpaceEvent(p_x, p_y, p_symbol) {
	this.kind = KIND_EVENT.SPACE;
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.copy = function(){
	return new SpaceEvent(this.x, this.y, this.symbol);
}

SpaceEvent.prototype.opening = function() {
	return this.symbol;
}

SpaceEvent.prototype.coordinateX = function() {
	return this.x;
}

SpaceEvent.prototype.coordinateY = function() {
	return this.y;
}

function MinRangeEvent(p_x, p_y, p_direction, p_value) {
	this.kind = KIND_EVENT.RANGE_MIN;
	this.x = p_x;
	this.y = p_y;
	this.direction = p_direction;
	this.min = p_value;
}

MinRangeEvent.prototype.copy = function() {
	return new MinRangeEvent(this.x, this.y, this.direction, this.min);
}

MinRangeEvent.prototype.opening = function() {
	return ADJACENCY.UNDECIDED
}

function MaxRangeEvent(p_x, p_y, p_direction, p_value) {
	this.kind = KIND_EVENT.RANGE_MAX;
	this.x = p_x;
	this.y = p_y;
	this.direction = p_direction;
	this.max = p_value;
}

MaxRangeEvent.prototype.copy = function() {
	return new MaxRangeEvent(this.x, this.y, this.direction, this.max);
}

MaxRangeEvent.prototype.opening = function() {
	return ADJACENCY.UNDECIDED
}

// ---------------
// Interface

SpaceEvent.prototype.toLogString = function() {	
	return "["+LabelAdjacency[this.symbol]+" "+this.x+","+this.y+"]";
}

MinRangeEvent.prototype.toLogString = function() {
	return "["+this.x + "," + this.y + " " + LabelDirection[this.direction] + " min " + this.min + "]";
}

MaxRangeEvent.prototype.toLogString = function() {
	return "["+this.x + "," + this.y + " " + LabelDirection[this.direction] + " max " + this.max + "]";
}

shouldBeLoggedEvent = function(p_event) {
	return p_event.kind == KIND_EVENT.SPACE;
}