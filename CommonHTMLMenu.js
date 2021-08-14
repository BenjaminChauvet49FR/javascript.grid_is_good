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

function addMenuPart(p_divElement, p_menuPart) {
	addText(p_divElement, p_menuPart.displayName+" : ");
	p_menuPart.typeList.forEach( type => {
		p_divElement.appendChild(createReferenceElement(getHTMLpath(p_menuPart.documentPage, type.name), type.displayName, type.hoverDescription));
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
	documentPage : "Editor",
	typeList : [
		{name : "shared", displayName : "Editeur partagé"}
	]
}

var menuSolvers = [];

menuSolvers.push({
	displayName : "Binaires quelconques",
	documentPage : "Solver",
	typeList : [
		{name : "akari", displayName : "Akari", hoverDescription : "Ampoules qui éclairent toute la grille sans s'éclairer mutuellement"},
		{name : "chocona", displayName : "Chocona", hoverDescription : "Rectangles dans une grille en région"},
		{name : "gappy", displayName : "Gappy", hoverDescription : "2 cases par ligne et colonne avec une séparation exacte, sans contact"},
		{name : "norinori", displayName : "Norinori", hoverDescription : "Dominos, 2 cases par région"},
		{name : "shimaguni", displayName : "Shimaguni", hoverDescription : "Polyominos séparés dans les régions, 2 régions différentes admettant des polyominos de taille différente"},
		{name : "starBattle", displayName : "Star battle", hoverDescription : "Etoiles dans chaque ligne, colonne et région, sans contact"},
	]
});

menuSolvers.push({
	displayName : "Remplissages de régions avec des nombres",
	documentPage : "Solver",
	typeList : [
		{name : "hakyuu", displayName : "Hakyuu", hoverDescription : "Nombres de 1 à N par région, séparation suffisante entre 2 nombres identiques sur une ligne ou colonne"}
	]
});

menuSolvers.push({
	displayName : "Binaires avec adjacence",
	documentPage : "Solver",
	typeList : [
		{name : "curvingRoad", displayName : "Curving road", hoverDescription : "Pas plus de 2 tournants sur un chemin ouvert entre deux cercles, sans contact orthogonal fermé"},
		{name : "heyawake", displayName : "Heyawake", hoverDescription : "Bande de cases ouvertes traversant une frontière maximum, sans contact orthogonal fermé"},
		{name : "LITS", displayName : "LITS", hoverDescription : "Tetrominos, deux en contact doivent être différents, sans 2x2"},
		{name : "Tapa", displayName : "Tapa", hoverDescription : "Alentours d'une case, sans 2x2"},
		{name : "usoone", displayName : "Usoone", hoverDescription : "Indications de contact numérique, 1 case menteuse par région, sans contact orthogonal fermé"},
		{name : "yajikabe", displayName : "Yajikabe", hoverDescription : "Indications fléchées numériques, sans 2x2"}
	]
});

menuSolvers.push({
	displayName : "Multiples avec adjacence",
	documentPage : "Solver",
	typeList : [
		{name : "shugaku", displayName : "Shugaku", hoverDescription : "Carrés et ronds et dominos, couloir ouvert sans 2x2, contraintes"},
		{name : "hakoiri", displayName : "Hakoiri", hoverDescription : "Un carré un rond un triangle par région, sans contact de formes identiques"}
	]
});

menuSolvers.push({
	displayName : "Boucles",
	documentPage : "Solver",
	typeList : [
		{name : "detour", displayName : "Detour", hoverDescription : "Combien de tournants par région ?"},
		{name : "koburin", displayName : "Koburin", hoverDescription : "Indications d'adjacence, sans contact orthogonal fermé non-banni"},
		{name : "masyu", displayName : "Masyu", hoverDescription : "Perles blanches et noires à traverser"},
		{name : "yajilin", displayName : "Yajilin", hoverDescription : "Indications fléchées numériques, sans contact orthogonal fermé non-banni"}
	]
});

menuSolvers.push({
	displayName : "Boucles à région",
	documentPage : "Solver",
	typeList : [
		{name : "countryRoad", displayName : "CountryRoad", hoverDescription : "2 cases de part et d'autre d'une frontière ne doivent pas rester non-visitées"},
		{name : "entryExit", displayName : "EntryExit", hoverDescription : "Boucle régionale classique"},	
		{name : "moonsun", displayName : "Moonsun", hoverDescription : "Régions alternativement solaires et lunaires"}
	]
});

menuSolvers.push({
	displayName : "Découpage en région",
	documentPage : "Solver",
	typeList : [
		{name : "usotatami", displayName : "Usotatami", hoverDescription : "Bandes avec un nombre unique n'indiquant pas la longueur"},
		{name : "galaxies", displayName : "Galaxies", hoverDescription : "Galaxies symétriques centralement sur un centre"}
	]
});

menuSolvers.push({
	displayName : "Inclassables",
	documentPage : "Solver",
	typeList : [
		{name : "stitches", displayName : "Stitches", hoverDescription : "Points de couture entre régions"}
	]
});

menuSolvers.push({
	displayName : "Sudokus",
	documentPage : "Solver",
	typeList : [
		{name : "sudoku", displayName : "Sudoku", hoverDescription : "Sudoku classique ; peut avoir plusieurs grilles imbriquées"}
	]
});

menuSolvers.push({
	displayName : "Théorique",
	documentPage : "Solver",
	typeList : [
		{name : "theoryCluster", displayName : "Clusters d'adjacence", hoverDescription : 'Solveur théorique sur les puzzles nécessitant que toutes les cases "ouvertes" doivent être adjacentes entre elles'},
		{name : "theoryLoop", displayName : "Boucles",  hoverDescription : 'Solveur théorique sur les puzzles avec une unique boucle orthogonale'},
		{name : "theoryLoopRegion", displayName : "Boucles à régions",  hoverDescription : 'Solveur théorique sur les puzzles avec une unique boucle orthogonale régionale'}
	]
});

const divElement = document.getElementById("div_common_menu");
addMenuPart(divElement, menuEditor);
divElement.appendChild(document.createElement("br"));
addText(divElement, "Solveurs :");
divElement.appendChild(document.createElement("br"));
menuSolvers.forEach(menu => {
	addMenuPart(divElement, menu);
	divElement.appendChild(document.createElement("br"));
})