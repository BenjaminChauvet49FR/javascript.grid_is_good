// Note : clues for grids in editor, or grids that get loaded, or part of clues (typical example : "BD12" in castle wall)
const SYMBOL_ID = { // All of these must be mono-char
    WHITE : 'W', 
    BLACK : 'B',
	ROUND : 'R',
	SQUARE : 'S',
	TRIANGLE : 'T',
	MOON : 'M',
	SUN : 'S',
	KNOT_HERE : 'K',
	O : 'O',
	X : 'X',
	HORIZONTAL_DOTS : 'H', 
	VERTICAL_DOTS : 'V', 
	START_POINT : 'S',
	QUESTION : '?'
} 

const CHAR_DIRECTION = {
	LEFT : 'L',
	UP : 'U',
	RIGHT : 'R',
	DOWN : 'D'
}

const GALAXIES_POSITION = {
	CENTER : 0,
	RIGHT : 1,
	DOWN :2,
	RIGHT_DOWN : 3
}