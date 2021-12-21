function ActionsManagersSet(p_size, p_startingIndex) {
	this.list = [];
	for (var i = 0 ; i < p_size ; i++) {
		this.list.push(generateEntryManager());
	}
	this.activeIndex = p_startingIndex; // Note : field accessed from outside !
}

ActionsManagersSet.prototype.getActionsManager = function(p_index) {
	return this.list[p_index];
}

ActionsManagersSet.prototype.getActiveActionsManager = function() {
	return this.list[this.activeIndex];
}

ActionsManagersSet.prototype.switchActionsManager = function(p_index) {
	this.activeIndex = p_index;
}