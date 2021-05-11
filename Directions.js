const DIRECTION = {LEFT : 0, UP : 1, RIGHT : 2, DOWN : 3, UNDECIDED : -1}
const DeltaX = [-1, 0, 1, 0];
const DeltaY = [0, -1, 0, 1];
const OppositeDirection = [2, 3, 0, 1];
const TurningRightDirection = [1, 2, 3, 0];
const TurningLeftDirection = [3, 0, 1, 2];
const KnownDirections = [DIRECTION.LEFT, DIRECTION.UP, DIRECTION.RIGHT, DIRECTION.DOWN];
const ORIENTATION = {HORIZONTAL : "h", VERTICAL : "v"}
const OrientationDirection = [ORIENTATION.HORIZONTAL, ORIENTATION.VERTICAL, ORIENTATION.HORIZONTAL, ORIENTATION.VERTICAL]

const dirToString = ['l', 'u', 'r', 'd'];
function stringDirection(p_dir) {
	return dirToString[p_dir];
}