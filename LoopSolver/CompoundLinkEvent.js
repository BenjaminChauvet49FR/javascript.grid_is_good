

function CompoundLinkEvent(p_x, p_y, p_dir1, p_dir2, p_state) {
	this.kind = LOOP_EVENT.COMPOUND_LINK;
	this.state = p_state;
	this.linkX = p_x;
	this.linkY = p_y;
	this.direction1 = p_dir1;
	this.direction2 = p_dir2;
	markCompoundEvent(this);
}

CompoundLinkEvent.prototype.toLogString = function() {
	return "";
}