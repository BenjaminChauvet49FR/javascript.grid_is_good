const TRIANGLE_KIND = 1;
const STRAIGHT_SPACE_KIND = 2;

function StraightSpaceEvent(p_x, p_y) {
	this.kind = STRAIGHT_SPACE_KIND;
	this.x = p_x;
	this.y = p_y;
}

StraightSpaceEvent.prototype.copy = function() {
	return new StraightSpaceEvent(this.x, this.y);
}

StraightSpaceEvent.prototype.toLogString = function() {	
	return "[" + "Str.S " + this.x  + "," + this.y + "]";
}

function TriangleEvent(p_x, p_y, p_direction, p_symbol) {
	this.kind = TRIANGLE_KIND;
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
	this.direction = p_direction;
}

TriangleEvent.prototype.copy = function() {
	return new TriangleEvent(this.x, this.y, this.direction, this.symbol);
}

TriangleEvent.prototype.toLogString = function() {	
	return "[" + "T" + (this.symbol == SHAKASHAKA.WHITE ? "W" : "B") + " " + this.x  + "," + this.y + "]";
}

shouldBeLoggedEvent = function(p_event) {
	return (p_event.kind == TRIANGLE_KIND);
}