function StateEvent(p_x, p_y, p_state) {
	this.kind = LOOP_EVENT.STATE;
	this.x = p_x;
	this.y = p_y;
	this.state = p_state;
}

function LinkEvent(p_x, p_y, p_direction, p_state) {
	this.kind = LOOP_EVENT.LINK;
	this.state = p_state;
	this.linkX = p_x;
	this.linkY = p_y;
	this.direction = p_direction;
	
}

