/**
Draws the around indications
*/
function drawAroundIndications(p_context,p_drawer,p_colorDigits,p_global){
	var pixFont = p_drawer.pix.sideSpace-p_drawer.pix.borderSpace;
	savedTextAlign = p_context.textAlign;
	savedTextBaseline = p_context.textBaseline;
	p_context.textAlign = 'center';
	p_context.textBaseline = 'middle';
	var pixXUpAndDown = p_drawer.getPixCenterX(0);
	var pixXLeft = p_drawer.getPixCenterX(-1);	
	var pixXRight = p_drawer.getPixCenterX(p_global.xyLength);
	var pixYLeftAndRight = p_drawer.getPixCenterY(0); 
	var pixYUp = p_drawer.getPixCenterY(-1);
	var pixYDown = p_drawer.getPixCenterY(p_global.xyLength);
	p_context.font = pixFont+"px Arial";
	for(var i=0;i<p_global.xyLength;i++){
		p_context.fillStyle = p_colorDigits.starIndication; //TODO perform color management
		p_context.fillText(p_global.getOsRemainColumn(i),pixXUpAndDown,pixYUp);
		p_context.fillText(p_global.getOsRemainRow(i),pixXLeft,pixYLeftAndRight);
		p_context.fillStyle = p_colorDigits.crossIndication;
		p_context.fillText(p_global.getXsRemainRow(i),pixXRight,pixYLeftAndRight);
		p_context.fillText(p_global.getXsRemainColumn(i),pixXUpAndDown,pixYDown);
		pixXUpAndDown += p_drawer.pix.sideSpace;
		pixYLeftAndRight += p_drawer.pix.sideSpace;
	}
	p_context.textAlign = savedTextAlign;
	p_context.textBaseline = savedTextBaseline;
}

/**
Draws the region indications within a space in each.
*/
function drawInsideIndications(p_context,p_drawer,p_colorDigits,p_global){
	const fontSize = p_drawer.pix.sideSpace/3;
	p_context.font = fontSize+"px Arial";
	p_context.fillStyle = p_colorDigits.regionIndication;
	var indexXFirstRegionSpace,indexYFirstRegionSpace;
	var pixLeft,pixUp;
	var textToWrite;
	var firstRegionSpace;
	for(var i=0;i<p_global.xyLength;i++){
		firstRegionSpace = p_global.getFirstSpaceRegion(i);
		pixLeft = p_drawer.getPixInnerXLeft(firstRegionSpace.x);
		pixDown = p_drawer.getPixInnerYUp(firstRegionSpace.y)+fontSize;
		textToWrite = p_global.getOsRemainRegion(i)+" "+p_global.getXsRemainRegion(i);
		p_context.fillText(textToWrite,pixLeft,pixDown);
	}
	
}

/**
Draws what's inside spaces
*/
function drawInsideSpaces(p_context,p_drawer,p_color,p_global){
	const fontSize = p_drawer.pix.sideSpace;
	p_context.font = fontSize+"px Arial";
	p_context.fillStyle = p_color.cross;
	const pixStartX = p_drawer.getPixInnerXLeft(0);  
	var pixDrawX = pixStartX;	
	var pixDrawY = p_drawer.getPixInnerYUp(0);
	var ix,iy;
	for(iy = 0;iy < p_global.xyLength;iy++){
		for(ix = 0;ix < p_global.xyLength;ix++){
			if  (p_global.getRegion(ix,iy) != BANNED){ // Should this condition be missed the extra "no star" in banned spaces would be added.
				if(p_global.getAnswer(ix,iy) == STAR){
					p_context.drawImage(document.getElementById("img_star"),0,0,64,64,pixDrawX,pixDrawY,drawer.getPixInnerSide(),drawer.getPixInnerSide());
				}
				if(p_global.getAnswer(ix,iy) == NO_STAR){
					p_context.drawImage(document.getElementById("img_x"),0,0,64,64,pixDrawX,pixDrawY,drawer.getPixInnerSide(),drawer.getPixInnerSide());	
				}
			}
			pixDrawX+=p_drawer.pix.sideSpace;
		}
		pixDrawY+=p_drawer.pix.sideSpace;
		pixDrawX = pixStartX;
	}
}

