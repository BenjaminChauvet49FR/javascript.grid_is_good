const BORDER_STATE = {LINKED : 2, CLOSED : 1, UNDECIDED : 0};
LOOP_EVENT.REGION_JUNCTION = "RJ"

function RegionJunctionEvent(p_i1, p_i2, p_state) {
	this.kind = LOOP_EVENT.REGION_JUNCTION;
	this.index1 = Math.min(p_i1, p_i2);
	this.index2 = Math.max(p_i1, p_i2);
	this.state = p_state;
}

RegionJunctionEvent.prototype.copy = function() {
	return new RegionJunctionEvent(this.index1, this.index2, this.state);
}

RegionJunctionEvent.prototype.toLogString = function() {
 	return "["+"RJ "+ (this.state == BORDER_STATE.LINKED ? "O" : "X") +" "+this.index1+","+this.index2+"]";
}