// No "kind" this time.
const SPACE_HAKOIRI = { // From 0 to N for compatibility with SpaceNumeric
	EMPTY : 0,
	ROUND : 1,
	SQUARE : 2, 
	TRIANGLE : 3
}

const LabelHakoiri = ['X', 'R', 'S', 'T'];

function SpaceAllowEvent(p_x, p_y, p_symbol, p_choice) {
	this.symbol = p_symbol;
	this.coorX = p_x;
	this.coorY = p_y;
	this.choice = p_choice;
}

SpaceAllowEvent.prototype.toString = function() {	
	return "["+ LabelHakoiri[this.symbol] + (this.choice ? "Y" : "N") + " " + this.coorX + "," + this.coorY + "]";
}

SpaceAllowEvent.prototype.copy = function() {
	return new SpaceAllowEvent(this.coorX, this.coorY, this.symbol, this.choice);
}

SpaceAllowEvent.prototype.opening = function() {
	if (this.symbol == SPACE_HAKOIRI.EMPTY) {
		return (this.choice ? ADJACENCY.NO : ADJACENCY.YES);
	} else {
		return (this.choice ? ADJACENCY.YES : ADJACENCY.UNDECIDED);
	}
}

SpaceAllowEvent.prototype.x = function() {
	return this.coorX;
}

SpaceAllowEvent.prototype.y = function() {
	return this.coorY;
}

shouldBeLoggedEvent = function(p_event) {
	return (p_event.choice);
}