// Constants
const DRAW_PATH = {
	OPEN : 1,
	CLOSED : 0,
	NONE : -1
}

// Classes
function AlternateClosedPathDraw(p_wallGrid, p_colour) {
	this.wallGrid = p_wallGrid;
	this.colourRegionBorders = p_colour;
}

// Setup
function Drawer() {
	this.automaticallyClean = true;
	
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
	
	// Colour : common part
	this.wallColorSet = { 
		closed_wall : COLOURS.CLOSED_WALL,
		open_wall : COLOURS.OPEN_WALL,
		edge_walls : COLOURS.EDGE_WALL,
		bannedSpace : COLOURS.BANNED_SPACE
	}
	this.fenceColourSet = {
		closed_fence : COLOURS.CLOSED_FENCE,
		undecided_fence : COLOURS.UNDECIDED_FENCE,
		open_fence : COLOURS.OPEN_FENCE
	}
	
	// Specific puzzle part
	this.coloursFontsSpecificGrids = {
		combinedArrowRingIndications : '#440000',
		tapaIndications : '#000044',
		tapaFont : FONTS.ARIAL,
		marginText : '#440000'
	}
	this.galaxiesColourSet = {
		inner : '#ffffdd',
		border : '#440000'
	}
	this.yagitColourSet = {
		roundBorder : '#000088',
		roundInner : '#8844ff',
		squareBorder : '#008800',
		squareInner : '#00cc44'
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

Drawer.prototype.inhibitAutoClean = function() {
	this.automaticallyClean = false;
}

//---------------------
// All draw functions are below

//---------------------
// Refresh

Drawer.prototype.clearDrawing = function(p_context) {
	p_context.clearRect(0, 0, 9999, 9999 ); // Note : this used to be (800, 500) but the size of the canvas eventually went over this limit...
}

Drawer.prototype.clearDrawingMandatory = function(p_context) {
	if (this.automaticallyClean) {
		this.clearDrawing(p_context);
	}
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

pillarToColorFenceClosure = function(p_drawer, p_fenceMethodRight, p_fenceMethodDown, p_undecidedOverOpen) {
	return function(p_x, p_y) {
		if (p_fenceMethodRight(p_x, p_y) == FENCE_STATE.CLOSED || p_fenceMethodDown(p_x, p_y) == FENCE_STATE.CLOSED ||
			p_fenceMethodRight(p_x, p_y + 1) == FENCE_STATE.CLOSED || p_fenceMethodDown(p_x + 1, p_y) == FENCE_STATE.CLOSED) {
			return p_drawer.fenceToColor(FENCE_STATE.CLOSED);
		} else {
			const cond1 = !p_undecidedOverOpen && (p_fenceMethodRight(p_x, p_y) == FENCE_STATE.OPEN || p_fenceMethodDown(p_x, p_y) == FENCE_STATE.OPEN ||
			p_fenceMethodRight(p_x, p_y + 1) == FENCE_STATE.OPEN || p_fenceMethodDown(p_x + 1, p_y) == FENCE_STATE.OPEN);
			const cond2 = p_undecidedOverOpen && p_fenceMethodRight(p_x, p_y) == FENCE_STATE.OPEN && p_fenceMethodDown(p_x, p_y) == FENCE_STATE.OPEN &&
			p_fenceMethodRight(p_x, p_y + 1) == FENCE_STATE.OPEN && p_fenceMethodDown(p_x + 1, p_y) == FENCE_STATE.OPEN;
			if (cond1 || cond2) {
				return p_drawer.fenceToColor(FENCE_STATE.OPEN);
			} else {
				return p_drawer.fenceToColor(FENCE_STATE.UNDECIDED);
			}
		}
	}
}

Drawer.prototype.drawWallGrid = function (p_context, p_wallGrid, p_xLength, p_yLength) {
	this.drawEdgesGrid(p_context, p_xLength, p_yLength, 
	wallRightToColorClosure(this, p_wallGrid), wallDownToColorClosure(this, p_wallGrid), 
	pillarToColorClosure(this, p_wallGrid), spaceToColorClosure(this, p_wallGrid))
}

Drawer.prototype.drawFenceArray = function (p_context, p_xLength, p_yLength, p_fenceMethodRight, p_fenceMethodDown) {
	this.drawFenceArrayPrivate(p_context, p_xLength, p_yLength, p_fenceMethodRight, p_fenceMethodDown, false);
}

// Well, there are no "open pillars"
Drawer.prototype.drawFenceArrayGhostPillars = function (p_context, p_xLength, p_yLength, p_fenceMethodRight, p_fenceMethodDown) {
	this.drawFenceArrayPrivate(p_context, p_xLength, p_yLength, p_fenceMethodRight, p_fenceMethodDown, true);
}


Drawer.prototype.drawFenceArrayPrivate = function (p_context, p_xLength, p_yLength, p_fenceMethodRight, p_fenceMethodDown, p_pillarsUnknownOverOpen) {
	this.drawEdgesGrid(p_context, p_xLength, p_yLength, 
	fenceRightToColorClosure(this, p_fenceMethodRight), fenceDownToColorClosure(this, p_fenceMethodDown), 
	pillarToColorFenceClosure(this, p_fenceMethodRight, p_fenceMethodDown, p_pillarsUnknownOverOpen), null);
}

Drawer.prototype.drawEdgesGrid = function (p_context, p_xLength, p_yLength, p_colourMethodRight, p_colourMethodDown, p_colourMethodPillar, p_colourMethodSpace) {
	var ix,
    iy,
    indexRegion;
	this.clearDrawingMandatory(p_context);
	
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
                p_context.fillStyle = p_colourMethodDown(ix, iy);
                p_context.fillRect(pixDrawXHoriz, pixDrawYHoriz, pixLength, pixThickness);
            }
            //Draw right wall
            if (ix <= p_xLength - 2) {
                p_context.fillStyle = p_colourMethodRight(ix, iy);
                p_context.fillRect(pixDrawXVert, pixDrawYVert, pixThickness, pixLength);
            }
            //Draw pillar
            if ((ix <= p_xLength - 2) && (iy <= p_yLength - 2)) {
				if (p_colourMethodPillar && (p_colourMethodPillar != null)) {
					p_context.fillStyle = p_colourMethodPillar(ix, iy);
				} else {
					p_context.fillStyle = this.wallToColor(WALLGRID.CLOSED);
				}
				p_context.fillRect(pixDrawXVert, pixDrawYHoriz, pixThickness, pixThickness);
            }
            //Draw inside space
			if (p_colourMethodSpace && (p_colourMethodSpace != null)) {
				filling = p_colourMethodSpace(ix, iy);
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
	this.clearDrawingMandatory(p_context);
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

//--------------------
// Drawing a dotted grid

const DOTS_SIZE = {
	MEDIUM : '1',
	LARGE : '2',
	NONE : '3'
}

Drawer.prototype.drawDotsGridSimple = function(p_context, p_xDotsNumber, p_yDotsNumber, p_defaultColour) {
	this.drawDotsGrid(p_context, p_xDotsNumber, p_yDotsNumber, function() {return p_defaultColour}, function() {return DOTS_SIZE.MEDIUM},
	
	function(){return p_defaultColour}, 
	function(){return p_defaultColour});
}

Drawer.prototype.drawMeshContents2Dimensions = function(p_context, p_drawableItems, p_function, p_xMeshNumber, p_yMeshNumber) {
	this.drawSpaceContents2Dimensions(p_context, p_drawableItems, p_function, p_xMeshNumber, p_yMeshNumber);
}

Drawer.prototype.drawDotsGrid = function(p_context, p_xDotsNumber, p_yDotsNumber, p_linkRightColourMethod, p_linkDownColourMethod, p_dotsColorMethod, p_dotsSizeMethod, p_drawableMethod) {
	this.clearDrawingMandatory(p_context);
    		
	//Links
    const pixStartXVert = this.pix.marginGrid.left - this.pix.borderSpace/2;
    const pixStartXHoriz = this.pix.marginGrid.left;
    var pixDrawXHoriz = pixStartXHoriz;
    var pixDrawYHoriz = this.pix.marginGrid.up - this.pix.borderSpace/2;
    var pixDrawXVert = pixStartXVert;
    var pixDrawYVert = this.pix.marginGrid.up;
    var innerSpaceNotColored;
	var filling;
    const pixLength = this.pix.sideSpace - this.pix.borderSpace + 2; // Extra pixels should be masked by dots
    const pixThickness = this.pix.borderSpace;

    for (iy = 0; iy < p_yDotsNumber; iy++) {
        for (ix = 0; ix < p_xDotsNumber; ix++) {
            //Draw down wall
            if (iy <= p_yDotsNumber - 2) {
                p_context.fillStyle = p_linkDownColourMethod(ix, iy);
                p_context.fillRect(pixDrawXVert, pixDrawYVert, pixThickness, pixLength);
            }
            //Draw right wall
            if (ix <= p_xDotsNumber - 2) {
                p_context.fillStyle = p_linkRightColourMethod(ix, iy);
                p_context.fillRect(pixDrawXHoriz, pixDrawYHoriz, pixLength, pixThickness);
            }
            pixDrawXHoriz += this.pix.sideSpace;
            pixDrawXVert += this.pix.sideSpace;
        }
        pixDrawYHoriz += this.pix.sideSpace;
        pixDrawYVert += this.pix.sideSpace;
        pixDrawXHoriz = pixStartXHoriz;
        pixDrawXVert = pixStartXVert;
    }
	
	// Dots
	const pixStartXCenter = this.pix.marginGrid.left;
	var pixDrawXCenter = pixStartXCenter;
	var pixDrawYCenter = this.pix.marginGrid.up; 
	var pixDotRadius;

    for (iy = 0; iy < p_yDotsNumber; iy++) {
		pixDrawXCenter = pixStartXCenter;
        for (ix = 0; ix < p_xDotsNumber; ix++) {
			if (!p_drawableMethod || !p_drawableMethod(ix, iy)) {				
				pixDotRadius = this.pix.borderSpace;
				p_context.beginPath();
				//p_context.lineWidth = 1;
				p_context.ellipse(pixDrawXCenter, pixDrawYCenter, pixDotRadius, pixDotRadius, 0, 0, 2 * Math.PI);
				p_context.fillStyle = p_dotsColorMethod(ix, iy); 
				p_context.fill();
			}
			pixDrawXCenter+= this.pix.sideSpace;
		}
		pixDrawYCenter+= this.pix.sideSpace;
	}
}

// -----------------
// Drawing values inside the grid

/**
Draws the main content of a space into a grid.
(It is used mainly for solver as the space is supposed to be colorized, to have an image into it...)

p_drawableItems : array of items to draw.
p_function : function to return the index.
 */
Drawer.prototype.drawSpaceContents2Dimensions = function (p_context, p_drawableItems, p_function, p_xLength, p_yLength) { 
    const pixInnerSide = this.getPixInnerSide();
    var item;
    var ix, iy, indexItem;
    for (iy = 0; iy < p_yLength; iy++) {
        for (ix = 0; ix < p_xLength; ix++) {
            indexItem = p_function(ix, iy);
            if (indexItem >= 0 && indexItem < p_drawableItems.length) {
                item = p_drawableItems[indexItem];
                this.drawSpaceContent(p_context, ix, iy, item, pixInnerSide); 
            }
        }
    }
}

Drawer.prototype.drawSpaceContentsCoorsList = function (p_context, p_drawableItems, p_function, p_coorsList) { 
    const pixInnerSide = this.getPixInnerSide();
    var item;
    var ix, iy, indexItem;
	p_coorsList.forEach(coors => {
		ix = coors.x;
		iy = coors.y;
		indexItem = p_function(ix, iy);
		if (indexItem >= 0 && indexItem < p_drawableItems.length) {
			item = p_drawableItems[indexItem];
			this.drawSpaceContent(p_context, ix, iy, item, pixInnerSide); 
		}
	});
}

Drawer.prototype.drawSpaceContent = function(p_context, p_ix, p_iy, p_item, p_pixInnerSide) {
	if (p_item.kind == KIND_DRAWABLE_ITEM.IMAGE) {
		p_context.drawImage(p_item.picture, p_item.x1, p_item.y1, p_item.x2, p_item.y2, this.getPixInnerXLeft(p_ix), this.getPixInnerYUp(p_iy), p_pixInnerSide, p_pixInnerSide);
	} else if (p_item.kind == KIND_DRAWABLE_ITEM.COLOR) {
		p_context.fillStyle = p_item.getColour();
		p_context.fillRect(this.getPixInnerXLeft(p_ix), this.getPixInnerYUp(p_iy), p_pixInnerSide, p_pixInnerSide);
	} else if (p_item.kind == KIND_DRAWABLE_ITEM.CIRCLE) {
		p_context.beginPath();
		p_context.lineWidth = (p_item.thickness || p_item.thickness == 0) ? p_item.thickness : Math.max(1, this.getPixInnerSide()*1/16);
		const pixRadius = this.getPixInnerSide()*1/3;
		p_context.ellipse(this.getPixCenterX(p_ix), this.getPixCenterY(p_iy), pixRadius, pixRadius, 0, 0, 2 * Math.PI);
		if (p_item.colorInner && p_item.colorInner != null) { // Note : "p_context.fillStyle = X" seems not to change p_context.fillStyle when X is null.
			p_context.fillStyle = p_item.colorInner; //An p_item property was taken rather than a method. I think this is better this way.
			p_context.fill();
		}
		if (p_item.colorBorder && p_item.colorBorder != null) {
			p_context.strokeStyle = p_item.colorBorder;
			p_context.stroke();
		}
	} else if (p_item.kind == KIND_DRAWABLE_ITEM.X) {
		this.drawCrossX(p_context, p_ix, p_iy, p_item);
	} else if (p_item.kind == KIND_DRAWABLE_ITEM.LITTLE_X) {
		this.drawCrossLittleX(p_context, p_ix, p_iy, p_item);
	} else if (p_item.kind == KIND_DRAWABLE_ITEM.SQUARE) {
		this.drawSquare(p_context, p_ix, p_iy, p_item);
	} else if (p_item.kind == KIND_DRAWABLE_ITEM.TRIANGLE) {
		this.drawTriangle(p_context, p_ix, p_iy, p_item);
	} else if (p_item.kind == KIND_DRAWABLE_ITEM.TEXT) {
		setupFont(p_context, this.getPixInnerSide(), p_item.font);
		alignFontCenter(p_context);
		if (p_item.value != null) {
			p_context.fillStyle = p_item.color;
			p_context.fillText(p_item.value, this.getPixCenterX(p_ix), this.getPixWriteCenterY(p_iy));
		} 
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
				} else if (item.kind == KIND_DRAWABLE_ITEM.SQUARE_UPPER_RIGHT) {
					this.drawLittleSquareUpperRight(p_context, ix, iy, item);
				}
			}
		}
	}
}

// Draws a text in the right corner of all spaces.
// Note : mono-colour for now !
Drawer.prototype.drawTextUpperRightCorner = function(p_context, p_drawableText, p_colour, p_function, p_xLength, p_yLength, p_font) {  
	var textElt, indexItem;
	setupFont(p_context, this.getPixInnerSide()/2, p_font);
	alignFontCenter(p_context);
	p_context.fillStyle = p_colour;
	const pixStartX = this.getPixCenterX(0) + this.getPixInnerSide()/3;
	var pixX;
	var pixY = this.getPixCenterY(0) - this.getPixInnerSide()/6;
	for (var iy = 0; iy < p_yLength; iy++) {
		pixX = pixStartX;
		for (var  ix = 0; ix < p_xLength; ix++) {
			indexItem = p_function(ix, iy);
			if (indexItem >= 0 && indexItem < p_drawableText.length && p_drawableText[indexItem] != null) {
				p_context.fillText(p_drawableText[indexItem], pixX, pixY);
			}
			pixX += this.pix.sideSpace;
		}
		pixY += this.pix.sideSpace;
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

function DrawSpaceValue(p_value, p_colour) {
	this.value = p_value;
	this.writeColour = p_colour;
}

function DrawWriteSpaceValue(p_value, p_backgroundColour, p_writeColour) {
	this.value = p_value;
	this.backgroundColour = p_backgroundColour;
	this.writeColour = p_writeColour;
}

Drawer.prototype.fillInnerSpace = function(p_context, p_backgroundColour, p_ix, p_iy) { 
	p_context.fillStyle = p_backgroundColour;
	p_context.fillRect(this.getPixInnerXLeft(p_ix), this.getPixInnerYUp(p_iy), this.getPixInnerSide(), this.getPixInnerSide());	
}

Drawer.prototype.strokeInnerSpace = function(p_context, p_strokeColour, p_ix, p_iy, p_pixWidth) { 
	p_context.strokeStyle = p_strokeColour;
	p_context.lineWidth = p_pixWidth;
	p_context.strokeRect(this.getPixInnerXLeft(p_ix), this.getPixInnerYUp(p_iy), this.getPixInnerSide(), this.getPixInnerSide());	
}

// -------------------------------
// Draw inside grids non-specific

// Note : hatch (as right now this is a method for text drawing)
Drawer.prototype.drawNumbersInsideStandardCoorsList = function(p_context, p_function, p_coordinates, p_font) {
	this.drawTextInsideStandardCoorsList(p_context, p_function, p_coordinates, p_font);
}

Drawer.prototype.drawTextInsideStandardCoorsList = function(p_context, p_function, p_coordinates, p_font) {
	setupFont(p_context, this.getPixInnerSide(), p_font);
	alignFontCenter(p_context);
	p_coordinates.forEach(coors => {		
		supposedValue = p_function(coors.x, coors.y);
		if (supposedValue != null) {
			p_context.fillStyle = supposedValue.writeColour;
			p_context.fillText(supposedValue.value, this.getPixCenterX(coors.x), this.getPixWriteCenterY(coors.y));
		} 
	});
}

// Note : hatch
Drawer.prototype.drawNumbersInsideStandard2Dimensions = function(p_context, p_writeFunction, p_font, p_xLength, p_yLength) {
	this.drawTextInsideStandard2Dimensions(p_context, p_writeFunction, p_font, p_xLength, p_yLength);
}

Drawer.prototype.drawTextInsideStandard2DimensionsLittle = function(p_context, p_writeFunction, p_font, p_xLength, p_yLength) {
	this.drawTextInsideStandard2Dimensions(p_context, p_writeFunction, p_font, p_xLength, p_yLength, {little : true});
}

Drawer.prototype.drawTextInsideStandard2Dimensions = function(p_context, p_writeFunction, p_font, p_xLength, p_yLength, p_options) {
	var fontSize = this.getPixInnerSide();
	if (p_options) {
		if (p_options.little) {
			fontSize *= 0.4;
		}
	}
	setupFont(p_context, fontSize, p_font);
	alignFontCenter(p_context);
	for(var iy = 0 ; iy < p_yLength ; iy++) {
		for(var ix = 0 ; ix < p_xLength ; ix++) {
			supposedValue = p_writeFunction(ix, iy);
			if (supposedValue != null) {
				p_context.fillStyle = supposedValue.writeColour;
				p_context.fillText(supposedValue.value, this.getPixCenterX(ix), this.getPixWriteCenterY(iy));
			} 
		}
	}
}

Drawer.prototype.drawTextInsideStandardWithBackground2Dimensions = function(p_context, p_writeFunction, p_font, p_xLength, p_yLength) {
	setupFont(p_context, this.getPixInnerSide(), p_font);
	alignFontCenter(p_context);
	for(var iy = 0 ; iy < p_yLength ; iy++) {
		for(var ix = 0 ; ix < p_xLength ; ix++) {
			supposedValue = p_writeFunction(ix, iy);
			if (supposedValue != null) {
				this.fillInnerSpace(p_context, supposedValue.backgroundColour, ix, iy);
				p_context.fillStyle = supposedValue.writeColour;
				p_context.fillText(supposedValue.value, this.getPixCenterX(ix), this.getPixWriteCenterY(iy));
			} 
		}
	}
}

// Note : hatch
Drawer.prototype.drawFixedNumbersOrX = function(p_context, p_method, p_coorsList, p_coorsXList, p_colourNumbers, p_colourX, p_font) {
	this.drawFixedTextOrX(p_context, p_method, p_coorsList, p_coorsXList, p_colourNumbers, p_colourX, p_font);
}

// p_method : method (x, y) that returns an integer, {draw : true} or null.
Drawer.prototype.drawFixedTextOrX = function(p_context, p_method, p_coorsList, p_coorsXList, p_colourNumbers, p_colourX, p_font) {
	p_context.fillStyle = p_colourNumbers;
	setupFont(p_context, this.getPixInnerSide(), p_font);
	alignFontCenter(p_context);
	var method;
	p_coorsList.forEach(coors => {
		method = p_method(coors.x, coors.y);
		if (method != null) {			
			p_context.fillText(method, this.getPixCenterX(coors.x), this.getPixCenterY(coors.y));
		}
	});
	p_coorsXList.forEach(coors => {
		this.drawCrossX(p_context, coors.x, coors.y, new DrawableX(p_colourX));
	});
}

// -------------------------------
// Draw grid contents used both in editor and solvers, that are specific

Drawer.prototype.drawCombinedArrowGridIndications = function (p_context, p_combinedArrowGrid) {
	this.drawCombinedArrowGridIndicationsPrivate(p_context, p_combinedArrowGrid, false);
}

Drawer.prototype.drawCombinedArrowGridIndicationsBlackWhite = function (p_context, p_combinedArrowGrid) {
	this.drawCombinedArrowGridIndicationsPrivate(p_context, p_combinedArrowGrid, true);
}

// Combined arrow = Yajilin-like. This method is a better deal than reusing a drawSpaceContents method since it doesn't draw spaces.
// Note : since this method is also used in solvers, it's not put in editor (although this may be changed)
// Re-note : the code is copied with the drawing in castle wall solver.
Drawer.prototype.drawCombinedArrowGridIndicationsPrivate = function (p_context, p_combinedArrowGrid, p_bwMode) {
	const yLength = p_combinedArrowGrid.getYLength();
	if (yLength > 0) {
		const indexCoD = p_bwMode ? 1 : 0 ; // "indexCoD" = "index character of direction"
		const xLength = p_combinedArrowGrid.getXLength();
		var ix, iy, clue, isX, drawArrowPart, charDir; 
		const pixBack = this.getPixInnerSide()/4;
		if (!p_bwMode) {			
			p_context.fillStyle = this.coloursFontsSpecificGrids.combinedArrowRingIndications; 
			p_context.strokeStyle = this.coloursFontsSpecificGrids.combinedArrowRingIndications; 
			drawArrowPart = true;
		}
		p_context.textAlign = "center"; // Credits : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/textAlign
		p_context.textBaseline = "middle"; // Credits : https://stackoverflow.com/questions/39294065/vertical-alignment-of-canvas-text https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/textBaseline
		var pixX1, pixY1, pixX2, pixY2, pixX3, pixY3, pixTextX, pixTextY;
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {				
				clue = p_combinedArrowGrid.get(ix, iy);
				//Credits on drawing polygon : https://stackoverflow.com/questions/4839993/how-to-draw-polygons-on-an-html5-canvas
				if (clue != null) {
					p_context.beginPath();
					isX = false;
					drawArrowPart = false;
					charDir = clue.charAt(indexCoD);
					switch (charDir) {
						case CHAR_DIRECTION.LEFT: case CHAR_DIRECTION.RIGHT: 
							drawArrowPart = true;
							pixY1 = this.getPixCenterY(iy);
							pixY2 = pixY1 - pixBack;
							pixY3 = pixY1 + pixBack;
							pixTextY = pixY1;
							if (charDir == CHAR_DIRECTION.LEFT) {
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
						case CHAR_DIRECTION.UP: case CHAR_DIRECTION.DOWN: 
							drawArrowPart = true;
							pixX1 = this.getPixCenterX(ix);
							pixX2 = pixX1 - pixBack;
							pixX3 = pixX1 + pixBack;
							pixTextX = pixX1;
							if (charDir == CHAR_DIRECTION.UP) {
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
						if (p_bwMode) {
							if (clue.charAt(0) == SYMBOL_ID.BLACK) { // High convention : how a clue is made.
								this.fillInnerSpace(p_context, COLOURS.BLACK_ON_WHITE, ix, iy); 
								p_context.fillStyle = COLOURS.WHITE_ON_BLACK; 
								p_context.strokeStyle = COLOURS.WHITE_ON_BLACK;
							} else {
								this.fillInnerSpace(p_context, COLOURS.WHITE_ON_BLACK, ix, iy);
								p_context.fillStyle = COLOURS.BLACK_ON_WHITE;
								p_context.strokeStyle = COLOURS.BLACK_ON_WHITE; 
							}						
						} 
						if (drawArrowPart) {	
							// Draw arrow and text
							p_context.moveTo(pixX1, pixY1);
							p_context.lineTo(pixX2, pixY2);
							p_context.lineTo(pixX3, pixY3);
							p_context.lineTo(pixX1, pixY1);
							p_context.fillText(clue.substring(indexCoD+1), pixTextX, pixTextY);
							p_context.closePath();
							p_context.fill();
						}
					}
				}
			}
		}
	}
}

// For Yagit. There is a puzzle with Yagit-related shapes added while solving (like Hakoiri has shapes added in solving but as I write this it's direcly handled by Hakoiri drawer), but I'll probably add a function variant of this method then.
Drawer.prototype.drawYagitGrid = function (p_context, p_shapeGrid) {
	function getShape (x, y) {
		if (p_shapeGrid.get(x, y) == SYMBOL_ID.ROUND) {
			return 0;
		} else if (p_shapeGrid.get(x, y) == SYMBOL_ID.SQUARE) {
			return 1;
		}
		return -1;
	}
	const shapes = [DrawableCircle(this.yagitColourSet.roundBorder, this.yagitColourSet.roundInner), DrawableSquare(this.yagitColourSet.squareBorder, this.yagitColourSet.squareInner)];
	this.drawSpaceContents2Dimensions(p_context, shapes, getShape, p_shapeGrid.getXLength(), p_shapeGrid.getYLength()); 
}

Drawer.prototype.drawKnotsInRD = function(p_context, p_knotsGrid, p_colourInner, p_colourBorder) {
	const yLength = p_knotsGrid.getYLength();	
	const xLength = p_knotsGrid.getXLength();
	p_context.fillStyle = p_colourInner;
	p_context.strokeStyle = p_colourBorder;
	const pixRadius = this.pix.sideSpace / 7;
	for(var iy = 0 ; iy < yLength ; iy++) {
		for(var ix = 0 ; ix < xLength ; ix++) {
			if (p_knotsGrid.get(ix, iy) != null) {
				p_context.beginPath();
				p_context.ellipse(this.getPixXRight(ix), this.getPixYDown(iy), pixRadius, pixRadius, 0, 0, 2 * Math.PI);
				p_context.stroke();
				p_context.fill();	
			}
		}
	}
}

// Tapa
Drawer.prototype.drawTapaGrid = function (p_context, p_tapaGrid) {
	const yLength = p_tapaGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_tapaGrid.getXLength();
		var ix, iy, tapaClue;
		const pixDeltaInnerX = 1/5*this.getPixInnerSide();
		const pixDeltaInnerY = 1/4*this.getPixInnerSide();
		p_context.fillStyle = this.coloursFontsSpecificGrids.tapaIndications;
		alignFontCenter(p_context);
		p_context.fillStyle = '#000000';
		for (iy = 0; iy < yLength; iy++) {
			for (ix = 0; ix < xLength; ix++) {
				tapaClue = p_tapaGrid.get(ix, iy);
				if (tapaClue != null) {
					if (tapaClue.length == 1) {
						setupFont(p_context, this.getPixInnerSide()*4/5, this.coloursFontsSpecificGrids.tapaFont);
						pixArray = [{pixX : this.getPixCenterX(ix), pixY : this.getPixCenterY(iy)}];
					}
					if (tapaClue.length == 2) {
						setupFont(p_context, this.getPixInnerSide()*1/2, this.coloursFontsSpecificGrids.tapaFont);
						pixArray = [{pixX : this.getPixCenterX(ix)-pixDeltaInnerX, pixY : this.getPixCenterY(iy)},
									{pixX : this.getPixCenterX(ix)+pixDeltaInnerX, pixY : this.getPixCenterY(iy)}];
					}
					if (tapaClue.length == 3) {
						setupFont(p_context, this.getPixInnerSide()*2/5, this.coloursFontsSpecificGrids.tapaFont);
						pixArray = [{pixX : this.getPixCenterX(ix), pixY : this.getPixCenterY(iy)-pixDeltaInnerY},
									{pixX : this.getPixCenterX(ix)-pixDeltaInnerX, pixY : this.getPixCenterY(iy)+pixDeltaInnerY},
									{pixX : this.getPixCenterX(ix)+pixDeltaInnerX, pixY : this.getPixCenterY(iy)+pixDeltaInnerY}];
					}
					if (tapaClue.length == 4) {
						setupFont(p_context, this.getPixInnerSide()*2/5, this.coloursFontsSpecificGrids.tapaFont);
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
				const pixRadius = this.pix.sideSpace / 6;
				p_context.beginPath();
				p_context.ellipse(pixXCenter, pixYCenter, pixRadius, pixRadius, 0, 0, 2 * Math.PI);
				p_context.stroke();
				p_context.fill();
			}
		}
	}
}

Drawer.prototype.drawDiscGrid = function (p_context, p_discGrid, p_symbols, p_coloursStroke, p_coloursFill) {
	const yLength = p_discGrid.getYLength();
	if (yLength > 0) {
		const xLength = p_discGrid.getXLength();
		var ix, iy, disc, i, found;
		const pixRadius = this.getPixInnerSide()*1/3;
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
						p_context.ellipse(this.getPixCenterX(ix), this.getPixCenterY(iy), pixRadius, pixRadius, 0, 0, 2 * Math.PI);
						if (p_coloursStroke[i] && p_coloursStroke[i] != null) {
							p_context.strokeStyle = p_coloursStroke[i];
							p_context.stroke();
						}
						if (p_coloursFill[i] && p_coloursFill[i] != null) {
							p_context.fillStyle = p_coloursFill[i];
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
Draws values in appropriate spaces of region (usually the first) in the same grid as where drawSpaceContents variants are used. (coordinates and 2-dimensions)
p_functionRegionIndicationColour : function that transforms an integer in 0 .. p_numberRegions-1 into an item containing properties {x, y, value, color}, or null ; this way, several colours may be used depending on the context.
p_numberRegions : number of regions
p_font : font in which values are drawn.
*/ 
Drawer.prototype.drawRegionIndications = function(p_context, p_functionRegionIndicationColour, p_numberRegions, p_font) {
	var pixLeft, pixDown;
	var valueToDraw;
	setupFont(p_context, this.getPixInnerSide() / 2, p_font);
	alignFontLeft(p_context);
	for(var i=0 ; i < p_numberRegions ; i++) {
		valueToDraw = p_functionRegionIndicationColour(i);
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
	const pixRadius = this.pix.sideSpace / 6;
	const pixXCenter = this.getPixXRight(p_xSpace) - 1 - pixRadius;
	const pixYCenter = this.getPixYUp(p_ySpace) + 1 + pixRadius;
	p_context.beginPath();
	p_context.ellipse(pixXCenter, pixYCenter, pixRadius, pixRadius, 0, 0, 2 * Math.PI);
	p_context.stroke();
}

Drawer.prototype.drawLittlePlusUpperRight = function(p_context, p_xSpace, p_ySpace, p_item) {
	p_context.beginPath();
	const pixRadius = this.pix.sideSpace / 6;
	const pixXCenter = this.getPixXRight(p_xSpace) - 1 - pixRadius;
	const pixYCenter = this.getPixYUp(p_ySpace) + 1 + pixRadius;
	p_context.moveTo(pixXCenter, pixYCenter - pixRadius);
	p_context.lineTo(pixXCenter, pixYCenter + pixRadius);
	p_context.moveTo(pixXCenter - pixRadius, pixYCenter);
	p_context.lineTo(pixXCenter + pixRadius, pixYCenter);
	p_context.stroke();
}

Drawer.prototype.drawLittleSquareUpperRight = function(p_context, p_xSpace, p_ySpace, p_item) {
	p_context.beginPath();
	const pixRadius = this.pix.sideSpace / 6;
	const pixXCenter = this.getPixXRight(p_xSpace) - 1 - pixRadius;
	const pixYCenter = this.getPixYUp(p_ySpace) + 1 + pixRadius;
	p_context.moveTo(pixXCenter - pixRadius, pixYCenter - pixRadius);
	p_context.lineTo(pixXCenter - pixRadius, pixYCenter + pixRadius);
	p_context.lineTo(pixXCenter + pixRadius, pixYCenter + pixRadius);
	p_context.lineTo(pixXCenter + pixRadius, pixYCenter - pixRadius);
	p_context.lineTo(pixXCenter - pixRadius, pixYCenter - pixRadius);
	p_context.stroke();
}

// ------------------
// Drawing margins

// Draw margins with one info left and one up.
Drawer.prototype.drawMarginLeftUpOne = function(p_context, p_arrayMarginLeft, p_arrayMarginUp, p_font) {
	setupFont(p_context, this.getPixInnerSide(), p_font, this.coloursFontsSpecificGrids.marginText);
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
Drawer.prototype.getPixSide = function () {
    return this.pix.sideSpace;
}
Drawer.prototype.getPixXDot = function (p_xIndex) {
    return this.pix.marginGrid.left + p_xIndex * this.pix.sideSpace;
}
Drawer.prototype.getPixYDot = function (p_yIndex) {
    return this.pix.marginGrid.up + p_yIndex * this.pix.sideSpace;
}
// To be added when going from x-mesh / x-space to x-node 
Drawer.prototype.getPixShiftSpaceToDot = function() {
	return -this.getPixSide()/2;
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

Drawer.prototype.getClickSpaceWithDirection = function (event, p_canvas, p_xLength, p_yLength) {
    const pixXWithinGrid = this.getPixXWithinGrid(event, p_canvas);
    const pixYWithinGrid = this.getPixYWithinGrid(event, p_canvas);
	const indexX = Math.floor(pixXWithinGrid / this.pix.sideSpace);
    const indexY = Math.floor(pixYWithinGrid / this.pix.sideSpace);
    if (indexX < 0 || indexX >= p_xLength || indexY < 0 || indexY >= p_yLength) {
        return null;
    }
	const pixXSpace = pixXWithinGrid % this.pix.sideSpace;
	const pixYSpace = pixYWithinGrid % this.pix.sideSpace;
	const aboveLUDiagonal = (pixXSpace >= pixYSpace);
	const aboveLDDiagonal = ((this.pix.sideSpace - pixXSpace) >= pixYSpace);
    return {
        x: indexX,
        y: indexY,
		direction : (aboveLUDiagonal ? (aboveLDDiagonal ? DIRECTION.UP : DIRECTION.RIGHT) : (aboveLDDiagonal ? DIRECTION.LEFT : DIRECTION.DOWN))
    };
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

// Edges ! (partly copy-pasted on space above) 
Drawer.prototype.getClickEdgeR = function (event, p_canvas, p_xDotsNumber, p_yDotsNumber) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const pixYModulo = (pixY + this.pix.borderClickDetection) % this.pix.sideSpace;
	if (pixYModulo < 2 * this.pix.borderClickDetection) {
		const answer = {
			x: Math.floor(pixX / this.pix.sideSpace),
			y: Math.floor((pixY + this.pix.borderClickDetection) / this.pix.sideSpace)
		};
		if ((answer.x < p_xDotsNumber) && (answer.x >= 0) && (answer.y <= p_yDotsNumber) && (answer.y >= 0)) {
			return answer;
		}
	}
    return null;
}

Drawer.prototype.getClickEdgeD = function (event, p_canvas, p_xDotsNumber, p_yDotsNumber) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const pixXModulo = (pixX + this.pix.borderClickDetection) % this.pix.sideSpace;
	if (pixXModulo < 2 * this.pix.borderClickDetection) {
		const answer = {
			x: Math.floor((pixX + this.pix.borderClickDetection) / this.pix.sideSpace),
			y: Math.floor(pixY / this.pix.sideSpace)
		};
		if ((answer.y < p_yDotsNumber) && (answer.y >= 0) && (answer.x <= p_xDotsNumber) && (answer.x >= 0)) {
			return answer;
		}
	}
    return null;
}

Drawer.prototype.getClickEdgeD = function (event, p_canvas, p_xDotsNumber, p_yDotsNumber) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const pixXModulo = (pixX + this.pix.borderClickDetection) % this.pix.sideSpace;
	if (pixXModulo < 2 * this.pix.borderClickDetection) {
		const answer = {
			x: Math.floor((pixX + this.pix.borderClickDetection) / this.pix.sideSpace),
			y: Math.floor(pixY / this.pix.sideSpace)
		};
		if ((answer.y < p_yDotsNumber) && (answer.y >= 0) && (answer.x <= p_xDotsNumber) && (answer.x >= 0)) {
			return answer;
		}
	}
    return null;
}

Drawer.prototype.getClickNode = function (event, p_canvas, p_xDotsNumber, p_yDotsNumber) {
	return this.getClickNodePrivate(event, p_canvas, p_xDotsNumber, p_yDotsNumber, false);
}

Drawer.prototype.getClickNodeTolerant = function (event, p_canvas, p_xDotsNumber, p_yDotsNumber) {
	return this.getClickNodePrivate(event, p_canvas, p_xDotsNumber, p_yDotsNumber, true);
}

// Copied on getClickKnotRD
Drawer.prototype.getClickNodePrivate = function(event, p_canvas, p_xDotsNumber, p_yDotsNumber, p_tolerance) {
	const pixX = this.getPixXWithinGrid(event, p_canvas);
	const pixY = this.getPixYWithinGrid(event, p_canvas);
	const pixXModulo = (pixX + this.pix.borderClickDetection) % this.pix.sideSpace;
	const pixYModulo = (pixY + this.pix.borderClickDetection) % this.pix.sideSpace;
	const pixToleranceSquareIn = (p_tolerance ? this.pix.sideSpace/2.5 : this.pix.borderClickDetection); // Middle of side of the square. 
	
	if ((pixXModulo < 2 * pixToleranceSquareIn) &&  (pixYModulo < 2 * pixToleranceSquareIn)) {
		const answer = {
			x: Math.floor((pixX + this.pix.borderClickDetection) / this.pix.sideSpace),
			y: Math.floor((pixY + this.pix.borderClickDetection) / this.pix.sideSpace)
		};
		if ((answer.x < (p_xDotsNumber)) && (answer.x >= 0) && (answer.y < p_yDotsNumber) && (answer.y >= 0)) {
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
    const centralXLength = p_parameters.xLength ? p_parameters.xLength : p_parameters.xyLength;
    const centralYLength = p_parameters.yLength ? p_parameters.yLength : p_parameters.xyLength;
	var leftXLength = 0;
	var upYLength = 0;
	var rightXLength = 0;
	var downYLength = 0;
    if (p_parameters.margin) {
        if (p_parameters.margin.leftLength) { 
			leftXLength += p_parameters.margin.leftLength; 
		}
        if (p_parameters.margin.upLength) { 
			upYLength += p_parameters.margin.upLength; 
		}
        if (p_parameters.margin.rightLength) { 
			rightXLength += p_parameters.margin.rightLength; 
		}
        if (p_parameters.margin.downLength) { 
			downYLength += p_parameters.margin.downLength; 
		}
    }
	if (p_parameters.isDotted) { // Note : so far, nothing is done between margins and dotted grids !
		leftXLength += 1/2;
		upYLength += 1/2;
		rightXLength += 1/2;
		downYLength += 1/2;
	}

    const totalXLength = leftXLength + centralXLength + rightXLength;
    const totalYLength = upYLength + centralYLength + downYLength;
	
    this.pix.sideSpace = Math.max(pixMinSpace, Math.min(pixMaxSpace, Math.min(Math.floor(pixXCanvasSize / totalXLength), Math.floor(pixYCanvasSize / totalYLength))));
	var recupPix = false;
	if (this.pix.sideSpace % 2 == 1) {
		this.pix.sideSpace++;
		recupPix = true;
	}
	// Note : size in pixels must be even to avoid nasty surprises with 4x5-tiled sizes and odd-sizes (especially since they are 16-pix long, a 16x16 square on a source becomes a (odd)x(odd) on canvas... ).
    this.pix.borderSpace = Math.max(1, Math.floor(this.pix.sideSpace / 10));
	if (recupPix && this.pix.borderSpace > 1) {
		this.pix.borderSpace--;
	}
	this.pix.borderClickDetection = this.pix.borderSpace * 2;
	this.pix.marginGrid.left = this.pix.sideSpace * leftXLength; // Possibility to add "extra pixels", who knows... (in that case they must be subtracted from pixXCanvasSize / Y)
	this.pix.marginGrid.up = this.pix.sideSpace * upYLength;
	this.pix.marginGrid.right = this.pix.sideSpace * rightXLength;
	this.pix.marginGrid.down = this.pix.sideSpace * downYLength;
	
    p_canvas.width = totalXLength * this.pix.sideSpace;
    p_canvas.height = totalYLength * this.pix.sideSpace;
}

// -------------------
// Utilitary functions

// Rounded-corners rectangle. Credits : https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
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
    return '#ffffff';
}

// With fences
Drawer.prototype.fenceToColor = function (p_fenceState) {
    switch (p_fenceState) {
		case (FENCE_STATE.OPEN): return (this.fenceColourSet.open_fence); break;
		case (FENCE_STATE.CLOSED): return (this.fenceColourSet.closed_fence); break;
		default : return this.fenceColourSet.undecided_fence;
    }
}