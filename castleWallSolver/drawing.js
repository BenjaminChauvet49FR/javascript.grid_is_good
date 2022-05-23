function draw(p_context, p_drawer, p_coloursSet, p_solver) {
	p_drawer.inhibitAutoClean();
	p_drawer.clearDrawing(p_context);
	
	function getAreaIndex(p_x, p_y) {
		switch (p_solver.getInnerOuterStateRD(p_x, p_y)) {
			case CW_POSITION.INNER : return 0; break;
			case CW_POSITION.OUTER : return 1; break;
			default : return -1; break;
		}
	}
	
	setupFont(p_context, p_drawer.getPixSide()/2, FONTS.ARIAL);
	alignFontCenter(p_context);
	const background = [DrawableColour(p_coloursSet.areaIn), DrawableColour(p_coloursSet.areaOut)];
	p_drawer.drawMeshContents2Dimensions(p_context, background, getAreaIndex, p_solver.xLength-1, p_solver.yLength-1);
	
	p_drawer.drawDotsGrid(p_context, p_solver.xLength, p_solver.yLength, 
		function(p_x, p_y) {return linkToColour(p_solver.getLinkRight(p_x, p_y), p_coloursSet)},
		function(p_x, p_y) {return linkToColour(p_solver.getLinkDown(p_x, p_y), p_coloursSet)},
		function(p_xN, p_yN) {
			switch (p_solver.getLinkSpace(p_xN, p_yN)) {
				case LOOP_STATE.CLOSED : return p_coloursSet.closedLink; break;
				case LOOP_STATE.LINKED : return p_coloursSet.linkedNode; break;
				default : return p_coloursSet.undecidedLink; break;
			}
		}, 
		function() {return DOTS_SIZE.MEDIUM},
		
		
		function(p_x, p_y) {
			if (p_solver.isBanned(p_x, p_y)) {
				p_drawer.drawCastleWallObstacle(p_context, p_coloursSet, p_x, p_y,  
				p_solver.getPosition(p_x, p_y), p_solver.getDirection(p_x, p_y), p_solver.getNumber(p_x, p_y)
				);
				return true;
			} else {
				return false;
			} 
		}
		
	)
}

function linkToColour(p_link, p_coloursSet) {
	switch (p_link) {
		case LOOP_STATE.LINKED : return p_coloursSet.linkedLink; break;
		case LOOP_STATE.CLOSED : return p_coloursSet.closedLink; break;
		default : return p_coloursSet.undecidedLink; break;
	}
}

Drawer.prototype.drawCastleWallObstacle = function(p_context, p_coloursSet, p_x, p_y,  p_colourObstacle, p_direction, p_number) {
	var colourIn, colourWrite;
	switch(p_colourObstacle) {
		case CW_POSITION.INNER : colourIn = p_coloursSet.obstacleInnerBG; colourWrite = p_coloursSet.obstacleInnerWrite; break;
		case CW_POSITION.OUTER : colourIn = p_coloursSet.obstacleOuterBG; colourWrite = p_coloursSet.obstacleOuterWrite; break;
	}
	var pixX1, pixX2, pixX3, pixY1, pixY2, pixY3;
	var drawArrowPart = false;
	const pixBack = this.getPixSide()/4;
	const pixShift = this.getPixShiftSpaceToDot();
	const pixXLeft = this.getPixXLeft(p_x) + pixShift;
	const pixYUp = this.getPixYUp(p_y) + pixShift;
	const pixXRight = this.getPixXRight(p_x) + pixShift;
	const pixYDown = this.getPixYDown(p_y) + pixShift;
	switch (p_direction) {
		case DIRECTION.LEFT: case DIRECTION.RIGHT: 
			drawArrowPart = true;
			pixY1 = this.getPixYDot(p_y);
			pixY2 = pixY1 - pixBack;
			pixY3 = pixY1 + pixBack;
			pixTextY = pixY1;
			if (p_direction == DIRECTION.LEFT) {
				pixX1 = pixXLeft + 1;
				pixX2 = pixX1 + pixBack;
				pixX3 = pixX2;
				pixTextX = (pixX2 + pixXRight) / 2;
			} else {
				pixX1 = pixXRight - 1;
				pixX2 = pixX1 - pixBack;
				pixX3 = pixX2;
				pixTextX = (pixX2 + pixXLeft) / 2;
			}
		break;
		case DIRECTION.UP: case DIRECTION.DOWN: 
			drawArrowPart = true;
			pixX1 = this.getPixXDot(p_x);
			pixX2 = pixX1 - pixBack;
			pixX3 = pixX1 + pixBack;
			pixTextX = pixX1;
			if (p_direction == DIRECTION.UP) {
				pixY1 = pixYUp + 1;
				pixY2 = pixY1 + pixBack;
				pixY3 = pixY2;
				pixTextY = (pixY2 + pixYDown) / 2;
			} else {
				pixY1 = pixYDown - 1;
				pixY2 = pixY1 - pixBack;
				pixY3 = pixY2;
				pixTextY = (pixY2 + pixYUp) / 2;
			}
		break;
	}
	p_context.fillStyle = colourIn; 
	p_context.strokeStyle = colourIn; 
	p_context.roundRect(pixXLeft, pixYUp, this.getPixSide(), this.getPixSide(), 5).fill();
	p_context.fillStyle = colourWrite; 
	p_context.strokeStyle = colourWrite; 
	if (drawArrowPart) {
		// Draw arrow and text
		p_context.beginPath(); // Note : mandatory because of what roundRect uses.		
		p_context.moveTo(pixX1, pixY1);
		p_context.lineTo(pixX2, pixY2);
		p_context.lineTo(pixX3, pixY3);
		p_context.lineTo(pixX1, pixY1);
		p_context.closePath();
		p_context.fill();
		p_context.fillText(p_number, pixTextX, pixTextY);
	}
}