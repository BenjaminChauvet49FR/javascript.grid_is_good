const EDGES = {
	LEFT : "l",
	UP : "u",
	RIGHT : "r",
	DOWN : "d"
}

function MarginInfo(p_leftLength, p_upLength, p_rightLength, p_bottomLength) { // All have numeric values !
	this.leftLength = p_leftLength ? p_leftLength : 0;
	this.upLength = p_upLength ? p_upLength : 0;
	this.rightLength = p_rightLength ? p_rightLength : 0;
	this.bottomLength = p_bottomLength ? p_bottomLength : 0;
}

MarginInfo.prototype.getLeftLength = function() {
	return this.leftLength;
}
MarginInfo.prototype.getUpLength = function() {
	return this.upLength;
}
MarginInfo.prototype.getRightLength = function() {
	return this.rightLength;
}
MarginInfo.prototype.getDownLength = function() {
	return this.getDownLength;
}