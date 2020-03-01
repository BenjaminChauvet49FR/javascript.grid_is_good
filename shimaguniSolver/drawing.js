/**
Draws the around indications
*/
function drawAroundIndications(p_context,p_drawer,p_colorDigits,p_solver){
	var pixFont = p_drawer.pix.sideSpace-p_drawer.pix.borderSpace;
	savedTextAlign = p_context.textAlign;
	savedTextBaseline = p_context.textBaseline;
	p_context.textAlign = 'center';
	p_context.textBaseline = 'middle';
	var pixXUpAndDown = p_drawer.getPixCenterX(0);
	var pixXLeft = p_drawer.getPixCenterX(-1);	
	var pixXRight = p_drawer.getPixCenterX(p_solver.xLength);
	var pixYLeftAndRight = p_drawer.getPixCenterY(0); 
	var pixYUp = p_drawer.getPixCenterY(-1);
	var pixYDown = p_drawer.getPixCenterY(p_solver.yLength);
	p_context.font = pixFont+"px Arial";
	for(var i=0;i<p_solver.xyLength;i++){
		p_context.fillStyle = p_colorDigits.starIndication; //TODO perform color management
		p_context.fillText(p_solver.getOsRemainColumn(i),pixXUpAndDown,pixYUp);
		p_context.fillText(p_solver.getOsRemainRow(i),pixXLeft,pixYLeftAndRight);
		p_context.fillStyle = p_colorDigits.crossIndication;
		p_context.fillText(p_solver.getXsRemainRow(i),pixXRight,pixYLeftAndRight);
		p_context.fillText(p_solver.getXsRemainColumn(i),pixXUpAndDown,pixYDown);
		pixXUpAndDown += p_drawer.pix.sideSpace;
		pixYLeftAndRight += p_drawer.pix.sideSpace;
	}
	p_context.textAlign = savedTextAlign;
	p_context.textBaseline = savedTextBaseline;
}

/**
Draws what's inside spaces
*/
function drawInsideSpaces(p_context,p_drawer,p_color,p_solver){
	const fontSize = p_drawer.getPixInnerSide()/2;
	p_context.font = fontSize+"px Arial";
	p_context.textAlign = 'left'; 
	p_context.textBaseline = 'top';
	const pixStartX = p_drawer.getPixInnerXLeft(0);  
	var pixDrawX = pixStartX;	
	var pixDrawY = p_drawer.getPixInnerYUp(0);
	var ix,iy;
	for(iy = 0;iy < p_solver.yLength;iy++){
		for(ix = 0;ix < p_solver.xLength;ix++){
			//if (p_solver.getRegion(ix,iy) != BANNED){  TODO Manage that case where the space belongs to no region...
				if(p_solver.getAnswer(ix,iy) == FILLING.YES){
					p_context.fillStyle = p_color.validSquare;
					p_context.fillRect(pixDrawX,pixDrawY,p_drawer.getPixInnerSide(),p_drawer.getPixInnerSide());
				}
				if(p_solver.getAnswer(ix,iy) == FILLING.NO){
					p_context.drawImage(document.getElementById("img_x"),0,0,64,64,pixDrawX,pixDrawY,drawer.getPixInnerSide(),drawer.getPixInnerSide());	
				}
			//}
			pixDrawX+=p_drawer.pix.sideSpace;
		}
		pixDrawY+=p_drawer.pix.sideSpace;
		pixDrawX = pixStartX;
	}
	
	var pixLeft,pixDown,space;
	for(var i=0;i<p_solver.regions.length;i++){
		if (p_solver.forcedValue(i) != NOT_FORCED){
			space = p_solver.getSpaceCoordinates(i,0);
			pixLeft = p_drawer.getPixInnerXLeft(space.x)+2;
			pixUp = p_drawer.getPixInnerYUp(space.y)+2;
			if (p_solver.getAnswer(space.x,space.y) == FILLING.YES){
				p_context.fillStyle = p_color.reflectWrite;
			} else{
				p_context.fillStyle = p_color.standardWrite;
			}
			p_context.fillText(p_solver.forcedValue(i),pixLeft,pixUp);
		}
	}
}

