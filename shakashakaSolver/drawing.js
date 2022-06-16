// "Autonomous" only in the sense it doesn't reuse premade functions from main drawer !
// To be done : Draw actual "half triangles" rather than quarters of them !
function drawInsideSpacesAutonomous(p_context, p_drawer, p_coloursSet, p_solver) {
	const pixInnerSide = p_drawer.getPixInnerSide();
	setupFont(p_context, pixInnerSide*4/5, FONTS.ARIAL);
	var x, y, colour;
	var pixXL, pixXR, pixYU, pixYD, pixXCenter, pixYCenter;
	p_context.textAlign = "center"; // Credits : https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/textAlign
	p_context.textBaseline = "middle";
	for (y = 0 ; y < p_solver.yLength ; y++) {
		pixYCenter = p_drawer.getPixCenterY(y);
		pixYU = p_drawer.getPixInnerYUp(y);
		pixYD = p_drawer.getPixInnerYDown(y);
		pixYStart = [pixYD, pixYU, pixYU, pixYD, pixYD]; // Supposes that directions are (left = 0, up = 1, right = 2, down = 3) !!!
		for (x = 0 ; x < p_solver.xLength ; x++) {
			pixXCenter = p_drawer.getPixCenterX(x);
			if (p_solver.isBlockedSpace(x, y)) {
				p_context.fillStyle = p_coloursSet.bannedSpace;
                p_context.fillRect(p_drawer.getPixInnerXLeft(x), p_drawer.getPixInnerYUp(y), pixInnerSide, pixInnerSide);
				if (p_solver.getNumericValue(x, y) != null) {					
					p_context.fillStyle = p_coloursSet.numberWrite; 
					p_context.fillText(p_solver.getNumericValue(x, y), pixXCenter, pixYCenter);
				}
			} else {				
				pixXL = p_drawer.getPixInnerXLeft(x);
				pixXR = p_drawer.getPixInnerXRight(x);
				pixXStart = [pixXL, pixXL, pixXR, pixXR, pixXL];			
				KnownDirections.forEach(dir => {
					colour = null;
					switch (p_solver.getAnswer(x, y, dir)) {
						case SHAKASHAKA.WHITE : colour = p_coloursSet.whiteTriangle; break;
						case SHAKASHAKA.BLACK : colour = p_coloursSet.blackTriangle; break;
					}
					drawPolygon(p_context, null, colour,
						[{pixX : pixXStart[dir], pixY : pixYStart[dir]},
						{pixX : pixXStart[dir+1], pixY : pixYStart[dir+1]},
						{pixX : pixXCenter, pixY : pixYCenter}])
				});
			}		
		}
	}
}