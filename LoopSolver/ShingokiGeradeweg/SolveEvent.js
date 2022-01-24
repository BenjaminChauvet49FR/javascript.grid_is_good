const KIND_EVENT = {
	RANGE_MAX : "rm",
	RANGE_MIN : "m"
}


function MaxRangeEvent(p_x, p_y, p_direction, p_value) {
	this.kind = KIND_EVENT.RANGE_MAX;
	this.x = p_x;
	this.y = p_y;
	this.direction = p_direction;
	this.max = p_value;
	this.outOfPass = true;
}

function MinRangeEvent(p_x, p_y, p_direction, p_value) {
	this.kind = KIND_EVENT.RANGE_MIN;
	this.x = p_x;
	this.y = p_y;
	this.direction = p_direction;
	this.min = p_value;
	this.outOfPass = true;
}

MinRangeEvent.prototype.toLogString = function() {
	return "["+this.x + "," + this.y + " " + LabelDirection[this.direction] + " min " + this.min + "]";
}

MaxRangeEvent.prototype.toLogString = function() {
	return "["+this.x + "," + this.y + " " + LabelDirection[this.direction] + " max " + this.max + "]";
}