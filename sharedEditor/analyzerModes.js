const ANALYZER_MODE = {
	WALLS : {id : 0, hasWalls : true, label : "Murs simples"},
	NUMBERS_WALLED : {id : 1, hasWalls : true, label : "Murs et chiffres"},
	NUMBERS_SUDOKU : {id : 2, hasFixedWalls : true, label : "Sudoku"},
	NOT_GREY : {id : 3, hasWalls : false, label : "Cases non grises 204"},
	GREY_NUMBERS_WALLED : {id : 4, hasWalls : true, greyBackground : true, label : "Cases grises 204 + murs"},
	NUMBERS_LEFT_UP_WALLED : {id : 5, hasWalls : true, label : "Murs et chiffres en haut à gauche"},
	NOT_GREY_WALLED : {id : 6, hasWalls : true, label : "Cases non grises 204 + murs"},
	BLUE_ON_WHITE : {id : 7, hasWalls : false, label : "Cases avec du bleu"},
	BLACK_ON_WHITE : {id : 8, hasWalls : false, label : "Cases avec du noir"},
	FROM_BLACK : {id : 9, hasWalls : false, label : "Cases d'une noirceur (whiteness < 200)"},
	FROM_BLACK_2 : {id : 10, hasWalls : false, label : "Cases avec du noir sur diagonale GH-DB"},
	SURAROMU : {id : 11, hasWalls : false, label : "Cases Suramoru"},
	
	MOONSUN : {id : 100, hasWalls : true, label : "Moonsun 255 170"},
	PLAYSTATION_SHAPES : {id : 101, hasWalls : true, label : "Trinité RGB 170"},
	PEARLS : {id : 102, hasWalls : false, label : "Perles sur fond blanc"},
	YAJI : {id : 103, hasWalls : false, label : "Pénétration blanc/noir gauche"},
	SHINGOKI_DOTTED : {id : 104, hasWalls : false, label : "Boules noires/blanches avec numéros"}, 
	YAGIT : {id : 105, hasWalls : false, label : "(136, 204, 136) (136, 136, 255) et noeuds"}, 
	GALAXIES_GREY : {id : 106, hasWalls : false, label : "Centres gris pour Galaxy (pas de blanc sur 5 cases)"},
	GALAXIES_PEARLY : {id : 107, hasWalls : false, label : "Perle blanche pour Galaxy"},
	
	NUMBER_BALL_BLACK_WHITE : {id : 200, hasWalls : false, label : "Noir ou pénétration blanc/noir gauche"},
	CASTLE_WALL : {id : 201, hasWalls : false, label : "Noir ou pénétration blanc/noir gauche"},
	
	BLUE_NET : {id : 301, hasWalls : false, label : "Filet à arêtes bleues"},
	
}
