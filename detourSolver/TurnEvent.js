const TURNING_KIND_EVENT = "Turn"; 

function TurnEvent(p_x, p_y, p_state) {
	this.x = p_x;
	this.y = p_y;
	this.turningState = p_state;
	this.kind = TURNING_KIND_EVENT; // 'kind' is mandatory in order to compare.
}

TurnEvent.prototype.copy = function() {
	return new TurnEvent(this.x, this.y, this.turningState);
}

TurnEvent.prototype.toLogString = function() {
	return "(Turn." + (this.turningState == TURNING.YES ? "O" : "X") + " " + this.x + "," + this.y +")";
}