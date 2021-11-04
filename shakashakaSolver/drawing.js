// "Autonomous" only in the sense it doesn't reuse premade functions from main drawer !
// To be done : Draw actual "half triangles" rather than quarters of them !
function drawInsideSpacesAutonomous(p_context, p_drawer, p_colourSet, p_solver) {
	const pixInnerSide = p_drawer.getPixInnerSide();
	setupFont(p_context, pixInnerSide*4/5, "Arial");
	var x, y, hasOne;
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
				p_context.fillStyle = p_colourSet.bannedSpace;
                p_context.fillRect(p_drawer.getPixInnerXLeft(x), p_drawer.getPixInnerYUp(y), pixInnerSide, pixInnerSide);
				if (p_solver.getNumericValue(x, y) != null) {					
					p_context.fillStyle = p_colourSet.numberWrite; 
					p_context.fillText(p_solver.getNumericValue(x, y), pixXCenter, pixYCenter);
				}
			} else {				
				pixXL = p_drawer.getPixInnerXLeft(x);
				pixXR = p_drawer.getPixInnerXRight(x);
				pixXStart = [pixXL, pixXL, pixXR, pixXR, pixXL];			
				KnownDirections.forEach(dir => {
					hasOne = true;
					switch (p_solver.getAnswer(x, y, dir)) {
						case SHAKASHAKA.WHITE : p_context.fillStyle = p_colourSet.whiteTriangle; break;
						case SHAKASHAKA.BLACK : p_context.fillStyle = p_colourSet.blackTriangle; break;
						default : hasOne = false; break;
					}
					if (hasOne) {
						p_context.beginPath();
						p_context.moveTo(pixXStart[dir], pixYStart[dir]);
						p_context.lineTo(pixXStart[dir + 1], pixYStart[dir + 1]);
						p_context.lineTo(pixXCenter, pixYCenter);
						p_context.lineTo(pixXStart[dir], pixYStart[dir]);
						p_context.closePath();
						p_context.fill();
					}
				});
			}		
		}
	}
}