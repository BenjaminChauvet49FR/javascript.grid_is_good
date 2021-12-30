// No "kind" this time.
const SPACE_SHUGAKU = { // From 0 to N for compatibility with SpaceNumeric
	OPEN : 0,
	ROUND : 1,
	SQUARE : 2
}

const LabelShugaku = ['O', 'R', 'S'];

function isChoiceEvent(p_event) {
	return p_event.symbol || (p_event.symbol == 0);
}

function ChoiceEvent(p_x, p_y, p_symbol, p_choice) {
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
	this.choice = p_choice;
}

ChoiceEvent.prototype.toLogString = function() {	
	return "["+ LabelShugaku[this.symbol] + (this.choice ? "Y" : "N") + " " + this.x + "," + this.y + "]";
}

ChoiceEvent.prototype.copy = function() {
	return new ChoiceEvent(this.x, this.y, this.symbol, this.choice);
}

ChoiceEvent.prototype.opening = function() {
	if (this.symbol == SPACE_SHUGAKU.OPEN) {
		return (this.choice ? ADJACENCY.YES : ADJACENCY.NO);
	} else {
		return (this.choice ? ADJACENCY.NO : ADJACENCY.UNDECIDED);
	}
}

ChoiceEvent.prototype.coordinateX = function() {
	return this.x;
}

ChoiceEvent.prototype.coordinateY = function() {
	return this.y;
}

// -----------
// Event copied from ../miscSolving/Fences.js ; fence events aren't supposed to have an opening function in the first place but hey...
function FenceShugakuEvent(p_x, p_y, p_direction, p_state) {
	FenceEvent.call(this, p_x, p_y, p_direction, p_state);
}

// Credits about heritage : https://developer.mozilla.org/fr/docs/Learn/JavaScript/Objects/Heritage

FenceShugakuEvent.prototype = Object.create(FenceEvent.prototype);
FenceShugakuEvent.prototype.constructor = FenceShugakuEvent;

FenceShugakuEvent.prototype.opening = function() {
	return ADJACENCY.UNDECIDED
}

FenceShugakuEvent.prototype.copy = function() {
	return new FenceShugakuEvent(this.fenceX, this.fenceY, this.direction, this.state); // Cannot use the standard copying method (in FenceEvent) since it won't return an instance of the child (FenceShugakuEvent) class
}

// ---

shouldBeLoggedEvent = function(p_event) {
	return (isChoiceEvent(p_event) && p_event.choice);
}