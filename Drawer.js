// Constants
const DRAW_PATH = {
	OPEN : 1,
	CLOSED : 0,
	NONE : -1
}

// Classes
function alternateClosedPathDraw(p_wallGrid, p_colour) {
	this.wallGrid = p_wallGrid;
	this.colourRegionBorders = p_colour;
}

// Setup
function Drawer() {

    this.pix = {
        sideSpace: 30,
        borderSpace: 2, //Inner border
        borderClickDetection: 0, //How many pixels from the side of a space can you click to trigger the border ?
        marginGrid: {
            left: 0,
            up: 0,
            right: 0,
            down: 0
        }
    }

	this.colors = {
		combinedArrowRingIndications : '#440000',
		tapaIndications : '#000044',
		marginText : '#440000'
	}
	this.wallColorSet = {
		closed_wall: '#222222',
		open_wall: '#dddddd',
		edge_walls: '#000000',
		bannedSpace: '#666666'
	}
	this.fenceColourSet = {
		closed_fence: '#222222',
		undecided_fence: '#cccccc',
		open_fence: '#eeeeff'
	}
	this.editorColorSet = { // No "setter function" for this
		selectedSpace: '#bbffcc',
		selectedCornerSpace : '#bbccff'
	}
	this.galaxiesColourSet = {
		inner : '#ffffdd',
		border : '#440000'
	}
}

Drawer.prototype.setWallColors = function(p_wallColorSet) {
	for (const [key, value] of Object.entries(p_wallColorSet)) {
		this.wallColorSet[key] = value;
	}
}

Drawer.prototype.setFenceColors = function(p_fenceColours) {
	for (const [key, value] of Object.entries(p_fenceColours)) {
		this.fenceColourSet[key] = value;
	}
}

//---------------------
// All draw functions are below

//---------------------
// Refresh

function clearDrawing(p_context) {
	p_context.clearRect(0, 0, 9999, 9999 ); // Note : this used to be (800, 500) but the size of the canvas eventually went over this limit...
}

//---------------------
// Drawing grids

wallRightToColorClosure = function(p_solver, p_wallGrid) {
	return function(p_x, p_y) {
		return p_solver.wallToColor(p_wallGrid.getWallR(p_x, p_y));
	}
}

wallDownToColorClosure = function(p_solver, p_wallGrid) {
	return function(p_x, p_y) {
		return p_solver.wallToColor(p_wallGrid.getWallD(p_x, p_y));
	}
}

pillarToColorClosure = function(p_solver, p_wallGrid) {
	return function(p_x, p_y) {
		if (p_wallGrid.getWallR(p_x, p_y) == WALLGRID.CLOSED || p_wallGrid.getWallD(p_x, p_y) == WALLGRID.CLOSED ||
			p_wallGrid.getWallR(p_x, p_y + 1) == WALLGRID.CLOSED || p_wallGrid.getWallD(p_x + 1, p_y) == WALLGRID.CLOSED) {
			return p_solver.wallToColor(WALLGRID.CLOSED);
		} else {
			return p_solver.wallToColor(WALLGRID.OPEN);
		}
	}
}

spaceToColorClosure = function(p_solver, p_wallGrid) {
	return function(p_x, p_y) {
		if (p_wallGrid.getState(p_x, p_y) == WALLGRID.CLOSED) {
            return p_solver.wallColorSet.bannedSpace;
		}
		return null;
	}
}

fenceRightToColorClosure = function(p_solver, p_fenceMethodRight) {
	return function(p_x, p_y) {
		return p_solver.fenceToColor(p_fenceMethodRight(p_x, p_y));
	}
}

fenceDownToColorClosure = function(p_solver, p_fenceMethodDown) {
	return function(p_x, p_y) {
		return p_solver.fenceToColor(p_fenceMethodDown(p_x, p_y));
	}
}

pillarToColorFenceClosure = function(p_solver, p_fenceMethodRight, p_fenceMethodDown) {
	return function(p_x, p_y) {
		if (p_fenceMethodRight(p_x, p_y) == FENCE_STATE.CLOSED || p_fenceMethodDown(p_x, p_y) == FENCE_STATE.CLOSED ||
			p_fenceMethodRight(p_x, p_y + 1) == FENCE_STATE.CLOSED || p_fenceMethodDown(p_x + 1, p_y) == FENCE_STATE.CLOSED) {
			return p_solver.fenceToColor(FENCE_STATE.CLOSED);
		} else {
			if (p_fenceMethodRight(p_x, p_y) == FENCE_STATE.OPEN || p_fenceMethodDown(p_x, p_y) == FENCE_STATE.OPEN ||
			p_fenceMethodRight(p_x, p_y + 1) == FENCE_STATE.OPEN || p_fenceMethodDown(p_x + 1, p_y) == FENCE_STATE.OPEN) {
				return p_solver.fenceToColor(FENCE_STATE.OPEN);
			} else {
				return p_solver.fenceToColor(FENCE_STATE.UNDECIDED);
			}
		}
	}
}

Drawer.prototype.drawWallGrid = function (p_context, p_wallGrid, p_xLength, p_yLength) {
	this.drawGridPuzzle(p_context, p_xLength, p_yLength, 
	wallRightToColorClosure(this, p_wallGrid), wallDownToColorClosure(this, p_wallGrid), 
	pillarToColorClosure(this, p_wallGrid), spaceToColorClosure(this, p_wallGrid))
}

Drawer.prototype.drawFenceArray = function (p_context, p_xLength, p_yLength, p_fenceMethodRight, p_fenceMethodDown) {
	this.drawGridPuzzle(p_context, p_xLength, p_yLength, 
	fenceRightToColorClosure(this, p_fenceMethodRight), fenceDownToColorClosure(this, p_fenceMethodDown), 
	pillarToColorFenceClosure(this, p_fenceMethodRight, p_fenceMethodDown), null);
}

Drawer.prototype.drawGridPuzzle = function (p_context, p_xLength, p_yLength, p_colorMethodRight, p_colorMethodDown, p_colorMethodPillar, p_colorMethodSpace) {
	var ix,
    iy,
    indexRegion;
	clearDrawing(p_context);
	
    //Upper-left pixel of the horizontal walls (Horiz) and vertical walls (Vert) ; pillars aren't part of walls (meeting of 4 walls)
    const pixStartXVert = this.pix.marginGrid.left + this.pix.sideSpace - this.pix.borderSpace;
    const pixStartXHoriz = this.pix.marginGrid.left + this.pix.borderSpace;
    var pixDrawXHoriz = pixStartXHoriz;
    var pixDrawYHoriz = this.pix.marginGrid.up + this.pix.sideSpace - this.pix.borderSpace;
    var pixDrawXVert = pixStartXVert;
    var pixDrawYVert = this.pix.marginGrid.up + this.pix.borderSpace;
    var innerSpaceNotColored;
	var filling;

    //Rectangle dimensions
    const pixLength = this.pix.sideSpace - 2 * this.pix.borderSpace;
    const pixThickness = 2 * this.pix.borderSpace;

    //Go !
    for (iy = 0; iy < p_yLength; iy++) {
        for (ix = 0; ix < p_xLength; ix++) {
            //Draw down wall
            if (iy <= p_yLength - 2) {
                p_context.fillStyle = p_colorMethodDown(ix, iy);
                p_context.fillRect(pixDrawXHoriz, pixDrawYHoriz, pixLength, pixThickness);
            }
            //Draw right wall
            if (ix <= p_xLength - 2) {
                p_context.fillStyle = p_colorMethodRight(ix, iy);
                p_context.fillRect(pixDrawXVert, pixDrawYVert, pixThickness, pixLength);
            }
            //Draw pillar
            if ((ix <= p_xLength - 2) && (iy <= p_yLength - 2)) {
				if (p_colorMethodPillar && (p_colorMethodPillar != null)) {
					p_context.fillStyle = p_colorMethodPillar(ix, iy);
				} else {
					p_context.fillStyle = this.wallToColor(WALLGRID.CLOSED);
				}
				p_context.fillRect(pixDrawXVert, pixDrawYHoriz, pixThickness, pixThickness);
            }
            //Draw inside space
			if (p_colorMethodSpace && (p_colorMethodSpace != null)) {
				filling = p_colorMethodSpace(ix, iy);
				if (filling != null) { // Note : looks like we can't set p_context.fillStyle to null (it doesn't change the previous value)
					p_context.fillStyle = filling;
					p_context.fillRect(pixDrawXHoriz, pixDrawYVert, pixLength, pixLength);
				}
            }
            pixDrawXHoriz += this.pix.sideSpace;
            pixDrawXVert += this.pix.sideSpace;
        }
        pixDrawYHoriz += this.pix.sideSpace;
        pixDrawYVert += this.pix.sideSpace;
        pixDrawXHoriz = pixStartXHoriz;
        pixDrawXVert = pixStartXVert;
    }

    //Draws the borders
    const pixTotalWidth = p_xLength * this.pix.sideSpace;
    const pixTotalHeight = p_yLength * this.pix.sideSpace;
    p_context.fillStyle = this.wallColorSet.edge_walls;
    p_context.fillRect(this.pix.marginGrid.left, this.pix.marginGrid.up, this.pix.borderSpace, pixTotalHeight);
    p_context.fillRect(this.pix.marginGrid.left, this.pix.marginGrid.up, pixTotalWidth, this.pix.borderSpace);
    p_context.fillRect(this.pix.marginGrid.left + pixTotalWidth - this.pix.borderSpace, this.pix.marginGrid.up,
        this.pix.borderSpace, pixTotalHeight);
    p_context.fillRect(this.pix.marginGrid.left, this.pix.marginGrid.up + pixTotalHeight - this.pix.borderSpace,
        pixTotalWidth, this.pix.borderSpace);
}

Drawer.prototype.drawCornersFrame = function(p_context, p_xLeft, p_yUp, p_width, p_height, p_colour, p_borders, p_corners) {
	const pixXLeft = this.getPixInnerXLeft(p_xLeft);
	const pixYUp = this.getPixInnerYUp(p_yUp);
	const pixXRight = this.getPixInnerXRight(p_xLeft + p_width - 1);
	const pixYDown = this.getPixInnerYDown(p_yUp + p_height - 1);
	p_context.fillStyle = p_colour;
	if (p_borders) {
		const pixWidth = pixXRight - pixXLeft + 1;
		const pixHeight = pixYDown - pixYUp + 1;
		const pixThickness = 1;
		p_context.fillRect(pixXLeft, pixYUp, pixWidth, pixThickness);
		p_context.fillRect(pixXLeft, pixYUp, pixThickness, pixHeight);
		p_context.fillRect(pixXRight - pixThickness, pixYUp, pixThickness, pixHeight);
		p_context.fillRect(pixXLeft, pixYDown - pixThickness, pixWidth, pixThickness);
	}
	if (p_corners) {
		const pixExpansionAngle = this.pix.sideSpace;
		const pixThicknessAngle = 2;
		p_context.fillRect(pixXLeft, pixYUp, pixThicknessAngle, pixExpansionAngle);
		p_context.fillRect(pixXLeft, pixYUp, pixExpansionAngle, pixThicknessAngle);
		p_context.fillRect(pixXLeft, pixYDown - pixExpansionAngle, pixThicknessAngle, pixExpansionAngle);
		p_context.fillRect(pixXLeft, pixYDown - pixThicknessAngle, pixExpansionAngle, pixThicknessAngle);
		p_context.fillRect(pixXRight - pixExpansionAngle, pixYUp, pixExpansionAngle, pixThicknessAngle);
		p_context.fillRect(pixXRight - pixThicknessAngle, pixYUp, pixThicknessAngle, pixExpansionAngle);
		p_context.fillRect(pixXRight - pixExpansionAngle, pixYDown - pixThicknessAngle, pixExpansionAngle, pixThicknessAngle);
		p_context.fillRect(pixXRight - pixThicknessAngle, pixYDown - pixExpansionAngle, pixThicknessAngle, pixExpansionAngle);		
	}
}

// Draws paths  (or junctions) between spaces out of functions
// Note : warning, redundancy with "X" spaces that are closed by their four sides ! Take that into account when refactoring with loop drawing !
Drawer.prototype.drawClosablePaths = function (p_context, p_drawHorizPathsMethod, p_drawVertPathsMethod, p_xLength, p_yLength, p_colourOpen, p_colourClosed, p_wallArrayAlternateSet) { 
    const shorter = this.pix.sideSpace/4; //this.pix.pathThickness;
    const longer = shorter + this.pix.sideSpace;
    const pixLeftStart = this.getPixCenterX(0) - shorter / 2;
    var pixLeft = pixLeftStart;
    var pixUp = this.getPixCenterY(0) - shorter / 2;
    for (var iy = 0; iy < p_yLength; iy++) {
        for (var ix = 0; ix < p_xLength; ix++) {
            if (iy < (p_yLength-1)) {
				// Vertical wall down the spaces
				linkV = p_drawVertPathsMethod(ix, iy);
				if (linkV == DRAW_PATH.OPEN) {
					p_context.fillStyle = p_colourOpen;
					p_context.fillRect(pixLeft, pixUp, shorter, longer);
				} else if (linkV == DRAW_PATH.CLOSED) {
					if (p_wallArrayAlternateSet && p_wallArrayAlternateSet.wallGrid.getWallD(ix, iy) == WALLGRID.CLOSED) {
						p_context.fillStyle = p_wallArrayAlternateSet.colourRegionBorders;
					} else {
						p_context.fillStyle = p_colourClosed;
					}
					p_context.fillRect(this.getPixInnerXLeft(ix), this.getPixYDown(iy), this.getPixInnerSide(), 2);
				}
            }
            if (ix < (p_xLength-1)) {
				// Horizontal wall right the spaces
				linkH = p_drawHorizPathsMethod(ix, iy);
				if (linkH == DRAW_PATH.OPEN) {
					p_context.fillStyle = p_colourOpen;
					p_context.fillRect(pixLeft, pixUp, longer, shorter);
				} else if (linkH == DRAW_PATH.CLOSED) {
					if (p_wallArrayAlternateSet && p_wallArrayAlternateSet.wallGrid.getWallR(ix, iy) == WALLGRID.CLOSED) {
						p_context.fillStyle = p_wallArrayAlternateSet.colourRegionBorders;
					} else {
						p_context.fillStyle = p_colourClosed;
					}
					p_context.fillRect(this.getPixXRight(ix), this.getPixInnerYUp(iy), 2, this.getPixInnerSide());
				}
            }
            pixLeft += this.pix.sideSpace;
        }
        pixLeft = pixLeftStart;
        pixUp += this.pix.sideSpace;
    }
}

// Now for grids that don't need specific drawings between two spaces, albeit potentially between two rows

Drawer.prototype.drawEmptyGrid = function (p_context, p_xLength, p_yLength) {
	this.drawQuadrillageGrid(p_context, p_xLength, p_yLength);
}

// Some separation between columns being bigger
// Note : replaced by a good ol' drawWallGrid right now
/*Drawer.prototype.drawSudokuRectanglesGrid = function (p_context, p_xLength, p_yLength, p_rightToColumnIndexes, p_downToColumIndexes) { // Not a private method unlike the called one !
	this.drawQuadrillageGrid(p_context, p_xLength, p_yLength, p_rightToColumnIndexes, p_downToColumIndexes);
}*/

Drawer.prototype.drawQuadrillageGrid = function (p_context, p_xLength, p_yLength, p_rightToColumnIndexes, p_downToRowIndexes) { // Private method 
    var i;
	clearDrawing(p_context);
    const pixTotalWidth = p_xLength * this.pix.sideSpace;
    const pixTotalHeight = p_yLength * this.pix.sideSpace;
    var pixXStart = this.pix.marginGrid.left;
    var pixYStart = this.pix.marginGrid.up;
    var pixY = pixYStart - this.pix.borderSpace;
    const pixInsideThickness = 2 * this.pix.borderSpace;
    const pixInnerLength = this.getPixInnerSide();
    p_context.fillStyle = this.wallColorSet.open_wall;
    for (i = 0; i < p_yLength; i++) {
        pixY += this.pix.sideSpace;
        p_context.fillRect(pixXStart, pixY, pixTotalWidth, pixInsideThickness); // Some will be overdrawn but that's it !
    }
    var pixX = pixXStart - this.pix.borderSpace;
    for (i = 0; i < p_xLength; i++) {
        pixX += this.pix.sideSpace;
        p_context.fillRect(pixX, pixYStart, pixInsideThickness, pixTotalHeight);
    }
	
	p_context.fillStyle = this.wallColorSet.closed_wall;
	if (p_rightToColumnIndexes) {
		const pixXOffset = pixXStart + this.pix.sideSpace - this.pix.borderSpace; // pix.sidespace counted once in this offset constant ! We could have multiplied pix.sidespace by (index+1) otherwise.
		p_rightToColumnIndexes.forEach(indexRtoC => {
			 p_context.fillRect(pixXOffset + indexRtoC * this.pix.sideSpace, pixYStart, pixInsideThickness, pixTotalHeight);
		});
	}
	if (p_downToRowIndexes) {		
		const pixYOffset = pixYStart + this.pix.sideSpace - this.pix.borderSpace;
		p_downToRowIndexes.forEach(indexDtoR => {
			 p_context.fillRect(pixXStart, pixYOffset + indexDtoR * this.pix.sideSpace, pixTotalWidth, pixInsideThickness);
		});
	}
	
	// All four walls on the edge
    p_context.fillStyle = this.wallColorSet.edge_walls;
    p_context.fillRect(pixXStart, pixYStart, pixTotalWidth, this.pix.borderSpace);
    p_context.fillRect(pixXStart, pixYStart, this.pix.borderSpace, pixTotalHeight);
    p_context.fillRect(pixXStart, pixY, pixTotalWidth, this.pix.borderSpace);
    p_context.fillRect(pixX, pixYStart, this.pix.borderSpace, pixTotalHeight);
}

// -----------------
// Drawing values inside the grid

/**
Draws the main content of a space into a grid.
(It is used mainly for solver as the space is supposed to be colorized, to have an image into it...)

p_drawableItems : array of items to draw.
p_function : function to return the index.
 */
Drawer.prototype.drawSpaceContents = function (p_context, p_drawableItems, p_function, p_xLength, p_yLength) {
    const pixStartX = this.getPixInnerXLeft(0);
    const pixInnerSide = this.getPixInnerSide();
    var pixDrawX = pixStartX;
    var pixDrawY = this.getPixInnerYUp(0);
    var item;
    var ix,
    iy,
    indexItem;
    for (iy = 0; iy < p_yLength; iy++) {
        for (ix = 0; ix < p_xLength; ix++) {
            indexItem = p_function(ix, iy);
            if (indexItem >= 0 && indexItem < p_drawableItems.length) {
                item = p_drawableItems[indexItem];
                if (item.kind == KIND_DRAWABLE_ITEM.IMAGE) {
                    p_context.drawImage(item.picture, item.x1, item.y1, item.x2, item.y2, pixDrawX, pixDrawY, pixInnerSide, pixInnerSide);
                } else if (item.kind == KIND_DRAWABLE_ITEM.COLOR) {
                    p_context.fillStyle = item.getColour();
                    p_context.fillRect(pixDrawX, pixDrawY, pixInnerSide, pixInnerSide);
                } else if (item.kind == KIND_DRAWABLE_ITEM.CIRCLE) {
					p_context.beginPath();
					p_context.lineWidth = (item.thickness || item.thickness == 0) ? item.thickness : Math.max(1, this.getPixInnerSide()*1/16);
					const radius = this.getPixInnerSide()*1/3;
					p_context.ellipse(this.getPixCenterX(ix), this.getPixCenterY(iy), radius, radius, 0, 0, 2 * Math.PI);
					if (item.colorInner && item.colorInner != null) { // Note : "p_context.fillStyle = X" seems not to change p_context.fillStyle when X is null.
						p_context.fillStyle = item.colorInner; //An item property was taken rather than a method. I think this is better this way.
						p_context.fill();
					}
					if (item.colorBorder && item.colorBorder != null) {
						p_context.strokeStyle = item.colorBorder;
						p_context.stroke();
					}
				} else if (item.kind == KIND_DRAWABLE_ITEM.X) {
					this.drawCrossX(p_context, ix, iy, item);
				} else if (item.kind == KIND_DRAWABLE_ITEM.LITTLE_X) {
					this.drawCrossLittleX(p_context, ix, iy, item);
				} else if (item.kind == KIND_DRAWABLE_ITEM.SQUARE) {
					this.drawSquare(p_context, ix, iy, item);
				} else if (item.kind == KIND_DRAWABLE_ITEM.TRIANGLE) {
					this.drawTriangle(p_context, ix, iy, item);
				} 
            }
            pixDrawX += this.pix.sideSpace;
        }
        pixDrawY += this.pix.sideSpace;
        pixDrawX = pixStartX;
    }
}

Drawer.prototype.drawSpaceContentsUpperRightCorner = function(p_context, p_drawableItems, p_function, p_xLength, p_yLength) {
	for (iy = 0; iy < p_yLength; iy++) {
		for (ix = 0; ix < p_xLength; ix++) {
			indexItem = p_function(ix, iy);
			if (indexItem >= 0 && indexItem < p_drawableItems.length) {
				item = p_drawableItems[indexItem];
				if (item.kind == KIND_DRAWABLE_ITEM.CIRCLE_UPPER_RIGHT) {
					this.drawLittleRoundUpperRight(p_context, ix, iy, item);
				} else if (item.kind == KIND_DRAWABLE_ITEM.PLUS_UPPER_RIGHT) {
					this.drawLittlePlusUpperRight(p_context, ix, iy, item);
				}
			}
		}
	}
}

// Draw a polyomino according to a 4x5-tiled picture
Drawer.prototype.drawPolyomino4x5TiledMap = function (p_context, p_map, p_pixMapSide, p_function, p_number, p_xLength, p_yLength) {
    const pixStartX = this.pix.marginGrid.left;
    const pixSide = this.pix.sideSpace;
    const pixHalfSide = pixSide / 2;
    var upOn;
    var leftOn;
    var rightOn;
    var downOn;
    var pixOriginX = pixStartX;
    var pixOriginY = this.pix.marginGrid.up;
    var pixDrawX,
    pixDrawY;
    var coordinateXInMap,
    coordinateYInmap;
    const xBlockLeft = 0;
    const yBlockUp = 0;
    const xBlockRight = 3;
    const yBlockDown = 3;

    function xLeftContinue(p_continue) {
        return p_continue ? 2 : 0;
    }

    function yUpContinue(p_continue) {
        return p_continue ? 2 : 0;
    }

    function xRightContinue(p_continue) {
        return p_continue ? 1 : 3;
    }

    function yDownContinue(p_continue) {
        return p_continue ? 1 : 3;
    }

    function drawQuarter(x, y) {
        p_context.drawImage(p_map, coordinateXInMap * p_pixMapSide, coordinateYInMap * p_pixMapSide, p_pixMapSide, p_pixMapSide,
            pixOriginX + x * pixHalfSide, pixOriginY + y * pixHalfSide, pixHalfSide, pixHalfSide);
    }

    for (iy = 0; iy < p_yLength; iy++) {
        for (ix = 0; ix < p_xLength; ix++) {
            indexItem = p_function(ix, iy);
            if (indexItem == p_number) {
                upOn = (iy > 0 && (p_function(ix, iy - 1) == p_number));
                leftOn = (ix > 0 && (p_function(ix - 1, iy) == p_number));
                rightOn = (ix < p_xLength - 1 && (p_function(ix + 1, iy) == p_number));
                downOn = (iy < p_yLength - 1 && (p_function(ix, iy + 1) == p_number));
                xLeftContinue = leftOn ? 2 : 0;
                yUpContinue = upOn ? 2 : 0;
                xRightContinue = rightOn ? 1 : 3;
                yDownContinue = downOn ? 1 : 3
                    //LU corner
                    if (leftOn && upOn && (p_function(ix - 1, iy - 1) != p_number)) {
						coordinateXInMap = 4
						coordinateYInMap = 0;
                    } else {
						coordinateXInMap = xLeftContinue;
						coordinateYInMap = yUpContinue;
                    }
                    drawQuarter(0, 0);
                //RU corner
                if (rightOn && upOn && (p_function(ix + 1, iy - 1) != p_number)) {
					coordinateXInMap = 4
					coordinateYInMap = 1;
                } else {
                    coordinateXInMap = xRightContinue;
                    coordinateYInMap = yUpContinue;
                }
                drawQuarter(1, 0);
                //RD corner
                if (rightOn && downOn && (p_function(ix + 1, iy + 1) != p_number)) {
					coordinateXInMap = 4
					coordinateYInMap = 2;
                } else {
					coordinateXInMap = xRightContinue;
					coordinateYInMap = yDownContinue;
                }
                drawQuarter(1, 1);
                //LD corner
                if (leftOn && downOn && (p_function(ix - 1, iy + 1) != p_number)) {
					coordinateXInMap = 4
					coordinateYInMap = 3;
                } else {
					coordinateXInMap = xLeftContinue;
					coordinateYInMap = yDownContinue;
                }
                drawQuarter(0, 1);
            }
            pixOriginX += this.pix.sideSpace;
        }
        pixOriginY += this.pix.sideSpace;
        pixOriginX = pixStartX;
    }

}

// Combined arrow = Yajilin-like. This method is a better deal than reusing drawSpaceContents since it doesn't draw spaces.
Drawer.prototype.drawCombinedArrowGridIndications = function (p_context, p_combinedArrowGrid) {
	const yLength = p_combinedArrowGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_combinedArrowGrid.getXLength();
		var ix, iy, clue, isX; 
		const pixBack = this.getPixInnerSide()/4
		p_context.fillStyle = this.colors.combinedArrowRingIndications; 
		p_context.strokeStyle = this.colors.combinedArrowRingIndications; 
		p_context.textAlign = "center"; // Credits : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/textAlign
		p_context.textBaseline = "middle"; // Credits : https://stackoverflow.com/questions/39294065/vertical-alignment-of-canvas-text https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/textBaseline
		var pixX1, pixY1, pixX2, pixY2, pixX3, pixY3, pixTextX, pixTextY;
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {
				clue = p_combinedArrowGrid.get(ix, iy);
				//Credits on drawing polygon : https://stackoverflow.com/questions/4839993/how-to-draw-polygons-on-an-html5-canvas
				if (clue != null) {
					p_context.beginPath();
					switch (clue.charAt(0)) {
						case 'L': case 'R': 
							isX = false;
							pixY1 = this.getPixCenterY(iy);
							pixY2 = pixY1 - pixBack;
							pixY3 = pixY1 + pixBack;
							pixTextY = pixY1;
							if (clue.charAt(0) == 'L') {
								pixX1 = this.getPixInnerXLeft(ix) + 1;
								pixX2 = pixX1 + pixBack;
								pixX3 = pixX2;
								pixX3 = pixX2;
								pixTextX = (pixX2 + this.getPixInnerXRight(ix)) / 2;
							} else {
								pixX1 = this.getPixInnerXRight(ix) - 1;
								pixX2 = pixX1 - pixBack;
								pixX3 = pixX2;
								pixTextX = (pixX2 + this.getPixInnerXLeft(ix)) / 2;
							}
						break;
						case 'U': case 'D': 
							isX = false;
							pixX1 = this.getPixCenterX(ix);
							pixX2 = pixX1 - pixBack;
							pixX3 = pixX1 + pixBack;
							pixTextX = pixX1;
							if (clue.charAt(0) == 'U') {
								pixY1 = this.getPixInnerYUp(iy) + 1;
								pixY2 = pixY1 + pixBack;
								pixY3 = pixY2;
								pixTextY = (pixY2 + this.getPixInnerYDown(iy)) / 2;
							} else {
								pixY1 = this.getPixInnerYDown(iy) - 1;
								pixY2 = pixY1 - pixBack;
								pixY3 = pixY2;
								pixTextY = (pixY2 + this.getPixInnerYUp(iy)) / 2;
							}
						break;
						case 'X': {
							isX = true;
						}
					}
					if (isX) {
						this.drawCrossX(p_context, ix, iy, p_context.strokeStyle);
					} else {
						p_context.moveTo(pixX1, pixY1);
						p_context.lineTo(pixX2, pixY2);
						p_context.lineTo(pixX3, pixY3);
						p_context.lineTo(pixX1, pixY1);
						p_context.fillText(clue.substring(1), pixTextX, pixTextY);
						p_context.closePath();
						p_context.fill();
					}
				}
			}
		}
	}
}

function DrawSpaceValue(p_value, p_colour) {
	this.value = p_value;
	this.writeColour = p_colour;
}

Drawer.prototype.drawNumbersInsideStandard = function(p_context, p_function, p_xLength, p_yLength) {
	setupFont(p_context, this.getPixInnerSide(), "Arial");
	alignFontCenter(p_context);
	for(var iy = 0 ; iy < p_yLength ; iy++) {
		for(var ix = 0 ; ix < p_xLength ; ix++) {
			supposedValue = p_function(ix, iy);
			if (supposedValue != null) {
				p_context.fillStyle = supposedValue.writeColour;
				p_context.fillText(supposedValue.value, this.getPixCenterX(ix), this.getPixWriteCenterY(iy));
			} 
		}
	}
}

// -------------------------------
// Draw specific grid contents, used both in editor and solvers

// Tapa
Drawer.prototype.drawTapaGrid = function (p_context, p_tapaGrid) {
	const yLength = p_tapaGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_tapaGrid.getXLength();
		var ix, iy, tapaClue;
		const pixDeltaInnerX = 1/5*this.getPixInnerSide();
		const pixDeltaInnerY = 1/4*this.getPixInnerSide();
		p_context.fillStyle = this.colors.tapaIndications;
		alignFontCenter(p_context);
		p_context.fillStyle = "#000000";
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {
				tapaClue = p_tapaGrid.get(ix, iy);
				if (tapaClue != null) {
					if (tapaClue.length == 1) {
						setupFont(p_context, this.getPixInnerSide()*4/5, "Arial");
						pixArray = [{pixX : this.getPixCenterX(ix), pixY : this.getPixCenterY(iy)}];
					}
					if (tapaClue.length == 2) {
						setupFont(p_context, this.getPixInnerSide()*1/2, "Arial");
						pixArray = [{pixX : this.getPixCenterX(ix)-pixDeltaInnerX, pixY : this.getPixCenterY(iy)},
									{pixX : this.getPixCenterX(ix)+pixDeltaInnerX, pixY : this.getPixCenterY(iy)}];
					}
					if (tapaClue.length == 3) {
						setupFont(p_context, this.getPixInnerSide()*2/5, "Arial");
						pixArray = [{pixX : this.getPixCenterX(ix), pixY : this.getPixCenterY(iy)-pixDeltaInnerY},
									{pixX : this.getPixCenterX(ix)-pixDeltaInnerX, pixY : this.getPixCenterY(iy)+pixDeltaInnerY},
									{pixX : this.getPixCenterX(ix)+pixDeltaInnerX, pixY : this.getPixCenterY(iy)+pixDeltaInnerY}];
					}
					if (tapaClue.length == 4) {
						setupFont(p_context, this.getPixInnerSide()*2/5, "Arial");
						pixArray = [{pixX : this.getPixCenterX(ix)-pixDeltaInnerX, pixY : this.getPixCenterY(iy)-pixDeltaInnerY},
									{pixX : this.getPixCenterX(ix)+pixDeltaInnerX, pixY : this.getPixCenterY(iy)-pixDeltaInnerY},
									{pixX : this.getPixCenterX(ix)-pixDeltaInnerX, pixY : this.getPixCenterY(iy)+pixDeltaInnerY},
									{pixX : this.getPixCenterX(ix)+pixDeltaInnerX, pixY : this.getPixCenterY(iy)+pixDeltaInnerY}];
					}
					for(var i = 0 ; i < tapaClue.length ; i++) {
						pixCoors = pixArray[i];
						p_context.fillText(tapaClue.charAt(i), pixCoors.pixX, pixCoors.pixY);
					};
				}
			}
		}
	}
}

Drawer.prototype.drawGalaxiesGrid = function (p_context, p_galaxiesGrid) {
	const yLength = p_galaxiesGrid.getYLength();
	const xLength = p_galaxiesGrid.getXLength();
	var galaxiePosition, pixXCenter, pixYCenter;
	p_context.fillStyle = this.galaxiesColourSet.inner;
	p_context.strokeStyle = this.galaxiesColourSet.border;
	for (var y = 0 ; y < yLength ; y++) {
		for (var x = 0 ; x < xLength ; x++) {
			galaxiePosition = p_galaxiesGrid.get(x, y);
			pixXCenter = 0;
			switch(galaxiePosition) {
				case GALAXIES_POSITION.CENTER :
					pixXCenter = this.getPixCenterX(x);
					pixYCenter = this.getPixCenterY(y);
				break;
				case GALAXIES_POSITION.RIGHT :
					pixXCenter = this.getPixXRight(x);
					pixYCenter = this.getPixCenterY(y);
				break;
				case GALAXIES_POSITION.DOWN :
					pixXCenter = this.getPixCenterX(x);
					pixYCenter = this.getPixYDown(y);
				break;
				case GALAXIES_POSITION.RIGHT_DOWN :
					pixXCenter = this.getPixXRight(x);
					pixYCenter = this.getPixYDown(y);
				break;
			}
			if (pixXCenter != 0) {
				const radius = this.pix.sideSpace / 6;
				p_context.beginPath();
				p_context.ellipse(pixXCenter, pixYCenter, radius, radius, 0, 0, 2 * Math.PI);
				p_context.stroke();
				p_context.fill();
			}
		}
	}
}

Drawer.prototype.drawDiscGrid = function (p_context, p_discGrid, p_symbols, p_colorsStroke, p_colorsFill) {
	const yLength = p_discGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_discGrid.getXLength();
		var ix, iy, disc, i, found;
		const radius = this.getPixInnerSide()*1/3;
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {
				disc = p_discGrid.get(ix, iy);
				found = false;
				i = 0;
				while (!found && i < p_symbols.length) {
					if (disc == p_symbols[i]) {
						found = true;
						//Crédits : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/ellipse 
						p_context.beginPath();
						p_context.ellipse(this.getPixCenterX(ix), this.getPixCenterY(iy), radius, radius, 0, 0, 2 * Math.PI);
						if (p_colorsStroke[i] && p_colorsStroke[i] != null) {
							p_context.strokeStyle = p_colorsStroke[i];
							p_context.stroke();
						}
						if (p_colorsFill[i] && p_colorsFill[i] != null) {
							p_context.fillStyle = p_colorsFill[i];
							p_context.fill();
						}
					}
					i++;
				}
			}
		}
	}
}

// -----------------
// Drawing "one value per region" in the upper-left corner of the space

function DrawRegionArgument(p_x, p_y, p_value, p_colour) {
	this.x = p_x;
	this.y = p_y;
	this.value = p_value;
	this.writeColour = p_colour;
}

/**
Draws values in (presumably) first spaces of region in the same grid as where drawSpaceContents is used.
p_functionRegion : function that transforms an integer in 0 .. p_numberRegions-1 into an item containing properties {x, y, value, color}, or null
p_numberRegions : number of regions
p_police : police in which values are drawn.
*/ 
Drawer.prototype.drawRegionValues = function(p_context, p_functionRegion, p_numberRegions, p_police) {
	var pixLeft, pixDown;
	var valueToDraw;
	setupFont(p_context, this.getPixInnerSide() / 2, "Arial");
	alignFontLeft(p_context);
	for(var i=0 ; i < p_numberRegions ; i++) {
		valueToDraw = p_functionRegion(i);
		if (valueToDraw && valueToDraw != null) {
			pixLeft = this.getPixInnerXLeft(valueToDraw.x) + this.getPixInnerSide()*1/5; // TODO, soon it may have to be pushed more on the edges for loop puzzles (wait, only Country road is concerned)
			pixUp = this.getPixInnerYUp(valueToDraw.y) + this.getPixInnerSide()*1/5;
			p_context.fillStyle = valueToDraw.writeColour;
			p_context.fillText(valueToDraw.value, pixLeft, pixUp);
		}
	}
}

// -----------------
// Drawing one item per space

Drawer.prototype.fillSpace = function(p_context, p_xSpace, p_ySpace, p_item) {
	p_context.fillStyle = item.getColour();
	p_context.fillRect(pixDrawX, pixDrawY, pixInnerSide, pixInnerSide);
}

Drawer.prototype.drawCrossX = function(p_context, p_xSpace, p_ySpace, p_item) {
	this.drawCrossXInner(p_context, p_xSpace, p_ySpace, p_item, Math.floor(this.getPixInnerSide()/10));
}

Drawer.prototype.drawCrossLittleX = function(p_context, p_xSpace, p_ySpace, p_item) {
	this.drawCrossXInner(p_context, p_xSpace, p_ySpace, p_item,  Math.floor(this.getPixInnerSide()/2));
}

Drawer.prototype.drawCrossXInner = function(p_context, p_xSpace, p_ySpace, p_item, p_pixDistanceFromEdge) {
	p_context.beginPath();
	p_context.strokeStyle = p_item.color; 
	p_context.lineWidth = Math.max(Math.floor(this.getPixInnerSide()/10, 1));
	const pixLeft = this.getPixInnerXLeft(p_xSpace) + p_pixDistanceFromEdge;
	const pixRight = this.getPixInnerXRight(p_xSpace) - p_pixDistanceFromEdge;
	const pixUp = this.getPixInnerYUp(p_ySpace) + p_pixDistanceFromEdge;
	const pixDown = this.getPixInnerYDown(p_ySpace) - p_pixDistanceFromEdge;
	p_context.moveTo(pixLeft, pixUp);
	p_context.lineTo(pixRight, pixDown);
	p_context.moveTo(pixLeft, pixDown);
	p_context.lineTo(pixRight, pixUp);
	p_context.stroke(); // Credits : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/lineTo
}

Drawer.prototype.drawSquare = function(p_context, p_xSpace, p_ySpace, p_item) {
	p_context.beginPath();
	p_context.strokeStyle = p_item.colorBorder; 
	p_context.fillStyle = p_item.colorInner; 
	p_context.lineWidth = Math.max(Math.floor(this.getPixInnerSide()/10, 2));
	
	const pixAway = Math.floor(this.getPixInnerSide()/5);
	const pixLeft = this.getPixInnerXLeft(p_xSpace) + pixAway;
	const pixRight = this.getPixInnerXRight(p_xSpace) - pixAway;
	const pixUp = this.getPixInnerYUp(p_ySpace) + pixAway;
	const pixDown = this.getPixInnerYDown(p_ySpace) - pixAway;
	p_context.moveTo(pixLeft, pixUp);
	p_context.lineTo(pixRight, pixUp);
	p_context.lineTo(pixRight, pixDown);
	p_context.lineTo(pixLeft, pixDown);
	p_context.lineTo(pixLeft, pixUp);
	p_context.lineTo(pixRight, pixUp);
	if (p_item.colorBorder != null) {		
		p_context.stroke();
	}
	p_context.fill();
}

Drawer.prototype.drawTriangle = function(p_context, p_xSpace, p_ySpace, p_item) {
	p_context.beginPath();
	p_context.strokeStyle = p_item.colorBorder; 
	p_context.fillStyle = p_item.colorInner; 
	p_context.lineWidth = Math.max(Math.floor(this.getPixInnerSide()/10, 2));
	
	const pixAway = Math.floor(this.getPixInnerSide()/6);
	const pixLeft = this.getPixInnerXLeft(p_xSpace) + pixAway;
	const pixRight = this.getPixInnerXRight(p_xSpace) - pixAway;
	const pixMid = (pixLeft + pixRight) / 2;
	const pixUp = this.getPixInnerYUp(p_ySpace) + pixAway;
	const pixDown = this.getPixInnerYDown(p_ySpace) - pixAway;
	p_context.moveTo(pixMid , pixUp);
	p_context.lineTo(pixRight, pixDown);
	p_context.lineTo(pixLeft, pixDown);
	p_context.lineTo(pixMid, pixUp);
	if (p_item.colorBorder != null) {
		p_context.stroke();
	}
	p_context.fill();
}

// Draw li'l shapes

Drawer.prototype.drawLittleRoundUpperRight = function(p_context, p_xSpace, p_ySpace, p_item) {
	const radius = this.pix.sideSpace / 6;
	const pixXCenter = this.getPixXRight(p_xSpace) - 1 - radius;
	const pixYCenter = this.getPixYUp(p_ySpace) + 1 + radius;
	p_context.beginPath();
	p_context.ellipse(pixXCenter, pixYCenter, radius, radius, 0, 0, 2 * Math.PI);
	p_context.stroke();
}

Drawer.prototype.drawLittlePlusUpperRight = function(p_context, p_xSpace, p_ySpace, p_item) {
	p_context.beginPath();
	const radius = this.pix.sideSpace / 6;
	const pixXCenter = this.getPixXRight(p_xSpace) - 1 - radius;
	const pixYCenter = this.getPixYUp(p_ySpace) + 1 + radius;
	p_context.moveTo(pixXCenter, pixYCenter - radius);
	p_context.lineTo(pixXCenter, pixYCenter + radius);
	p_context.moveTo(pixXCenter - radius, pixYCenter);
	p_context.lineTo(pixXCenter + radius, pixYCenter);
	p_context.stroke();
}

// ------------------
// Drawing margins

// Draw margins with one info left and one up.
Drawer.prototype.drawMarginLeftUpOne = function(p_context, p_arrayMarginLeft, p_arrayMarginUp) {
	setupFont(p_context, this.getPixInnerSide(), "Arial", this.colors.marginText);	
	alignFontCenter(p_context);
	var x = this.pix.marginGrid.left + this.pix.sideSpace/2;
	const pixYStartUp = this.pix.marginGrid.up - this.pix.sideSpace/2;
	p_arrayMarginUp.forEach(val => {
		if (val != null) {
			p_context.fillText(val, x, pixYStartUp);
		}
		x += this.pix.sideSpace;
	});
	const pixXStartLeft = this.pix.marginGrid.left - this.pix.sideSpace/2;
	var y = this.pix.marginGrid.up + this.pix.sideSpace/2;
	p_arrayMarginLeft.forEach(val => {
		if (val != null) {			
			p_context.fillText(val, pixXStartLeft, y);
		}
		y += this.pix.sideSpace;
	});
}

//---------------------
// Gets the leftmost/upmost/rightmost/downmost pixels of the inner of a desired space ;
// May also get out of the bounds of the grid for, who knows, margin
Drawer.prototype.getPixInnerXLeft = function (p_xIndex) {
    return this.pix.marginGrid.left + p_xIndex * this.pix.sideSpace + this.pix.borderSpace;
}
Drawer.prototype.getPixInnerYUp = function (p_yIndex) {
    return this.pix.marginGrid.up + p_yIndex * this.pix.sideSpace + this.pix.borderSpace;
}
Drawer.prototype.getPixInnerXRight = function (p_xIndex) {
    return this.pix.marginGrid.left + (p_xIndex + 1) * this.pix.sideSpace - this.pix.borderSpace;
}
Drawer.prototype.getPixInnerYDown = function (p_yIndex) {
    return this.pix.marginGrid.up + (p_yIndex + 1) * this.pix.sideSpace - this.pix.borderSpace;
}
Drawer.prototype.getPixCenterX = function (p_xIndex) {
    return this.pix.marginGrid.up + (p_xIndex + 0.5) * this.pix.sideSpace;
}
Drawer.prototype.getPixCenterY = function (p_yIndex) {
    return this.pix.marginGrid.up + (p_yIndex + 0.5) * this.pix.sideSpace;
}
Drawer.prototype.getPixWriteCenterY = function (p_yIndex) {
    return this.pix.marginGrid.up + (p_yIndex + 0.55) * this.pix.sideSpace;
}
Drawer.prototype.getPixInnerSide = function () {
    return this.pix.sideSpace - 2 * this.pix.borderSpace;
}

// Gets the leftmost/upmost/rightmost/downmost pixel of a desired space
Drawer.prototype.getPixXLeft = function (p_xIndex) {
    return this.pix.marginGrid.left + p_xIndex * this.pix.sideSpace;
}
Drawer.prototype.getPixYUp = function (p_yIndex) {
    return this.pix.marginGrid.up + p_yIndex * this.pix.sideSpace;
}
Drawer.prototype.getPixXRight = function (p_xIndex) {
    return this.pix.marginGrid.left + (p_xIndex + 1) * this.pix.sideSpace - 1;
}
Drawer.prototype.getPixYDown = function (p_yIndex) {
    return this.pix.marginGrid.up + (p_yIndex + 1) * this.pix.sideSpace - 1;
}

//---------------------
// All input functions

//Return coordinates of an element with the form {x: ... , y: ...} (space, wall ; upper-left = 0,0)

/**
If a click is done on a space, otherwise return null
 */
Drawer.prototype.getClickSpace = function (event, p_canvas, p_xLength, p_yLength) {
    const indexX = Math.floor(this.getPixXWithinGrid(event, p_canvas) / this.pix.sideSpace);
    const indexY = Math.floor(this.getPixYWithinGrid(event, p_canvas) / this.pix.sideSpace);
    if (indexX < 0 || indexX >= p_xLength || indexY < 0 || indexY >= p_yLength) {
        return null;
    }
    return {
        x: indexX,
        y: indexY
    }
}

Drawer.prototype.getClickKnotRD = function (event, p_canvas, p_xLength, p_yLength) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const pixXModulo = (pixX + this.pix.borderClickDetection) % this.pix.sideSpace;
	const pixYModulo = (pixY + this.pix.borderClickDetection) % this.pix.sideSpace;
	if ((pixXModulo < 2 * this.pix.borderClickDetection) &&  (pixYModulo < 2 * this.pix.borderClickDetection)) {
		const answer = {
			x: Math.floor((pixX + this.pix.borderClickDetection) / this.pix.sideSpace) - 1,
			y: Math.floor((pixY + this.pix.borderClickDetection) / this.pix.sideSpace) - 1
		};
		if ((answer.x < (p_xLength - 1)) && (answer.x >= 0) && (answer.y < p_yLength) && (answer.y >= 0)) {
			return answer;
		}
	}
    return null;
}

/**
If a click is done when mouse is a right wall, returns the index of the corresponding space, otherwise return null
 */
Drawer.prototype.getClickWallR = function (event, p_canvas, p_xLength, p_yLength) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const pixXModulo = (pixX + this.pix.borderClickDetection) % this.pix.sideSpace;
	if (pixXModulo < 2 * this.pix.borderClickDetection) {
		const answer = {
			x: Math.floor((pixX + this.pix.borderClickDetection) / this.pix.sideSpace) - 1,
			y: Math.floor(pixY / this.pix.sideSpace)
		};
		if ((answer.x < (p_xLength - 1)) && (answer.x >= 0) && (answer.y < p_yLength) && (answer.y >= 0)) {
			return answer;
		}
	}
    return null;
}

/**
Same as above with down walls
 */
Drawer.prototype.getClickWallD = function (event, p_canvas, p_xLength, p_yLength) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const pixYModulo = (pixY + this.pix.borderClickDetection) % this.pix.sideSpace;
	if (pixYModulo < 2 * this.pix.borderClickDetection) {
		const answer = {
			x: Math.floor(pixX / this.pix.sideSpace),
			y: Math.floor((pixY + this.pix.borderClickDetection) / this.pix.sideSpace) - 1
		};
		if ((answer.y < (p_yLength - 1)) && (answer.y >= 0) && (answer.x < p_xLength) && (answer.x >= 0)) {
			return answer;
		}
	}
    return null;
}

Drawer.prototype.getClickAroundWallR = function (event, p_canvas, p_xLength, p_yLength) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const sideSpace = this.pix.sideSpace;
	var distanceX = pixX % sideSpace;
	distanceX = Math.min(distanceX, sideSpace - distanceX);
	var distanceY = pixY % sideSpace;
	distanceY = Math.min(distanceY, sideSpace - distanceY);
	if (distanceX < distanceY) {
		const answer = {
			x: Math.floor((pixX - sideSpace / 2) / sideSpace),
			y: Math.floor(pixY / sideSpace)
		}
		if ((answer.x < (p_xLength - 1)) && (answer.x >= 0) && (answer.y < p_yLength) && (answer.y >= 0)) {
			return answer;
		}
	}
    return null;
}

Drawer.prototype.getClickAroundWallD = function (event, p_canvas, p_xLength, p_yLength) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const sideSpace = this.pix.sideSpace;
	var distanceX = pixX % sideSpace;
	distanceX = Math.min(distanceX, sideSpace - distanceX);
	var distanceY = pixY % sideSpace;
	distanceY = Math.min(distanceY, sideSpace - distanceY);
	if (distanceX > distanceY) {
		const answer = {
			x: Math.floor(pixX / sideSpace),
			y: Math.floor((pixY - sideSpace / 2) / sideSpace)
		}
		if ((answer.y < (p_yLength - 1)) && (answer.y >= 0) && (answer.x < p_xLength) && (answer.x >= 0)) {
			return answer;	
		}
	}
    return null;
}

Drawer.prototype.getClickMargin = function (event, p_canvas, p_xLength, p_yLength, p_marginLeftLength, p_marginUpLength, p_marginRightLength, p_marginDownLength) {
	const pixX = this.getPixXWithinCanvas(event, p_canvas);
	const pixY = this.getPixYWithinCanvas(event, p_canvas);
	if (pixY <= this.pix.marginGrid.up) {
		const index = Math.floor(this.getPixXWithinGrid(event, p_canvas) / this.pix.sideSpace);
		if (index != null) {
			return { 
				edge : EDGES.UP,
				index : index
			}			
		}
	}		
	if (pixY >= p_canvas.height - this.pix.marginGrid.down) {
		const index = Math.floor(this.getPixXWithinGrid(event, p_canvas) / this.pix.sideSpace);
		if (index != null) {
			return { 
				edge : EDGES.DOWN,
				index : index
			}			
		}
	}
	if (pixX <= this.pix.marginGrid.left) {
		const index = Math.floor(this.getPixYWithinGrid(event, p_canvas) / this.pix.sideSpace);
		if (index != null) {
			return { 
				edge : EDGES.LEFT,
				index : index
			}			
		}
	}		
	if (pixX >= p_canvas.width - this.pix.marginGrid.right) {
		const index = Math.floor(this.getPixYWithinGrid(event, p_canvas) / this.pix.sideSpace);
		if (index != null) {
			return { 
				edge : EDGES.RIGHT,
				index : index
			}			
		}
	}
	return null;
}

//--------------------
// Fonts

setupFont = function(p_context, p_pixSize, p_name, p_colour) {
	p_context.font = p_pixSize + "px " + p_name;
	if (p_colour) {		
		p_context.fillStyle = p_colour;
	}
}

alignFontCenter = function(p_context) { // Credits : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/textAlign
	p_context.textAlign = 'center'; 
	p_context.textBaseline = 'middle';
}

alignFontLeft = function(p_context) {
	p_context.textAlign = 'left'; 
	p_context.textBaseline = 'top';
}


//--------------------
// Setting up functions

/**
Changes the width and height of a canvas according to some parameters ; mandatory ones are the X and Y length of spaces (or xyLength if square puzzle).
Offensive programming : if "margin" is defined, all four directions (left/up/right/down) must be >= 0 values, even set at 0
 */
Drawer.prototype.adaptCanvasDimensions = function (p_canvas, p_parameters) {

    const pixMaxSpace = 32; //TODO peut changer
	const pixMinSpace = 16;
    const pixXCanvasSize = 800; //TODO peut changer
    const pixYCanvasSize = 512; //TODO peut changer
    var totalXLength = p_parameters.xLength ? p_parameters.xLength : p_parameters.xyLength;
    var totalYLength = p_parameters.yLength ? p_parameters.yLength : p_parameters.xyLength;
    if (p_parameters.margin) {
        if (p_parameters.margin.leftLength) { totalXLength += p_parameters.margin.leftLength; }
        if (p_parameters.margin.upLength) { totalYLength += p_parameters.margin.upLength; }
        if (p_parameters.margin.rightLength) { totalXLength += p_parameters.margin.rightLength; }
        if (p_parameters.margin.downLength) { totalYLength += p_parameters.margin.downLength; }
    }
    this.pix.sideSpace = Math.max(pixMinSpace, Math.min(pixMaxSpace, Math.min(Math.floor(pixXCanvasSize / totalXLength), Math.floor(pixYCanvasSize / totalYLength))));
    this.pix.borderSpace = Math.max(1, Math.floor(this.pix.sideSpace / 10));
	this.pix.borderClickDetection = this.pix.borderSpace * 2;
	if (p_parameters.margin) {
		this.pix.marginGrid.left = this.pix.sideSpace * p_parameters.margin.leftLength; // Possibility to add "extra pixels", who knows... (in that case they must be subtracted from pixXCanvasSize / Y)
		this.pix.marginGrid.up = this.pix.sideSpace * p_parameters.margin.upLength;
		this.pix.marginGrid.right = this.pix.sideSpace * p_parameters.margin.rightLength;
		this.pix.marginGrid.down = this.pix.sideSpace * p_parameters.margin.downLength;
    }	
    p_canvas.width = totalXLength * this.pix.sideSpace;
    p_canvas.height = totalYLength * this.pix.sideSpace;
}

//--------------------
// Private functions

Drawer.prototype.getPixXWithinCanvas = function (event, p_canvas) {
    return (event.clientX - p_canvas.getBoundingClientRect().left);
}

Drawer.prototype.getPixYWithinCanvas = function (event, p_canvas) {
    return (event.clientY - p_canvas.getBoundingClientRect().top);
}

Drawer.prototype.getPixXWithinGrid = function (event, p_canvas) {
    return (event.clientX - p_canvas.getBoundingClientRect().left - this.pix.marginGrid.left);
}

Drawer.prototype.getPixYWithinGrid = function (event, p_canvas) {
    return (event.clientY - p_canvas.getBoundingClientRect().top - this.pix.marginGrid.up);
}

/**
(private string)
Gives the correct wall color from a wall type (a #RRGGBB string)
@p_wallType : a type of wall between 2 spaces
 */
Drawer.prototype.wallToColor = function (p_wallType) {
    switch (p_wallType) {
    case (WALLGRID.OPEN):
        return (this.wallColorSet.open_wall);
        break;
    case (WALLGRID.CLOSED):
        return (this.wallColorSet.closed_wall);
        break;
    }
    return "#ffffff";
}

// With fences
Drawer.prototype.fenceToColor = function (p_fenceState) {
    switch (p_fenceState) {
		case (FENCE_STATE.OPEN): return (this.fenceColourSet.open_fence); break;
		case (FENCE_STATE.CLOSED): return (this.fenceColourSet.closed_fence); break;
		default : return this.fenceColourSet.undecided_fence;
    }
}