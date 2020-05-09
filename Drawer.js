function Drawer() {

    this.pix = {
        sideSpace: 30,
        borderSpace: 2, //Inner border
        pathThickness: 4, //Divided by 2 at a point
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

    //All the colors used in the scenery
    this.colors = {
        closed_wall: '#222222',
        open_wall: '#dddddd',
        edge_walls: '#000000',
        bannedSpace: '#666666',
        selectedSpace: '#bbffcc',
        rainbowSpaces: ["#6666ff", "#ff6666", "#66ff66",
            "#66ffff", "#ffff66", "#ff66ff",
            "#cc66ff", "#ffcc66", "#66ffcc",
            "#ff00cc", "#00ccff", "#ccff00"],
        antiCloseWrite: '#00ffff',
        standardWrite: '#000000',
        path: '#006600'
    }
}

/**
Sets up the margin grid. Should only be set up at the beginning of the string.
 */
Drawer.prototype.setMarginGrid = function (p_left, p_up, p_right, p_down) { //TODO inutile pour l'instant ; deviendra utile lorsqu'on réglera les ticks on/off... ?
    this.pix.marginGrid.left = p_left;
    this.pix.marginGrid.up = p_up;
    this.pix.marginGrid.right = p_right;
    this.pix.marginGrid.down = p_down;
}

//---------------------
// All drawing functions

/**
Draw the grid on-screen on p_context, with p_editorCore informations, with this.pix and p_colors information for pixels and colors
*/
Drawer.prototype.drawGrid = function (p_context, p_editorCore) {
    const xLength = p_editorCore.getXLength();
    const yLength = p_editorCore.getYLength();
    if (p_editorCore.hasWallGrid()) {
        if (p_editorCore.hasWalls()) {
            this.drawWallGrid(p_context, p_editorCore.wallGrid, xLength, yLength);
        } else {
            this.drawWalllessGrid(p_context, p_editorCore.wallGrid, xLength, yLength);
        }
        // Selection
        for (var iy = 0; iy < yLength; iy++) {
            for (var ix = 0; ix < xLength; ix++) {
                if (p_editorCore.getSelection(ix, iy) == SELECTED.YES) {
                    p_context.fillStyle = this.colors.selectedSpace;
                    p_context.fillRect(this.getPixInnerXLeft(ix), this.getPixInnerYUp(iy), this.getPixInnerSide(), this.getPixInnerSide());
                }
            }
        }
    }
	
	if (p_editorCore.getGrid(GRID_ID.NUMBER_REGION)) {
	    this.drawNumbersLittle(p_context, p_editorCore.getGrid(GRID_ID.NUMBER_REGION), xLength, yLength);
	}
		
    //Paths
    if (p_editorCore.hasPathGrid()) {
        this.drawWalllessGrid(p_context, null, xLength, yLength);
        this.drawWallGridAsPath(p_context, p_editorCore.pathGrid, xLength, yLength);
    }
}

Drawer.prototype.drawWallGrid = function (p_context, p_wallGrid, p_xLength, p_yLength) {
    var ix,
    iy,
    indexRegion;

    //Upper-left pixel of the horizontal walls (Horiz) and vertical walls (Vert) ; pillars aren't part of walls (meeting of 4 walls)
    const pixStartXVert = this.pix.marginGrid.left + this.pix.sideSpace - this.pix.borderSpace;
    const pixStartXHoriz = this.pix.marginGrid.left + this.pix.borderSpace;
    var pixDrawXHoriz = pixStartXHoriz;
    var pixDrawYHoriz = this.pix.marginGrid.up + this.pix.sideSpace - this.pix.borderSpace;
    var pixDrawXVert = pixStartXVert;
    var pixDrawYVert = this.pix.marginGrid.up + this.pix.borderSpace;
    var innerSpaceNotColored;

    //Rectangle dimensions
    const pixLength = this.pix.sideSpace - 2 * this.pix.borderSpace;
    const pixThickness = 2 * this.pix.borderSpace;

    //Go !
    p_context.clearRect(0, 0, this.pix.canvasWidth, this.pix.canvasHeight); //TODO best place to put this function ?
    for (iy = 0; iy < p_yLength; iy++) {
        for (ix = 0; ix < p_xLength; ix++) {
            //Draw down wall
            if (iy <= p_yLength - 2) {
                p_context.fillStyle = this.wallToColor(p_wallGrid.getWallD(ix, iy));
                p_context.fillRect(pixDrawXHoriz, pixDrawYHoriz, pixLength, pixThickness);
            }
            //Draw right wall
            if (ix <= p_xLength - 2) {
                p_context.fillStyle = this.wallToColor(p_wallGrid.getWallR(ix, iy));
                p_context.fillRect(pixDrawXVert, pixDrawYVert, pixThickness, pixLength);
            }
            //Draw pillar
            if ((ix <= p_xLength - 2) && (iy <= p_yLength - 2)) {
                if (p_wallGrid.getWallR(ix, iy) == WALLGRID.CLOSED || p_wallGrid.getWallD(ix, iy) == WALLGRID.CLOSED ||
                    p_wallGrid.getWallR(ix, iy + 1) == WALLGRID.CLOSED || p_wallGrid.getWallD(ix + 1, iy) == WALLGRID.CLOSED) {
                    p_context.fillStyle = this.wallToColor(WALLGRID.CLOSED);
                } else {
                    p_context.fillStyle = this.wallToColor(WALLGRID.OPEN);
                }
                p_context.fillRect(pixDrawXVert, pixDrawYHoriz, pixThickness, pixThickness);
            }
            //Draw inside space
            if (p_wallGrid.getState(ix, iy) == WALLGRID.CLOSED) {
                p_context.fillStyle = this.colors.bannedSpace;
                p_context.fillRect(pixDrawXHoriz, pixDrawYVert, pixLength, pixLength);
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
    p_context.fillStyle = this.colors.edge_walls;
    p_context.fillRect(this.pix.marginGrid.left, this.pix.marginGrid.up, this.pix.borderSpace, pixTotalHeight);
    p_context.fillRect(this.pix.marginGrid.left, this.pix.marginGrid.up, pixTotalWidth, this.pix.borderSpace);
    p_context.fillRect(this.pix.marginGrid.left + pixTotalWidth - this.pix.borderSpace, this.pix.marginGrid.up,
        this.pix.borderSpace, pixTotalHeight);
    p_context.fillRect(this.pix.marginGrid.left, this.pix.marginGrid.up + pixTotalHeight - this.pix.borderSpace,
        pixTotalWidth, this.pix.borderSpace);
}

Drawer.prototype.drawWalllessGrid = function (p_context, p_wallGrid, p_xLength, p_yLength) {
    p_context.clearRect(0, 0, this.pix.canvasWidth, this.pix.canvasHeight); //TODO best place to put this function ?
    var i;
    const pixTotalWidth = p_xLength * this.pix.sideSpace;
    const pixTotalHeight = p_yLength * this.pix.sideSpace;
    var pixXStart = this.pix.marginGrid.left;
    var pixYStart = this.pix.marginGrid.up;
    var pixY = pixYStart - this.pix.borderSpace;
    const pixInsideThickness = 2 * this.pix.borderSpace;
    const pixInnerLength = this.getPixInnerSide();
    p_context.fillStyle = this.colors.open_wall;
    for (i = 0; i < p_yLength; i++) {
        pixY += this.pix.sideSpace;
        p_context.fillRect(pixXStart, pixY, pixTotalWidth, pixInsideThickness);
    }
    var pixX = pixXStart - this.pix.borderSpace;
    for (i = 0; i < p_xLength; i++) {
        pixX += this.pix.sideSpace;
        p_context.fillRect(pixX, pixYStart, pixInsideThickness, pixTotalHeight);
    }
    p_context.fillStyle = this.colors.edge_walls;
    p_context.fillRect(pixXStart, pixYStart, pixTotalWidth, this.pix.borderSpace);
    p_context.fillRect(pixXStart, pixYStart, this.pix.borderSpace, pixTotalHeight);
    p_context.fillRect(pixXStart, pixY, pixTotalWidth, this.pix.borderSpace);
    p_context.fillRect(pixX, pixYStart, this.pix.borderSpace, pixTotalHeight);
    p_context.fillStyle = this.colors.closed_wall;
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

Drawer.prototype.drawNumbersLittle = function (p_context, p_numberGrid, p_xLength, p_yLength) {
    this.drawNumbersLittleInCorner(p_context, null, p_numberGrid, p_xLength, p_yLength)
}

Drawer.prototype.drawNumbersLittleInCorner = function (p_context, p_wallGrid, p_numberGrid, p_xLength, p_yLength) {
    p_context.textAlign = 'left';
    p_context.textBaseline = 'top';
    p_context.font = this.getPixInnerSide() / 2 + "px Arial";
    p_context.fillStyle = this.colors.standardWrite;
    var ix,
    iy,
    number;
    for (iy = 0; iy < p_yLength; iy++) {
        for (ix = 0; ix < p_xLength; ix++) {
            number = p_numberGrid.get(ix, iy);
            if (number != null) {
                pixLeft = this.getPixInnerXLeft(ix) + 2;
                pixDown = this.getPixInnerYUp(iy) + 2;
                if (p_wallGrid && p_wallGrid.getState(ix, iy) == CLOSED) {
                    p_context.fillStyle = this.colors.antiCloseWrite;
                } else {
                    p_context.fillStyle = this.colors.standardWrite;
                }
                p_context.fillText(number, pixLeft, pixDown);
            }
        }
    }
}

/**
Draws a path out of a grid.
 */
Drawer.prototype.drawWallGridAsPath = function (p_context, p_wallGrid, p_xLength, p_yLength) {
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
            if (p_wallGrid.getWallD(ix, iy) == WALLGRID.OPEN) {
                p_context.fillRect(pixLeft, pixUp, shorter, longer);
            }
            if (p_wallGrid.getWallR(ix, iy) == WALLGRID.OPEN) {
                p_context.fillRect(pixLeft, pixUp, longer, shorter);
            }
            pixLeft += this.pix.sideSpace;
            //Draws banned spaces : there should be few of them / none in a path grid.
            if (p_wallGrid.getState(ix, iy) == WALLGRID.CLOSED) {
                p_context.fillStyle = this.colors.bannedSpace;
                p_context.fillRect(getPixInnerXLeft(), getPixInnerYUp(), getPixInnerSide(), getPixInnerSide());
                p_context.fillStyle = this.colors.path;
            }
        }
        pixLeft = pixLeftStart;
        pixUp += this.pix.sideSpace;

    }
}

/**
(private string)
Gives the correct wall color from a wall type (a #RRGGBB string)
@p_wallType : a type of wall between 2 spaces
 */
Drawer.prototype.wallToColor = function (p_wallType) {
    switch (p_wallType) {
    case (WALLGRID.OPEN):
        return (this.colors.open_wall);
        break;
    case (WALLGRID.CLOSED):
        return (this.colors.closed_wall);
        break;
    }
    return "#ffffff";
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

//---------------------
// All input functions

//Return coordinates of an element with the form {x: ... , y: ...} (space, wall ; upper-left = 0,0)

/**
If a click is done on a space, otherwise return null
 */
Drawer.prototype.getClickSpace = function (event, p_canvas, p_xLength, p_yLength) {
    var indexX = Math.floor(this.getPixXWithinGrid(event, p_canvas) / this.pix.sideSpace);
    var indexY = Math.floor(this.getPixYWithinGrid(event, p_canvas) / this.pix.sideSpace);
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
Drawer.prototype.getClickWallR = function (event, p_canvas, p_editorCore) {
    if (p_editorCore.hasWalls()) {
        var pixX = this.getPixXWithinGrid(event, p_canvas);
        var pixY = this.getPixYWithinGrid(event, p_canvas);
        var pixXModulo = (pixX + this.pix.borderClickDetection) % this.pix.sideSpace;
        if (pixXModulo < 2 * this.pix.borderClickDetection) {
            var answer = {
                x: Math.floor((pixX + this.pix.borderClickDetection) / this.pix.sideSpace) - 1,
                y: Math.floor(pixY / this.pix.sideSpace)
            };
            if ((answer.x < (p_editorCore.getXLength() - 1)) && (answer.x >= 0) && (answer.y < p_editorCore.getYLength()) && (answer.y >= 0)) {
                return answer;
            }
        }
    }
    return null;
}

/**
Same as above with down walls
 */
Drawer.prototype.getClickWallD = function (event, p_canvas, p_editorCore) {
    if (p_editorCore.hasWalls()) {
        var pixX = this.getPixXWithinGrid(event, p_canvas);
        var pixY = this.getPixYWithinGrid(event, p_canvas);
        var pixYModulo = (pixY + this.pix.borderClickDetection) % this.pix.sideSpace;
        if (pixYModulo < 2 * this.pix.borderClickDetection) {
            var answer = {
                x: Math.floor(pixX / this.pix.sideSpace),
                y: Math.floor((pixY + this.pix.borderClickDetection) / this.pix.sideSpace) - 1
            };
            if ((answer.y < (p_editorCore.getYLength() - 1)) && (answer.y >= 0) && (answer.x < p_editorCore.getXLength()) && (answer.x >= 0)) {
                return answer;
            }
        }
    }
    return null;
}

Drawer.prototype.getClickAroundWallR = function (event, p_canvas, p_editorCore) {
    if (p_editorCore.hasWalls()) {
        const pixX = this.getPixXWithinGrid(event, p_canvas);
        const pixY = this.getPixYWithinGrid(event, p_canvas);
        const sideSpace = this.pix.sideSpace;
        var distanceX = pixX % sideSpace;
        distanceX = Math.min(distanceX, sideSpace - distanceX);
        var distanceY = pixY % sideSpace;
        distanceY = Math.min(distanceY, sideSpace - distanceY);
        if (distanceX < distanceY) {
            return {
                x: Math.floor((pixX - sideSpace / 2) / sideSpace),
                y: Math.floor(pixY / sideSpace)
            }
        }
    }
    return null;
}

Drawer.prototype.getClickAroundWallD = function (event, p_canvas, p_editorCore) {
    if (p_editorCore.hasWalls()) {
        const pixX = this.getPixXWithinGrid(event, p_canvas);
        const pixY = this.getPixYWithinGrid(event, p_canvas);
        const sideSpace = this.pix.sideSpace;
        var distanceX = pixX % sideSpace;
        distanceX = Math.min(distanceX, sideSpace - distanceX);
        var distanceY = pixY % sideSpace;
        distanceY = Math.min(distanceY, sideSpace - distanceY);
        if (distanceX > distanceY) {
            return {
                x: Math.floor(pixX / sideSpace),
                y: Math.floor((pixY - sideSpace / 2) / sideSpace)
            }
        }
    }
    return null;
}

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
                    p_context.drawImage(item.getImage(), item.x1, item.y1, item.x2, item.y2, pixDrawX, pixDrawY, pixInnerSide, pixInnerSide);
                } else if (item.kind = KIND_DRAWABLE_ITEM.COLOR) {
                    p_context.fillStyle = item.getColorString();
                    p_context.fillRect(pixDrawX, pixDrawY, pixInnerSide, pixInnerSide);
                }
            }
            pixDrawX += this.pix.sideSpace;
        }
        pixDrawY += this.pix.sideSpace;
        pixDrawX = pixStartX;
    }
}

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
                    if (leftOn && upOn && !p_function(ix - 1, iy - 1) == p_number) {
                        coordinateXInMap = 4
                            coordinateYInMap = 0;
                    } else {
                        coordinateXInMap = xLeftContinue;
                        coordinateYInMap = yUpContinue;
                    }
                    drawQuarter(0, 0);
                //RU corner
                if (rightOn && upOn && !p_function(ix + 1, iy - 1) == p_number) {
                    coordinateXInMap = 4
                        coordinateYInMap = 1;
                } else {
                    coordinateXInMap = xRightContinue;
                    coordinateYInMap = yUpContinue;
                }
                drawQuarter(1, 0);
                //RD corner
                if (rightOn && downOn && !p_function(ix + 1, iy + 1) == p_number) {
                    coordinateXInMap = 4
                        coordinateYInMap = 2;
                } else {
                    coordinateXInMap = xRightContinue;
                    coordinateYInMap = yDownContinue;
                }
                drawQuarter(1, 1);
                //LD corner
                if (leftOn && downOn && !p_function(ix - 1, iy + 1) == p_number) {
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
