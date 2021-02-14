const BORDER_STATE = {LINKED : 2, CLOSED : 1, UNDECIDED : 0};
LOOP_EVENT.REGION_JUNCTION = "RJ"

function RegionJunctionEvent(p_i1, p_i2, p_state) {
	this.kind = LOOP_EVENT.REGION_JUNCTION;
	this.index1 = p_i1;
	this.index2 = p_i2;
	this.state = p_state;
}
// Is it worth classing it ?