/**
Returns the string to be contained in local storage (must be rectangular and non-empty) from the SB puzzle
X-empty ; 0 sides right and down open ; 1 side right closed ; 2 side down closed ; 3 side down closed.
p_grid : the grid to be stringed
*/
function starBattlePuzzleToString(p_grid,p_starBattleNumber){
	return p_starBattleNumber+" "+wallArrayToString(p_grid,{isSquare:true});
}

/**
Returns elements for the SB puzzle (grid + number of stars)
*/
function stringToStarBattlePuzzle(p_string){
	var stringArray = p_string.split(' ');
	//TODO hotfix avec les anciens puzzles qui mettaient le xy en premier. Désormais le nombre d'étoiles doit venir avant pour coller avec les méthodes de WallGrid.
	if (parseInt(stringArray[0]) > parseInt(stringArray[1])){
		var inter = stringArray[0];
		stringArray[0] = stringArray[1];
		stringArray[1] = inter;
	}
	var stars = stringArray[0];
	
	var answerGrid = tokensToWallArray(stringArray.slice(1,3),{isSquare : true});
	return {grid:answerGrid,starNumber:stars};
}