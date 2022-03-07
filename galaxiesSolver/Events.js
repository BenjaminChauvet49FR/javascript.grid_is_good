shouldBeLoggedEvent = function(p_event) {
	return p_event.kind == FENCE_EVENT_KIND;
}

ChoiceEvent.prototype.getIndex = function() {
	return this.number;
}