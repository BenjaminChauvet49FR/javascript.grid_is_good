const COLOURS = {
	
	// Misc
	X_LIGHT : '#cccccc',
	FILLING : '#000088',
	PEARL_OUT : '#000000',
	BLACK_PEARL_IN : '#000044',
	WHITE_PEARL_IN : '#ffffff',
	
	// Wall grid
	CLOSED_WALL : '#222222',
	OPEN_WALL : '#dddddd',
	EDGE_WALL : '#000000',
	BANNED_SPACE : '#666666',
	
	// Digits to add
	FIXED_NUMBER : '#880044',
	NOT_FIXED_NUMBER : '#440088',
	
	// Adjacency
	OPEN_WILD : '#00ffcc',
	OPEN_WILD_LIGHT : '#88ffee',
	OPEN_SPREAD : '#00ffcc',
	OPEN_KABE : '#00ccff',
	OPEN_KABE_LIGHT : '#aaeeff',
	CLOSED_WILD : '#cc0022',
	CLOSED_SPREAD : '#cc0022',
	
	// Fences
	CLOSED_FENCE : '#222222',
	UNDECIDED_FENCE : '#cccccc',
	OPEN_FENCE : '#eeeeff',
	
	// Loop
	NO_LINK : '#aa0000',
	NO_LINK_WALL : '#ff8800',
	LINK : '#cc00ff',
	NO_LINK_SPACE : '#448844',
	LINK_SPACE : '#ddeeff',
	// Loop ergonomic
	LOOP_ERGONOMIC_OPPOSITE_END : '#0000ff',
	LOOP_RAINBOW_ROADS : [
	'#ff0000',
	'#00ff00',
	'#0000ff',
	'#ffff00',
	'#ff00ff',
	'#00ffff',
	'#ff0080',
	'#80ff00',
	'#0080ff',
	'#ff8000',
	'#00ff80',
	'#8000ff'
	],
	// Dotted grid
	OPEN_LINK_DOTS : '#000000',
	OPEN_NODE_DOTS : '#440022',
	UNDECIDED_LINK_DOTS : '#dddddd',
	CLOSED_LINK_DOTS : '#eeeeff',
	FIXED_LINK_DOTS : '#cc0088',
	LIGHT_DOT_BG : '#ffffcc',
	LIGHT_DOT_WRITE : '#000033',
	DARK_DOT_BG : '#000033',
	DARK_DOT_WRITE : '#ffffcc',
	LIGHT_AREA : '#ffffee',
	DARK_AREA : '#ddddff',
	
	// Specific ; editor plus solver
	KNOT_INNER : '#002288',
	KNOT_BORDER : '#000044',
	HAKOIRI_TRIANGLE : '#4400ff',
	HAKOIRI_ROUND : '#ff0000',
	HAKOIRI_SQUARE : '#00cc00',
	HAKOIRI_EDGE : '#220044',
	MOON_OUT : '#222222',
	MOON_IN : '#aa88cc',
	SUN_OUT : '#888800',
	SUN_IN : '#ffff88',
	SURAROMU_DOTS_GATE : '#660044',
	SURAROMU_START_POINT_IN : '#ffffff',
	SURAROMU_START_POINT_OUT : '#000000',
	SURAROMU_BG_BLOCKED_SPACE : '#000000',
	SURAROMU_LABEL_BG_FIXED : '#ffffdd',
	SURAROMU_LABEL_BG_NOT_FIXED : '#ffcc22',
	SURAROMU_LABEL_WRITE : '#000088',
	
	
	// Sudokus
	SUDOKU_FRAME_ACTIVE : '#ff8800',
	SUDOKU_FRAMES_RAINBOW : ['#ff0000', '#00ccff', '#8800ff', '#00aa00', '#0000ff'],
	
	// Solvers - text writing in canvas
	STANDARD_NOT_CLOSED_WRITE : '#000000',
	STANDARD_CLOSED_WRITE : '#ffff88',
	STANDARD_ALL_OPEN_WRITE : '#008800',
	LOOP_DIGITS_WRITE : '#004488',
	WRITE_BLOCKING_KABE : '#000000',
	WRITE_IN_FENCES : '#000044',
	WRITE_WITHIN_OPEN_WILD : '#000000',
	WRITE_WITHIN_FIELD : '#000000', // Space in blue for instance
	LOOP_STANDARD_NOT_CLOSED_WRITE : '#440044',
	LOOP_STANDARD_CLOSED_WRITE : '#ccff00',
	
	// Editor
	SELECTED_SPACE : '#bbffcc',
	SELECTED_CORNER_SPACE : '#bbccff',
	EDITOR_TEXT_WRITING : '#000000',
	WILDCARD_WRITING : '#000000',
	// Purification
	PURIFICATION_SYMBOL_GRID : '#ffaaaa',
	EDITOR_VAGUE_NODE : '#888888',
	EDITOR_OPEN_LINK_DOTS : '#222222',
	EDITOR_CLOSED_LINK_DOTS : '#dddddd',
	WHITE_ON_BLACK : "#dddddd",
	BLACK_ON_WHITE : "#000000"
}

// How fonts are named
const FONTS = {
	ARIAL : "Arial"
}