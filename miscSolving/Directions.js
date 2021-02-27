const DIRECTION = {LEFT : "l", UP : "u", RIGHT : "r", DOWN : "d", UNDECIDED : '-'}

const DeltaX = {
	l: -1,
	u: 0,
	r: 1,
	d: 0
}

const DeltaY = {
	l: 0,
	u: -1,
	r: 0,
	d: 1
}

const OppositeDirection = {
	l: DIRECTION.RIGHT,
	u: DIRECTION.DOWN,
	r: DIRECTION.LEFT,
	d: DIRECTION.UP
}

const TurningRightDirection = {
	l: DIRECTION.UP,
	u: DIRECTION.RIGHT,
	r: DIRECTION.DOWN,
	d: DIRECTION.LEFT
}

const TurningLeftDirection = {
	l: DIRECTION.DOWN,
	u: DIRECTION.LEFT,
	r: DIRECTION.UP,
	d: DIRECTION.RIGHT
}

const KnownDirections = [DIRECTION.LEFT, DIRECTION.UP, DIRECTION.RIGHT, DIRECTION.DOWN];

// --------------------------
const ORIENTATION = {HORIZONTAL : "h", VERTICAL : "v"}
const OrientationDirection = {
	l: ORIENTATION.HORIZONTAL,
	u: ORIENTATION.VERTICAL,
	r: ORIENTATION.HORIZONTAL,
	d: ORIENTATION.VERTICAL
}