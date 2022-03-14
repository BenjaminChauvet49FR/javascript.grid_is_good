var pixImagesData = {};

// Precondition : grid must be already restarted (chosen because of sudoku, but not only)
function getInfo(p_source, p_drawer, p_editorCore, p_trueCanvas, p_analyzerMode) {
	var img = new Image;
	img.src = p_source;
	img.onload = function() {
		p_trueCanvas.width = img.width;
		p_trueCanvas.height = img.height;
		p_trueCanvas.getContext("2d").drawImage(img, 0, 0);
		pix2 = {width : img.width, height : img.height, 
			data : p_trueCanvas.getContext("2d").getImageData(0, 0, img.width, img.height).data}; // To be simplified
		adaptCanvasAndGrid(p_trueCanvas, p_drawer, p_editorCore); //cannot be put above for some reasons
		process(p_editorCore, pix2, p_analyzerMode);
	}
} // Note : Papa n'utilise jamais onload


function process(p_editorCore, p_pix, p_analyzerMode) {
	const xLength = p_editorCore.getXLength(); // Variables used for analysis
	const yLength = p_editorCore.getYLength();
	var xDelta = 0;
	var yDelta = 0;
	if (p_analyzerMode.id == ANALYZER_MODE.BLUE_NET.id || p_analyzerMode.id == ANALYZER_MODE.SHINGOKI_DOTTED.id) {
		xDelta = -1; // Differences (length in analysis) minus (length in data)
		yDelta = -1; 
	}
	var analyzer = new PictureAnalyzer(xLength + xDelta, yLength + yDelta, p_pix.data, p_pix.width, p_pix.height);
	
	var drawnGridId = null;
	if (!p_analyzerMode.hasFixedWalls && p_analyzerMode.hasWalls) {		
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength-1 ; x++) {
				p_editorCore.setWallR(x, y, analyzer.analyzeWallR(x, y));
		}}
		for (y = 0 ; y < yLength-1 ; y++) {for (x = 0 ; x < xLength ; x++) {
				p_editorCore.setWallD(x, y, analyzer.analyzeWallD(x, y));
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.BLUE_NET.id) {		
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength-1 ; x++) {
				p_editorCore.setWallR(x, y, analyzer.analyzeEdgeD(x, y));
		}}
		for (y = 0 ; y < yLength-1 ; y++) {for (x = 0 ; x < xLength ; x++) {
				p_editorCore.setWallD(x, y, analyzer.analyzeEdgeR(x, y));
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.MOONSUN.id) {
		drawnGridId = GRID_ID.MOONSUN;
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(drawnGridId, x, y, analyzer.analyzeMoonsun(x, y));
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.PLAYSTATION_SHAPES.id) {
		drawnGridId = GRID_ID.PLAYSTATION_SHAPES;
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(drawnGridId, x, y, analyzer.analyzePlaystationShapes(x, y));
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.YAGIT.id) {
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(GRID_ID.YAGIT, x, y, analyzer.analyzeYagitShapes(x, y));
		}}
		for (y = 0 ; y < yLength-1 ; y++) {for (x = 0 ; x < xLength-1 ; x++) {
			p_editorCore.set(GRID_ID.KNOTS, x, y, analyzer.cornerRDBlackEnough(x, y) ? SYMBOL_ID.KNOT_HERE : null);
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.GREY_NUMBERS_WALLED.id) {
		drawnGridId = GRID_ID.WILDCARD;
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(drawnGridId, x, y, analyzer.analyzeSpaceGreyOrNot(x, y)); 
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.NUMBERS_LEFT_UP_WALLED.id || p_analyzerMode.id == ANALYZER_MODE.NUMBERS_WALLED.id) {
		drawnGridId = GRID_ID.WILDCARD;
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(drawnGridId, x, y, analyzer.analyzeSpaceLeftUpWalled(x, y)); 
		}}
	}
	
	if (p_analyzerMode.id == ANALYZER_MODE.NUMBERS_SUDOKU.id) {
		drawnGridId = GRID_ID.WILDCARD;
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(drawnGridId, x, y, analyzer.analyzeSpaceSudokuGrid(x, y)); 
		}}
	}
		 
	if (p_analyzerMode.id == ANALYZER_MODE.PEARLS.id) {
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(GRID_ID.PEARL, x, y, analyzer.analyzePearlWhiteBlack(x, y));
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.GALAXIES_GREY.id) {
		var rightExists, downExists;
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			rightExists = (x <= xLength-2);
			downExists = (y <= yLength-2);
			if (analyzer.hasGreyCenter(x, y)) {				
				p_editorCore.manageGalaxyGridSpace(x, y);
			}
			if (downExists && analyzer.hasGreyD(x, y)) {				
				p_editorCore.manageGalaxyGridDown(x, y);
			}
			if (rightExists && analyzer.hasGreyR(x, y)) {				
				p_editorCore.manageGalaxyGridRight(x, y);
			}
			if (rightExists && downExists && analyzer.hasGreyRD(x, y)) {				
				p_editorCore.manageGalaxyGridRightDown(x, y);
			}
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.GALAXIES_PEARLY.id) {
		var rightExists, downExists;
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			rightExists = (x <= xLength-2);
			downExists = (y <= yLength-2);
			if (analyzer.hasPearlGalaxyCenter(x, y)) {				
				p_editorCore.manageGalaxyGridSpace(x, y);
			}
			if (downExists && analyzer.hasPearlGalaxyD(x, y)) {				
				p_editorCore.manageGalaxyGridDown(x, y);
			}
			if (rightExists && analyzer.hasPearlGalaxyR(x, y)) {				
				p_editorCore.manageGalaxyGridRight(x, y);
			}
			if (rightExists && downExists && analyzer.hasPearlGalaxyRD(x, y)) {				
				p_editorCore.manageGalaxyGridRightDown(x, y);
			}
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.FROM_BLACK.id) {
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(GRID_ID.WILDCARD, x, y, analyzer.analyzeFromBlack(x, y));
		}}
	} 
	if (p_analyzerMode.id == ANALYZER_MODE.CASTLE_WALL.id) {
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(GRID_ID.YAJILIN_BLACK_WHITE, x, y, analyzer.analyzeSpaceWhiteBlack(x, y));
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.NUMBER_BALL_BLACK_WHITE.id) {
		var content;
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			content = analyzer.analyzeSpaceWhiteBlack(x, y) ; 
			if (content != null) {				
				p_editorCore.set(GRID_ID.NUMBER_BLACK_WHITE, x, y, content+"2"); // Note : actually convenient.
			}
		}}
	} 
	if (p_analyzerMode.id == ANALYZER_MODE.SHINGOKI_DOTTED.id) {
		for (y = 0 ; y <= yLength ; y++) {for (x = 0 ; x <= xLength ; x++) {
			content = analyzer.analyzeRoundWhiteBlackInDottedGrid(x, y) ; 
			if (content != null) {				
				p_editorCore.set(GRID_ID.NUMBER_BLACK_WHITE, x, y, content+"2"); // Note : actually convenient.
			}
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.NOT_GREY.id || p_analyzerMode.id == ANALYZER_MODE.NOT_GREY_WALLED.id) {
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(GRID_ID.WILDCARD, x, y, analyzer.analyzeSpaceGreyOrNot(x, y)); 
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.BLUE_ON_WHITE.id || p_analyzerMode.id == ANALYZER_MODE.BLACK_ON_WHITE.id || p_analyzerMode.id == ANALYZER_MODE.YAJI.id) {
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(GRID_ID.WILDCARD, x, y, analyzer.analyzeSpaceDigitOnWhite(x, y)); 
		}}
	}
	if (p_analyzerMode.id == ANALYZER_MODE.FROM_BLACK_2.id) {
		for (y = 0 ; y < yLength ; y++) {for (x = 0 ; x < xLength ; x++) {
			p_editorCore.set(GRID_ID.WILDCARD, x, y, analyzer.analyzeSpaceDigitOnWhiteAccurate(x, y)); 
		}}
	}
	var state;
	if (!p_analyzerMode.hasFixedWalls && p_analyzerMode.hasWalls) {	
		if (drawnGridId != null) {			
			for (var y = 0 ; y < yLength ; y++) {for (var x = 0 ; x < xLength ; x++) {
				state = analyzer.analyzeStateSpace(x, y, p_analyzerMode.greyBackground);
				p_editorCore.setState(x, y, state);
				if (state == WALLGRID.CLOSED) { 
					p_editorCore.set(drawnGridId, x, y, null); 
				}
			}}
		}
	}
}

