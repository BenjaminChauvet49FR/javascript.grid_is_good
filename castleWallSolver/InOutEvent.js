const IN_OUT_EVENT = "IO"; 

function InOutEvent(p_x, p_y, p_position) {
	this.xMesh = p_x;
	this.yMesh = p_y;
	this.position = p_position;
	this.kind = IN_OUT_EVENT; // 'kind' is mandatory in order to compare.
}

InOutEvent.prototype.copy = function() {
	return new InOutEvent(this.xMesh, this.yMesh, this.position);
}

InOutEvent.prototype.toLogString = function() {
	return "(Mesh " + this.xMesh + "," + this.yMesh + " " + (this.position == CW_POSITION.INNER ? "in" : "out") + ")";
}