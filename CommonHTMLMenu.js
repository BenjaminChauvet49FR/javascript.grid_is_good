//ATTENTION DANGER !
//Ce fichier contient des valeurs en dur sur :
// -les noms de dossier contenant les solveurs/éditeurs
// -les noms de fichier HTML
// -un identifiant d'élément HTML présent dans les pages de chaque solveur/éditeur (pour ne pas avoir à régenerer le HTML à chaque actualisation de page)

function createReferenceElement(p_path, p_displayedText, p_hoverText) {
	const aNode = document.createElement("a");
    aNode.setAttribute("href", p_path);
    aNode.innerText = p_displayedText;
	aNode.setAttribute("title", p_hoverText);
	return aNode;
} // Credits for mouse hovering : http://sites.cognitivescience.co/knowledgebase/resources/using-google-sites/creating-mouseover-text-with-html (yes it's title)

function addMenuPartEditor(p_divElement, p_menuPart) {
	addMenuPart(p_divElement, p_menuPart, "Editor");
}

function addMenuPartSolver(p_divElement, p_menuPart) {
	addMenuPart(p_divElement, p_menuPart, "Solver");
}

function addMenuPart(p_divElement, p_menuPart, p_family) {
	addText(p_divElement, p_menuPart.displayName+" : ");
	p_menuPart.typeList.sort(function(a, b) {
		return (b.displayName > a.displayName ? -1 : (a.displayName > b.displayName ? 1 : 0));
	});
	p_menuPart.typeList.forEach( type => {
		p_divElement.appendChild(createReferenceElement(getHTMLpath(p_family, type.name), type.displayName, type.hoverDescription));
		addText(p_divElement, " ");		
	});
}

function getHTMLpath(p_type, p_family) {
    return "../" + p_family + p_type + "/" + p_type + ".html";
}

function addText(p_divElement, p_text) {
    p_divElement.appendChild(document.createTextNode(p_text));
}

const menuEditor = {
	displayName : "Editeur",
	typeList : [
		{name : "shared", displayName : "Editeur partagé", hoverDescription : "Editeur de puzzles"}
	]
}

var menuSolvers = [];

menuSolvers.push({
	displayName : "Binaires grille",
	documentPage : "Solver",
	typeList : [
		{name : "akari", displayName : "Akari", hoverDescription : "Ampoules qui éclairent toute la grille sans s'éclairer mutuellement"},
		{name : "chocona", displayName : "Chocona", hoverDescription : "Rectangles dans une grille en région"},
		{name : "gappy", displayName : "Gappy", hoverDescription : "2 cases par ligne et colonne avec une séparation exacte, sans contact"},
		{name : "norinori", displayName : "Norinori", hoverDescription : "Dominos, 2 cases par région"},
		{name : "putteria", displayName : "Putteria", hoverDescription : "Numéro de taille de la région, pas 2 numéros adjacents ni de répétition en ligne ou colonne"},
		{name : "rukkuea", displayName : "Rukkuea", hoverDescription : "Carrés, ceux de même taille ne doivent pas être en vis-à-vis"},
		{name : "shimaguni", displayName : "Shimaguni", hoverDescription : "Polyominos séparés dans les régions, 2 régions différentes admettant des polyominos de taille différente"},
		{name : "starBattle", displayName : "Star battle", hoverDescription : "Etoiles dans chaque ligne, colonne et région, sans contact"},
		{name : "stostone", displayName : "Stostone", hoverDescription : "Polyominos séparés dans les régions correspondant à des pierres tombantes"},
	]
});

menuSolvers.push({
	displayName : "Remplissages de régions avec des nombres",
	typeList : [
		{name : "hakyuu", displayName : "Hakyuu", hoverDescription : "Nombres de 1 à N par région, séparation suffisante entre 2 nombres identiques sur une ligne ou colonne"}
	]
});

menuSolvers.push({
	displayName : "Binaires avec adjacence sans contact orthogonal fermé non banni",
	typeList : [
		{name : "ayeHeya", displayName : "AYE-Heya", hoverDescription : "Heyawake avec cases symétriques centralement dans une région"},
		{name : "curvingRoad", displayName : "Curving road", hoverDescription : "Pas plus de 2 tournants sur un chemin ouvert entre deux cercles"},
		{name : "heyawake", displayName : "Heyawake", hoverDescription : "Bandes de cases ouvertes traversant une frontière de région maximum"},
		{name : "kuromasu", displayName : "Kuromasu", hoverDescription : "Visions de cases ouvertes"},
		{name : "usoone", displayName : "Usoone", hoverDescription : "Indications de contact numérique, 1 case menteuse par région"},
	]
});

menuSolvers.push({
	displayName : "Binaires avec adjacence sans carré 2x2 ouvert",
	typeList : [
		{name : "canalView", displayName : "CanalView", hoverDescription : "Visions de cases ouvertes consécutives en ligne et colonne"},
		{name : "LITS", displayName : "LITS", hoverDescription : "Tetrominos, deux en contact doivent être différents"},
		{name : "nurikabe", displayName : "Nurikabe", hoverDescription : "Les cases fermées forment des îles de surfaces imposées"},
		{name : "tapa", displayName : "Tapa", hoverDescription : "Alentour ortho-diagonal d'une case"},
		{name : "yajikabe", displayName : "Yajikabe", hoverDescription : "Indications flécho-numériques"}
	]
});

menuSolvers.push({
	displayName : "Binaires avec adjacence divers",
	typeList : [
		{name : "aqre", displayName : "Aqre", hoverDescription : "Pas trois cases alignées ouvertes ou fermées à la suite, régions indicatives"},
		{name : "corral", displayName : "Corral", hoverDescription : "Visions de cases ouvertes en ligne et colonne, les cases fermées doivent accéder à l'extérieur"},
	]
});

menuSolvers.push({
	displayName : "Binaires non-assumés avec adjacence ",
	typeList : [
		{name : "sukoro", displayName : "Sukoro", hoverDescription : "Nombre = nombre de voisins. Pas deux nombres identiques orthogonaement adjacents."}
	]
});

menuSolvers.push({
	displayName : "Multiples avec adjacence",
	typeList : [
		{name : "shugaku", displayName : "Shugaku", hoverDescription : "Carrés et ronds et dominos, couloir ouvert sans 2x2, contraintes"},
		{name : "hakoiri", displayName : "Hakoiri", hoverDescription : "Un carré un rond un triangle par région, sans contact de formes identiques"}
	]
});

menuSolvers.push({
	displayName : "Boucles avec contraintes sur case",
	typeList : [
		{name : "koburin", displayName : "Koburin", hoverDescription : "Indications d'adjacence, sans contact orthogonal fermé non-banni"},
		{name : "linesweeper", displayName : "Linesweeper", hoverDescription : "Indications d'adjacence ortho-diagonale comme au Minesweeper"},
		{name : "regionalin", displayName : "Regionalin", hoverDescription : "Indications par région, sans contact orthogonal fermé non-banni. Aussi appelé Regional Yajilin (mais n'a pas de flèches)"},
		{name : "yajilin", displayName : "Yajilin", hoverDescription : "Indications flécho-numériques, sans contact orthogonal fermé non-banni"}
	]
});

menuSolvers.push({
	displayName : "Boucles avec contraintes sur lien",
	typeList : [
		{name : "castleWall", displayName : "Castle Wall", hoverDescription : "Intérieur et extérieur de la boucle"},
		{name : "grandTour", displayName : "Grand Tour", hoverDescription : "Tous les noeuds doivent être traversés, certains liens sont imposés"},
		{name : "slitherlink", displayName : "Slitherlink", hoverDescription : "Combien d'arêtes traversées autour d'une maille ?"},
	]
});

menuSolvers.push({
	displayName : "Boucles opposant ligne droite et virages",
	typeList : [
		{name : "detour", displayName : "Detour", hoverDescription : "Combien de tournants par région ?"},
		{name : "geradeweg", displayName : "Geradeweg", hoverDescription : "Lignes droites traversant les nombres"},
		{name : "masyu", displayName : "Masyu", hoverDescription : "Perles blanches et noires à traverser"},
		{name : "shingoki", displayName : "Shingoki", hoverDescription : "Perles blanches et noires numérotées donnant les longueurs des lignes"}
	]
});

menuSolvers.push({
	displayName : "Boucles à région",
	typeList : [
		{name : "countryRoad", displayName : "CountryRoad", hoverDescription : "2 cases de part et d'autre d'une frontière ne doivent pas rester non-visitées"},
		{name : "entryExit", displayName : "EntryExit", hoverDescription : "Boucle régionale classique"},	
		{name : "moonsun", displayName : "Moonsun", hoverDescription : "Régions alternativement solaires et lunaires"}
	]
});

menuSolvers.push({
	displayName : "Boucles à ordre",
	typeList : [
		{name : "suraromu", displayName : "Suraromu", hoverDescription : "Traverser les portes dans le bon ordre"}
	]
});

menuSolvers.push({
	displayName : "Découpage en région",
	typeList : [
		{name : "fillomino", displayName : "Fillomino", hoverDescription : "Polyominos, ceux de même taille ne peuvent pas se toucher"},
		{name : "firumatto", displayName : "Firumatto", hoverDescription : "Bandes de taille 1 à 4, celles de même taille ne peuvent pas se toucher"},
		{name : "galaxies", displayName : "Galaxies", hoverDescription : "Galaxies symétriques centralement sur un centre"},
		{name : "usotatami", displayName : "Usotatami", hoverDescription : "Bandes avec un nombre unique n'indiquant pas la longueur"}
	]
});

menuSolvers.push({
	displayName : "Binaires divers (hors grille)",
	typeList : [
		{name : "shakashaka", displayName : "Shakashaka", hoverDescription : "Placer des triangles noirs pour que les surfaces blanches soient des rectangles"},
		{name : "stitches", displayName : "Stitches", hoverDescription : "Points de couture entre régions"},
		{name : "yagit", displayName : "Yagit", hoverDescription : "Séparer ronds et carrés avec des cloisons qui vont tout droit"}
	]
});

menuSolvers.push({
	displayName : "Sudokus",
	typeList : [
		{name : "sudoku", displayName : "Sudoku", hoverDescription : "Sudoku classique ; peut avoir plusieurs grilles imbriquées"}
	]
});

menuSolvers.push({
	displayName : "Théorique",
	typeList : [
		{name : "theoryCluster", displayName : "Clusters d'adjacence", hoverDescription : 'Solveur théorique sur les puzzles nécessitant que toutes les cases "ouvertes" doivent être adjacentes entre elles'},
		{name : "theoryLoop", displayName : "Boucles",  hoverDescription : 'Solveur théorique sur les puzzles avec une unique boucle orthogonale'},
		{name : "theoryLoopRegion", displayName : "Boucles à régions",  hoverDescription : 'Solveur théorique sur les puzzles avec une unique boucle orthogonale régionale'}
	]
});

const divElement = document.getElementById("div_common_menu");
addMenuPartEditor(divElement, menuEditor);
divElement.appendChild(document.createElement("br"));
addText(divElement, "Solveurs :");
divElement.appendChild(document.createElement("br"));
menuSolvers.forEach(menu => {
	addMenuPartSolver(divElement, menu);
	divElement.appendChild(document.createElement("br"));
})