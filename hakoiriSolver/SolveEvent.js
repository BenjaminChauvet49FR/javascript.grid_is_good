// No "kind" this time.
const SPACE_HAKOIRI = { // From 0 to N for compatibility with SpaceNumeric
	EMPTY : 0,
	ROUND : 1,
	SQUARE : 2, 
	TRIANGLE : 3
}

const LabelHakoiri = ['X', 'R', 'S', 'T'];

ChoiceEvent.prototype.getSymbol = function() {
	return this.number;
}

ChoiceEvent.prototype.toLogString = function() {	
	return "["+ LabelHakoiri[this.number] + (this.choice ? "Y" : "N") + " " + this.x + "," + this.y + "]";
}

ChoiceEvent.prototype.opening = function() {
	if (this.number == SPACE_HAKOIRI.EMPTY) {
		return (this.choice ? ADJACENCY.NO : ADJACENCY.YES);
	} else {
		return (this.choice ? ADJACENCY.YES : ADJACENCY.UNDECIDED);
	}
}

ChoiceEvent.prototype.coordinateX = function() {
	return this.x;
}

ChoiceEvent.prototype.coordinateY = function() {
	return this.y;
}

shouldBeLoggedEvent = function(p_event) {
	return (p_event.choice);
}