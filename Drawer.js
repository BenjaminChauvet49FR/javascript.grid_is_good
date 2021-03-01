// Setup

function Drawer() {

    this.pix = {
        sideSpace: 30,
        borderSpace: 2, //Inner border
        borderClickDetection: 5, //How many pixels from the side of a space can you click to trigger the border ?
        canvasWidth: 800,
        canvasHeight: 512,
        marginGrid: {
            left: 0,
            up: 0,
            right: 0,
            down: 0
        }
    }

	this.colors = {
		combinedArrowRingIndications: '#440000'
	}
	this.wallColorSet = {
		closed_wall: '#222222',
		open_wall: '#dddddd',
		edge_walls: '#000000',
		bannedSpace: '#666666'
	}
	this.fenceColorSet = {
		closed_fence: '#222222',
		undecided_fence: '#cccccc',
		open_fence: '#eeeeff'
	}
	this.editorColorSet = { // No "setter function" for this
		selectedSpace: '#bbffcc'
	}
}

Drawer.prototype.setWallColors = function(p_wallColorSet) {
	for (const [key, value] of Object.entries(p_wallColorSet)) {
		this.wallColorSet[key] = value;
	}
}

//---------------------
// All draw functions are below

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
	p_context.clearRect(0, 0, this.pix.canvasWidth, this.pix.canvasHeight); 
	
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

Drawer.prototype.drawWalllessGrid = function (p_context, p_wallGrid, p_xLength, p_yLength) {
    var i;
	p_context.clearRect(0, 0, this.pix.canvasWidth, this.pix.canvasHeight);
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
        p_context.fillRect(pixXStart, pixY, pixTotalWidth, pixInsideThickness);
    }
    var pixX = pixXStart - this.pix.borderSpace;
    for (i = 0; i < p_xLength; i++) {
        pixX += this.pix.sideSpace;
        p_context.fillRect(pixX, pixYStart, pixInsideThickness, pixTotalHeight);
    }
    p_context.fillStyle = this.wallColorSet.edge_walls;
    p_context.fillRect(pixXStart, pixYStart, pixTotalWidth, this.pix.borderSpace);
    p_context.fillRect(pixXStart, pixYStart, this.pix.borderSpace, pixTotalHeight);
    p_context.fillRect(pixXStart, pixY, pixTotalWidth, this.pix.borderSpace);
    p_context.fillRect(pixX, pixYStart, this.pix.borderSpace, pixTotalHeight);
    p_context.fillStyle = this.wallColorSet.bannedSpace;
    if (p_wallGrid != null) {
        var ix;
        pixY = this.getPixInnerYUp(0);
        for (var iy = 0; iy < p_yLength; iy++) {
            pixX = this.getPixInnerXLeft(0);
            for (ix = 0; ix < p_xLength; ix++) {
                if (p_wallGrid.getState(ix, iy) == WALLGRID.CLOSED) {
                    p_context.fillRect(pixX, pixY, pixInnerLength, pixInnerLength);
                }
                pixX += this.pix.sideSpace;
            }
            pixY += this.pix.sideSpace;
        }
    }
}

/**
Draws a path out of a grid.
 */
/*Drawer.prototype.drawWallGridAsPath = function (p_context, p_wallGrid, p_xLength, p_yLength) {
    p_context.textAlign = 'left';
    p_context.textBaseline = 'top';
    p_context.fillStyle = this.colors.path;
    const shorter = this.pix.pathThickness;
    const longer = shorter + this.pix.sideSpace;
    const pixLeftStart = this.getPixCenterX(0) - shorter / 2;
    var pixLeft = pixLeftStart;
    var pixUp = this.getPixCenterY(0) - shorter / 2;
    for (var iy = 0; iy < p_yLength; iy++) {
        for (var ix = 0; ix < p_xLength; ix++) {
            if (iy < (p_yLength-1) && p_wallGrid.getWallD(ix, iy) == WALLGRID.OPEN) {
                p_context.fillRect(pixLeft, pixUp, shorter, longer);
            }
            if (ix < (p_xLength-1) && p_wallGrid.getWallR(ix, iy) == WALLGRID.OPEN) {
                p_context.fillRect(pixLeft, pixUp, longer, shorter);
            }
            pixLeft += this.pix.sideSpace;
            //Draws banned spaces : there should be few of them / none in a path grid.
            if (p_wallGrid.getState(ix, iy) == WALLGRID.CLOSED) {
                p_context.fillStyle = this.colors.bannedSpace;
                p_context.fillRect(this.getPixInnerXLeft(ix), this.getPixInnerYUp(iy), this.getPixInnerSide(), this.getPixInnerSide());
                p_context.fillStyle = this.colors.path;
            }
        }
        pixLeft = pixLeftStart;
        pixUp += this.pix.sideSpace;

    }
}*/ // TODO To be scrapped, soon ?

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
					p_context.fillStyle = item.colorInner; //An item property was taken rather than a method. I think this is better this way.
					if (p_context.fillStyle) {
						p_context.fill();
					}
					p_context.strokeStyle = item.colorBorder;
					if (p_context.strokeStyle) {
						p_context.stroke();
					}
				} else if (item.kind == KIND_DRAWABLE_ITEM.X) {
					this.drawCrossX(p_context, ix, iy, item);
				}
            }
            pixDrawX += this.pix.sideSpace;
        }
        pixDrawY += this.pix.sideSpace;
        pixDrawX = pixStartX;
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

Drawer.prototype.drawCrossX = function(p_context, p_xSpace, p_ySpace, p_item) {
	p_context.beginPath();
	p_context.strokeStyle = p_item.color; 
	p_context.lineWidth = Math.min(Math.floor(this.getPixInnerSide()/10,1));
	const pixAway = Math.floor(this.getPixInnerSide()/10);
	const pixLeft = this.getPixInnerXLeft(p_xSpace) + pixAway;
	const pixRight = this.getPixInnerXRight(p_xSpace) - pixAway;
	const pixUp = this.getPixInnerYUp(p_ySpace) + pixAway;
	const pixDown = this.getPixInnerYDown(p_ySpace) - pixAway;
	p_context.moveTo(pixLeft, pixUp);
	p_context.lineTo(pixRight, pixDown);
	p_context.moveTo(pixLeft, pixDown);
	p_context.lineTo(pixRight, pixUp);
	p_context.stroke(); // Credits : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/lineTo
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

// -----------------
// Drawing "one value per region" in the upper-left corner of the space

function DrawRegionArgument(p_x, p_y, p_value, p_color) {
	this.x = p_x;
	this.y = p_y;
	this.value = p_value;
	this.writeColor = p_color;
}

/**
Draws values in (presumably) first spaces of region in the same grid as where drawSpaceContents is used.
p_functionRegion : function that transforms an integer in 0 .. p_numberRegions-1 into an item containing properties {x, y, value, color}, or null
p_numberRegions : number of regions
p_police : police in which values are drawn.
*/ 
Drawer.prototype.drawRegionValues = function(p_context, p_functionRegion, p_numberRegions, p_police) {
	const fontSize = this.getPixInnerSide()/2;
	const policeName = p_police; 
	var pixLeft, pixDown;
	var valueToDraw;
	p_context.font = fontSize+"px "+policeName;
	if (!p_context.font) {
		p_context.font = fontSize+"px Arial";
	}
	p_context.textAlign = 'left'; 
	p_context.textBaseline = 'top';
	for(var i=0 ; i < p_numberRegions ; i++) {
		valueToDraw = p_functionRegion(i);
		if (valueToDraw && valueToDraw != null) {
			pixLeft = this.getPixInnerXLeft(valueToDraw.x) + this.getPixInnerSide()*1/5; // TODO, soon it may have to be pushed more on the edges for loop puzzles (wait, only Country road is concerned)
			pixUp = this.getPixInnerYUp(valueToDraw.y) + this.getPixInnerSide()*1/5;
			p_context.fillStyle = valueToDraw.writeColor;
			p_context.fillText(valueToDraw.value, pixLeft, pixUp);
		}
	}
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

//--------------------
// Setting up functions

/**
Changes the width and height of a canvas according to some parameters ; mandatory ones are the X and Y length of spaces (or xyLength if square puzzle).
 */
Drawer.prototype.adaptCanvasDimensions = function (p_canvas, p_parameters) {
    if (p_parameters.margin) {
        if (p_parameters.margin.common) {
            this.pix.marginGrid.left = p_parameters.margin.common;
            this.pix.marginGrid.up = p_parameters.margin.common;
            this.pix.marginGrid.right = p_parameters.margin.common;
            this.pix.marginGrid.down = p_parameters.margin.common;
        }
        if (p_parameters.margin.left) {
            this.pix.marginGrid.left = p_parameters.margin.left;
        }
        if (p_parameters.margin.up) {
            this.pix.marginGrid.left = p_parameters.margin.up;
        }
        if (p_parameters.margin.right) {
            this.pix.marginGrid.left = p_parameters.margin.right;
        }
        if (p_parameters.margin.down) {
            this.pix.marginGrid.left = p_parameters.margin.down;
        }
    }

    const pixMaxSpace = 32; //TODO peut changer
    const pixXCanvasSize = 800; //TODO peut changer
    const pixYCanvasSize = 512; //TODO peut changer
    const xLength = p_parameters.xLength ? p_parameters.xLength : p_parameters.xyLength;
    const yLength = p_parameters.yLength ? p_parameters.yLength : p_parameters.xyLength;
    const pixHorizontalMargins = this.pix.marginGrid.left + this.pix.marginGrid.right;
    const pixVerticalMargins = this.pix.marginGrid.up + this.pix.marginGrid.down;
    const pixXArraySize = pixXCanvasSize - pixHorizontalMargins;
    const pixYArraySize = pixYCanvasSize - pixVerticalMargins;
    this.pix.sideSpace = Math.min(pixMaxSpace, Math.min(Math.floor(pixXArraySize / xLength), Math.floor(pixYArraySize / yLength)));
    this.pix.borderSpace = Math.max(1, Math.floor(this.pix.sideSpace / 10));
    this.canvasWidth = xLength * this.pix.sideSpace + pixHorizontalMargins;
    this.canvasHeight = yLength * this.pix.sideSpace + pixVerticalMargins;
    p_canvas.width = this.canvasWidth;
    p_canvas.height = this.canvasHeight;
}

//--------------------
// Private functions

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
		case (FENCE_STATE.OPEN): return (this.fenceColorSet.open_fence); break;
		case (FENCE_STATE.CLOSED): return (this.fenceColorSet.closed_fence); break;
		default : return this.fenceColorSet.undecided_fence;
    }
}