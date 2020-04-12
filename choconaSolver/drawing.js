/**
Draws the region indications within a space in each.
*/
function drawInsideIndications(p_context,p_drawer,p_colorDigits,p_solver){
	const fontSize = p_drawer.pix.sideSpace/3;
	p_context.font = fontSize+"px Arial";
	var indexXFirstRegionSpace,indexYFirstRegionSpace;
	var pixLeft,pixUp;
	var textToWrite;
	var firstRegionSpace;
	for(var i=0;i<p_solver.getRegionsNumber();i++){
		firstRegionSpace = p_solver.getFirstSpaceRegion(i);
		if (p_solver.getAnswer(firstRegionSpace.x,firstRegionSpace.y) == FILLING.YES){
			p_context.fillStyle = p_colorDigits.insideIndicationsOnFilled;
		}
		else{
			p_context.fillStyle = p_colorDigits.insideIndicationsOnWhite;			
		}
		pixLeft = p_drawer.getPixInnerXLeft(firstRegionSpace.x);
		pixDown = p_drawer.getPixInnerYUp(firstRegionSpace.y)+fontSize;
		textToWrite = p_solver.getOsRemainRegion(i)+" "+p_solver.getXsRemainRegion(i);
		p_context.fillText(textToWrite,pixLeft,pixDown);
	}
	
}

/**
Draws what's inside spaces
*/
function drawInsideSpaces(p_context,p_drawer,p_color,p_solver){
	const fontSize = p_drawer.pix.sideSpace;
	p_context.font = fontSize+"px Arial";
	p_context.fillStyle = p_color.cross;
	const pixStartX = p_drawer.getPixInnerXLeft(0);  
	var pixDrawX = pixStartX;	
	var pixDrawY = p_drawer.getPixInnerYUp(0);
	var pixLength = p_drawer.getPixInnerSide();
	var ix,iy;
	for(iy = 0;iy < p_solver.yLength;iy++){
		for(ix = 0;ix < p_solver.xLength;ix++){
			if  (p_solver.getRegion(ix,iy) != BANNED){ // Should this condition be missed... (see star battle)
				if(p_solver.getAnswer(ix,iy) == FILLING.YES){
					p_context.fillStyle = p_color.validSquare;
					p_context.fillRect(pixDrawX,pixDrawY,pixLength,pixLength);
				}
				if(p_solver.getAnswer(ix,iy) == FILLING.NO){
					p_context.drawImage(document.getElementById("img_x"),0,0,64,64,pixDrawX,pixDrawY,drawer.getPixInnerSide(),drawer.getPixInnerSide());	
				}
			}
			pixDrawX+=p_drawer.pix.sideSpace;
		}
		pixDrawY+=p_drawer.pix.sideSpace;
		pixDrawX = pixStartX;
	}
}
