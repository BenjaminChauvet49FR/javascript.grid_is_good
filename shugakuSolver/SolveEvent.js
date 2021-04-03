// No "kind" this time.

function SpaceEvent(p_x, p_y, p_symbol, p_choice) {
	this.symbol = p_symbol;
	this.coorX = p_x;
	this.coorY = p_y;
	this.choice = p_choice;
}

SpaceEvent.prototype.toString = function(){	
	return "["+this.symbol+" "+this.coorX+","+this.coorY+"]";
}

SpaceEvent.prototype.copy = function(){
	return new SpaceEvent(this.coorX, this.coorY, this.symbol);
}

SpaceEvent.prototype.opening = function() {
	if (this.symbol == SPACE_SHUGAKU.OPEN) {
		return (this.choice ? SPACE.OPEN : SPACE.CLOSED);
	} else {
		return (this.choice ? SPACE.CLOSED : SPACE.UNDECIDED);
	}
}

SpaceEvent.prototype.x = function() {
	return this.coorX;
}

SpaceEvent.prototype.y = function() {
	return this.coorY;
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
	return SPACE.NOT_APPLICABLE;
}