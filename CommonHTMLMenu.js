//ATTENTION DANGER !
//Ce fichier contient des valeurs en dur sur :
// -les noms de dossier contenant les solveurs/éditeurs
// -les noms de fichier HTML
// -un identifiant d'élément HTML présent dans les pages de chaque solveur/éditeur (pour ne pas avoir à régenerer le HTML à chaque actualisation de page)

function createReferenceElement(p_path, p_displayedText) {
	const aNode = document.createElement("a");
    aNode.setAttribute("href", p_path);
    aNode.innerText = p_displayedText;
	return aNode;
}

function addMenuPart(p_divElement, p_menuPart) {
	addText(p_divElement, p_menuPart.displayName+" : ");
	p_menuPart.typeList.forEach( type => {
		p_divElement.appendChild(createReferenceElement(getHTMLpath(p_menuPart.documentPage, type.name), type.displayName));	
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
		{name : "akari", displayName : "Akari"},
		{name : "chocona", displayName : "Chocona"},
		{name : "gappy", displayName : "Gappy"},
		{name : "norinori", displayName : "Norinori"},
		{name : "shimaguni", displayName : "Shimaguni"},
		{name : "starBattle", displayName : "Star battle"},
	]
});

menuSolvers.push({
	displayName : "Remplissages de régions avec des nombres",
	documentPage : "Solver",
	typeList : [
		{name : "hakyuu", displayName : "Hakyuu"}
	]
});

menuSolvers.push({
	displayName : "Binaires avec adjacence",
	documentPage : "Solver",
	typeList : [
		{name : "curvingRoad", displayName : "Curving road"},
		{name : "heyawake", displayName : "Heyawake"},
		{name : "LITS", displayName : "LITS"},
		{name : "Tapa", displayName : "Tapa"},
		{name : "usoone", displayName : "Usoone"},
		{name : "yajikabe", displayName : "Yajikabe"}
	]
});

menuSolvers.push({
	displayName : "Multiples avec adjacence",
	documentPage : "Solver",
	typeList : [
		{name : "shugaku", displayName : "Shugaku"},
		{name : "hakoiri", displayName : "Hakoiri"}
	]
});

menuSolvers.push({
	displayName : "Boucles",
	documentPage : "Solver",
	typeList : [
		{name : "detour", displayName : "Detour"},
		{name : "koburin", displayName : "Koburin"},
		{name : "masyu", displayName : "Masyu"},
		{name : "yajilin", displayName : "Yajilin"}
	]
});

menuSolvers.push({
	displayName : "Boucles à région",
	documentPage : "Solver",
	typeList : [
		{name : "countryRoad", displayName : "CountryRoad"},
		{name : "entryExit", displayName : "EntryExit"},	
		{name : "moonsun", displayName : "Moonsun"}
	]
});

menuSolvers.push({
	displayName : "Découpage en région",
	documentPage : "Solver",
	typeList : [
		{name : "usotatami", displayName : "Usotatami"},
		{name : "galaxies", displayName : "Galaxies"}
	]
});

menuSolvers.push({
	displayName : "Inclassables",
	documentPage : "Solver",
	typeList : [
		{name : "stitches", displayName : "Stitches"}
	]
});

menuSolvers.push({
	displayName : "Sudokus",
	documentPage : "Solver",
	typeList : [
		{name : "sudoku", displayName : "Sudoku"}
	]
});

menuSolvers.push({
	displayName : "Théorique",
	documentPage : "Solver",
	typeList : [
		{name : "theoryCluster", displayName : "Clusters d'adjacence"},
		{name : "theoryLoop", displayName : "Boucles"},
		{name : "theoryLoopRegion", displayName : "Boucles à régions"}
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