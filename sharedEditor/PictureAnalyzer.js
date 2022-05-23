const xSlashesForAnalysis = [0.1, 0.3, 0.5, 0.7, 0.9,  0.1, 0.3, 0.5, 0.7, 0.9];
const ySlashesForAnalysis = [0.1, 0.1, 0.3, 0.3, 0.5,  0.5, 0.7, 0.7, 0.9, 0.9];
const xSlashesForAnalysisInner = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,  0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,  0.5];
const ySlashesForAnalysisInner = [0.4, 0.5, 0.6, 0.7, 0.8, 0.2, 0.3,  0.6, 0.7, 0.8, 0.2, 0.3, 0.4, 0.5,  0.5];

function Colour(p_r, p_g, p_b) {
	return {r : p_r, g : p_g, b : p_b} // Should be 0 to 255
}

function pixelToString(p_pixel) {
	return (p_pixel.r + "," + p_pixel.g + "," + p_pixel.b);
}

function colourDiff(p_colour1, p_colour2) {
	return Math.abs(p_colour1.r - p_colour2.r) + Math.abs(p_colour1.g - p_colour2.g) +Math.abs(p_colour1.b - p_colour2.b);
}

function whitenessOn765(p_pixel) {
	return p_pixel.r + p_pixel.g + p_pixel.b;
}

PictureAnalyzer = function(p_xLength, p_yLength, p_pixData, p_pixWidth, p_pixHeight) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.imagesData = p_pixData;
	this.pixWidth = p_pixWidth;
	this.pixHeight = p_pixHeight; // Note : deductible from imagesData and pixWidth
	this.pix = {
		x : {			
			sideSpace : this.pixWidth / p_xLength // Note : floating
		},
		y : {			
			sideSpace : this.pixHeight / p_yLength
		}
	}
}

PictureAnalyzer.prototype.getPixel = function(p_pixX, p_pixY) {
	const indexInDataPixels = (p_pixY * this.pixWidth + p_pixX)*4;
	return new Colour(this.imagesData[indexInDataPixels], this.imagesData[indexInDataPixels+1], this.imagesData[indexInDataPixels+2]);
}

PictureAnalyzer.prototype.getPixelSafe = function(p_pixX, p_pixY) {
	if (p_pixX < this.pixWidth && p_pixX >= 0 && p_pixY < this.pixHeight && p_pixY >= 0) {		
		const indexInDataPixels = (p_pixY * this.pixWidth + p_pixX)*4;
		return new Colour(this.imagesData[indexInDataPixels], this.imagesData[indexInDataPixels+1], this.imagesData[indexInDataPixels+2]);
	} else {
		return null;
	}
}

// Analyze a bold horizontal or vertical wall (for all puzzles with regions) 
PictureAnalyzer.prototype.analyzeWallR = function(p_x, p_y) {
	return this.analyzeWallPrivate(p_x, p_y, 1, 0.5, 1, 0);
}

PictureAnalyzer.prototype.analyzeWallD = function(p_x, p_y) {
	return this.analyzeWallPrivate(p_x, p_y, 0.5, 1, 0, 1);
}


PictureAnalyzer.prototype.analyzeWallPrivate = function(p_x, p_y, p_xOffsetWall, p_yOffsetWall, p_xActivated, p_yActivated, p_analyzerMode) {
	var pixel;
	const lookAround = 2;
	const whiteThreshold = 0.6; // Note : arbitrary
	// x and y positions on the field
	const pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + p_xOffsetWall));
	const pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + p_yOffsetWall));
	totalWhiteness = 0;
	for (var i = -lookAround ; i <= +lookAround; i++) {
		totalWhiteness += whitenessOn765(this.getPixel(pixCenterX + i*p_xActivated, pixCenterY + i*p_yActivated));
	}
	if (totalWhiteness < (lookAround*2+1)*3*255*whiteThreshold) {
		return WALLGRID.CLOSED;
	} else {
		return WALLGRID.OPEN;		
	}
}

// Analyze a link between two dots in a dotted grid (Grand tour only ?)
PictureAnalyzer.prototype.analyzeEdgeR = function(p_x, p_y) {
	return this.analyzeEdgePrivate(p_x, p_y, 0, 0.5, 1, 0); 
}

PictureAnalyzer.prototype.analyzeEdgeD = function(p_x, p_y) {
	return this.analyzeEdgePrivate(p_x, p_y, 0.5, 0, 0, 1);

}

PictureAnalyzer.prototype.analyzeEdgePrivate = function(p_x, p_y, p_xOffsetWall, p_yOffsetWall, p_xActivated, p_yActivated, p_analyzerMode) {
	var pixel;
	const lookAround = 4;
	const whiteThreshold = 0.6; // Note : arbitrary
	// x and y positions on the field
	const pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + p_xOffsetWall));
	const pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + p_yOffsetWall));
	var totalWhiteness = 0;
	var count = 0;
	for (var i = -lookAround ; i <= +lookAround; i++) {
		pixel = this.getPixelSafe(pixCenterX + i*p_xActivated, pixCenterY + i*p_yActivated);
		if (pixel != null && colourDiff(new Colour(51, 51, 255), pixel) < 80) {
			return WALLGRID.CLOSED;
		}
	}
	return WALLGRID.OPEN;		
}


// Analyze a round white or black in a dotted grid
PictureAnalyzer.prototype.analyzeRoundWhiteBlackInDottedGrid = function(p_x, p_y) {
	var pixel;
	const pixHorizRun = 15;
	const pixVerticalDist = 8;
	// x and y positions on the field
	const pixCenterX = Math.floor(this.pix.x.sideSpace*p_x);
	const pixCenterY = Math.floor(this.pix.y.sideSpace*p_y);
	var colour = this.getColourInLine(pixCenterX, pixCenterY+pixVerticalDist, +1, pixHorizRun);
	if (colour != null) { return colour; }
	colour = this.getColourInLine(pixCenterX, pixCenterY+pixVerticalDist, -1, pixHorizRun);
	if (colour != null) { return colour; }
	colour = this.getColourInLine(pixCenterX, pixCenterY-pixVerticalDist, +1, pixHorizRun);
	if (colour != null) { return colour; }
	return this.getColourInLine(pixCenterX, pixCenterY-pixVerticalDist, -1, pixHorizRun);
}

// Note : very sub-optimized, but it's supposed to work
PictureAnalyzer.prototype.getColourInLine = function(p_pixStartX, p_pixStartY, p_goingX, p_pixLimit) {
	var x = p_pixStartX;
	pixel = this.getPixelSafe(x, p_pixStartY);
	if (pixel != null && whitenessOn765(pixel) < 80) {
		return SYMBOL_ID.BLACK;	
	}
	for (var i = 1 ; i <= p_pixLimit ; i++) {
		x += p_goingX; // Note : x = 1.
		pixel = this.getPixelSafe(x, p_pixStartY);
		if (pixel != null && whitenessOn765(pixel) < 80) {
			return SYMBOL_ID.WHITE;	
		}
	}
	return null;
}

// Uniformally analyze a space
PictureAnalyzer.prototype.analyzeStateSpace = function(p_x, p_y, p_hasGreyBackground) {
	const whiteThreshold = p_hasGreyBackground ? 0.5 : 0.9; 
	var pixX, pixY, pixel;
	for (var i = 0 ; i < xSlashesForAnalysis.length ; i++) {
		pixX = Math.floor(this.pix.x.sideSpace*(p_x + xSlashesForAnalysis[i]));
		pixY = Math.floor(this.pix.y.sideSpace*(p_y + ySlashesForAnalysis[i]));
		pixel = this.getPixel(pixX, pixY);
		if (whitenessOn765(pixel) >= 3*255*whiteThreshold) {
			return WALLGRID.OPEN;
		} 		
	}
	return WALLGRID.CLOSED;		
}


// Only analyzes the center of a space and returns a symbol that could match accordingly
PictureAnalyzer.prototype.analyzeCenterSpace = function(p_x, p_y, p_possibleColours, p_matchingSymbols) {
	const pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + 0.5));
	const pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + 0.5));
	pixel = this.getPixel(pixCenterX, pixCenterY);
	var result = null;
	var i = 0;
	var tolerance = 32; // Delta of diffs r, g, b.
	while (result == null && i < p_possibleColours.length) {
		if (colourDiff(p_possibleColours[i], pixel) < tolerance) {
			result = p_matchingSymbols[i];
		}
		i++;
	}
	return result;
}

PictureAnalyzer.prototype.analyzeMoonsun = function(p_x, p_y) {
	return this.analyzeCenterSpace(p_x, p_y, [new Colour(255, 255, 170), new Colour(170, 170, 170)], [SYMBOL_ID.SUN, SYMBOL_ID.MOON]);
}

PictureAnalyzer.prototype.analyzePlaystationShapes = function(p_x, p_y) {
	return this.analyzeCenterSpace(p_x, p_y, [new Colour(170, 0, 0), new Colour(0, 170, 0), new Colour(0, 0, 170)], [SYMBOL_ID.ROUND, SYMBOL_ID.SQUARE, SYMBOL_ID.TRIANGLE]);
}

PictureAnalyzer.prototype.analyzeYagitShapes = function(p_x, p_y) {
	return this.analyzeCenterSpace(p_x, p_y, [new Colour(136, 204, 136), new Colour(136, 136, 255)], [SYMBOL_ID.SQUARE, SYMBOL_ID.ROUND]);
}


// Only analyzes if a dot in the right-down corner of a space is black enough, in contrast of a grey grid
PictureAnalyzer.prototype.cornerRDBlackEnough = function(p_x, p_y) {
	const pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + 1));
	const pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + 1));
	pixel = this.getPixel(pixCenterX, pixCenterY);
	return (whitenessOn765(pixel) < 160);
}


// Analyzes if a space contains a pearl by entering from somewhere left up and going to the center
// Used by Masyu in grid and Curving road (for now) 
PictureAnalyzer.prototype.analyzePearlWhiteBlack = function(p_x, p_y) {
	var pixel;
	const lookAround = Math.floor(this.pix.x.sideSpace/2.2);
	const pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + 0.5));
	const pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + 0.5));
	pixel = this.getPixel(pixCenterX, pixCenterY);
	var totalBlackPix = 0;
	var goBlack = false;
	var goWhite = false;
	for (var i = -lookAround ; i <= 0; i++) {
		whiteness = whitenessOn765(this.getPixel(pixCenterX + i, pixCenterY + i));
		if (whiteness < 250) {
			goBlack = true;
		} else if (goBlack) {
			goWhite = true;
		}			
	}
	if (goWhite) {
		return SYMBOL_ID.WHITE;
	} else if (goBlack) {
		return SYMBOL_ID.BLACK;	
	} else {
		return null;	
	}
}

// Analyzes if a space is "rather white with some black" or the other way around.
// Returns a white or black symbol, not just a wildcard.
// Useful for Castle wall and a version of Shingoki.
PictureAnalyzer.prototype.analyzeSpaceWhiteBlack = function(p_x, p_y) {
	var pixel;
	const pixDrill = 5;
	const condOffset = (p_x == this.xLength-1) ? 0.1 : 0
	const pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + condOffset)+1);
	const pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y+0.5));
	pixel = this.getPixel(pixCenterX, pixCenterY);
	var totalBlackPix = 0;
	var goBlack = false;
	var goWhite = false;
	for (var pixI = 0 ; pixI <= pixDrill ; pixI++) {
		whiteness = whitenessOn765(this.getPixel(pixCenterX + pixI, pixCenterY));
		if (whiteness < 660) {
			goBlack = true;
		} else if (goBlack) {
			goWhite = true;
		}			
	}
	if (goWhite) {
		return SYMBOL_ID.WHITE;
	} else if (goBlack) {
		return SYMBOL_ID.BLACK;	
	} else {
		return null;	
	}
}


// Analyzes if a space is centered in grey or not. If not, returns a wildcard.
// Useful for puzzles where any space to have a state to be determined is grey and vice-versa.
PictureAnalyzer.prototype.analyzeSpaceGreyOrNot = function(p_x, p_y) {
	var tolerance = 32; // Delta of diffs r, g, b.
	var greyLvl = 204;
	for (var i = 0 ; i < xSlashesForAnalysisInner.length ; i++) {
		pixel = this.getPixel(
			Math.floor(this.pix.x.sideSpace * (p_x + xSlashesForAnalysisInner[i])), 
			Math.floor(this.pix.y.sideSpace * (p_y + ySlashesForAnalysisInner[i])) 
		);
		if (colourDiff(new Colour(greyLvl, greyLvl, greyLvl), pixel) > tolerance) {
			return WILDCARD_CHARACTER;
		}
	}
	return null;
}

// Analyzes if a space has a dark background.
// Useful for relevant puzzles (Akari, Shakashaka)...
PictureAnalyzer.prototype.analyzeFromBlack = function(p_x, p_y) {
	const pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + 0.2));
	const pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + 0.2));
	whiteness = whitenessOn765(this.getPixel(pixCenterX, pixCenterY));
	if (whiteness < 200) {
		return WILDCARD_CHARACTER;
	} else {
		return null;
	}
}

// Puzzles with some indications
PictureAnalyzer.prototype.analyzeSpaceDigitOnWhite = function(p_x, p_y) {
	var pixCenterX, pixCenterY;
	for (var pixI = 0.3 ; pixI <= 0.7 ; pixI+=0.05) {		
		pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + pixI));
		pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + pixI));
		if (whitenessOn765(this.getPixel(pixCenterX, pixCenterY)) < 600) {
			return WILDCARD_CHARACTER;
		} 
	}
	return null;
}

PictureAnalyzer.prototype.analyzeSpaceDigitOnWhiteAccurate = function(p_x, p_y) {
	var pixCenterX, pixCenterY;
	for (var pixI = 0.2 ; pixI <= 0.8 ; pixI+=0.05) {		
		pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + pixI));
		pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + pixI));
		if (whitenessOn765(this.getPixel(pixCenterX, pixCenterY)) < 600) {
			return WILDCARD_CHARACTER;
		} 
	}
	return null;
}

// Note : looks a lot like the above method, except it has walls... and we are forced to start at 0.3 because of blurring.
PictureAnalyzer.prototype.analyzeSpaceLeftUpWalled = function(p_x, p_y) { 
	return this.analyzeSpaceLeftUpWalledPrivate(p_x, p_y, 700);
}

PictureAnalyzer.prototype.analyzeSpaceSudokuGrid = function(p_x, p_y) { 
	return this.analyzeSpaceLeftUpWalledPrivate(p_x, p_y, 556);
}

PictureAnalyzer.prototype.analyzeSpaceLeftUpWalledPrivate = function(p_x, p_y, p_tolerance765) {
	var pixCenterX, pixCenterY;
	var hasBlack = false;
	var hasWhite = false;
	for (var pixI = 0.3 ; pixI <= 0.6 ; pixI+=0.05) {		
		pixCenterX = Math.floor(this.pix.x.sideSpace*(p_x + pixI));
		pixCenterY = Math.floor(this.pix.y.sideSpace*(p_y + 0.3));
		if (whitenessOn765(this.getPixel(pixCenterX, pixCenterY)) < p_tolerance765) {
			hasBlack = true;
		} else {
			hasWhite = true;
		}
		if (hasBlack && hasWhite) {
			return WILDCARD_CHARACTER;
		}
	}
	return null;
}

PictureAnalyzer.prototype.hasGreyCenter = function(p_x, p_y) { 
	return this.hasGreyGalaxyPrivate(p_x + 0.5, p_y + 0.5);
}

PictureAnalyzer.prototype.hasGreyD = function(p_x, p_y) { 
	return this.hasGreyGalaxyPrivate(p_x + 0.5, p_y + 1);
}

PictureAnalyzer.prototype.hasGreyR = function(p_x, p_y) { 
	return this.hasGreyGalaxyPrivate(p_x + 1, p_y + 0.5);
}

PictureAnalyzer.prototype.hasGreyRD = function(p_x, p_y) { 
	return this.hasGreyGalaxyPrivate(p_x + 1, p_y + 1);
}

// Galaxy with grey dots
// Try to center a grid dot
PictureAnalyzer.prototype.hasGreyGalaxyPrivate = function(p_xPos, p_yPos) {
	const pixCenterX = Math.floor(this.pix.x.sideSpace*p_xPos);
	const pixCenterY = Math.floor(this.pix.y.sideSpace*p_yPos);
	for (var i = -2 ; i <= 2 ; i++) {
		if (whitenessOn765(this.getPixel(pixCenterX+i, pixCenterY+i)) >= 700) {
			return false
		}
	}
	return true;
}

PictureAnalyzer.prototype.hasPearlGalaxyCenter = function(p_x, p_y) { 
	return this.hasPearlGalaxyPrivate(p_x + 0.5, p_y + 0.5);
}

PictureAnalyzer.prototype.hasPearlGalaxyD = function(p_x, p_y) { 
	return this.hasPearlGalaxyPrivate(p_x + 0.5, p_y + 1);
}

PictureAnalyzer.prototype.hasPearlGalaxyR = function(p_x, p_y) { 
	return this.hasPearlGalaxyPrivate(p_x + 1, p_y + 0.5);
}

PictureAnalyzer.prototype.hasPearlGalaxyRD = function(p_x, p_y) { 
	return this.hasPearlGalaxyPrivate(p_x + 1, p_y + 1);
}

// Galaxy with white pearl dots.
// Starts with a (3, 3) offset from the center because corners might be black
PictureAnalyzer.prototype.hasPearlGalaxyPrivate = function(p_xPos, p_yPos) {
	const pixCenterX = Math.floor(this.pix.x.sideSpace*p_xPos);
	const pixCenterY = Math.floor(this.pix.y.sideSpace*p_yPos);
	for (var i = 3 ; i <= 7 ; i++) {
		if (whitenessOn765(this.getPixel(pixCenterX+i, pixCenterY+i)) <= 200) {
			return true;
		}
	}
	return false;
}

PictureAnalyzer.prototype.analyzeSpaceSuramoru = function(p_xPos, p_yPos) {
	const pixLeftX = Math.floor(this.pix.x.sideSpace*(p_xPos+0.1));
	const pixUpY = Math.floor(this.pix.y.sideSpace*(p_yPos+0.1));
	const pixRightX = Math.floor(this.pix.x.sideSpace*(p_xPos+0.9));
	const pixDownY = Math.floor(this.pix.y.sideSpace*(p_yPos+0.9));	
	if ((whitenessOn765(this.getPixel(pixLeftX, pixUpY)) < 555) && 
		(whitenessOn765(this.getPixel(pixRightX, pixUpY)) < 555) && 
		(whitenessOn765(this.getPixel(pixLeftX, pixDownY)) < 555) && 
		(whitenessOn765(this.getPixel(pixRightX, pixDownY)) < 555)) {
		return SYMBOL_ID.X;
	} else {
		var whiteness;
		var countBlackV = 0;
		var countBlackH = 0;
		const pixMiddleX = Math.floor(this.pix.x.sideSpace * (p_xPos+0.5));
		const pixMiddleY = Math.floor(this.pix.y.sideSpace * (p_yPos+0.5));
		for (var i = 0.1 ; i <= 0.9 ; i+= 0.05) {
			whiteness = whitenessOn765(this.getPixel(pixMiddleX, Math.floor(this.pix.y.sideSpace*(p_yPos+i))));
			if (whiteness < 555) {
				countBlackV++;
			}
			whiteness = whitenessOn765(this.getPixel(Math.floor(this.pix.x.sideSpace*(p_xPos+i)), pixMiddleY));
			if (whiteness < 555) {
				countBlackH++;
			}
		}
		if (countBlackV >= 7) {
			if (countBlackH >= 7) {
				return SYMBOL_ID.START_POINT;
			} else {
				return SYMBOL_ID.VERTICAL_DOTS;
			}
		} else if (countBlackH >= 7) {
			return SYMBOL_ID.HORIZONTAL_DOTS;
		} else {
			return null;
		}
	}
}