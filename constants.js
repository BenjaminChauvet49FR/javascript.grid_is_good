// Walled grids
const OPEN = 0;
const CLOSED = 1;

//Region grids
const BANNED = -2;
const UNCHARTED = -1;

const SELECTED = {YES:true,NO:false};
const MODE_NORMAL = {id:1,html:"Etat case",value:"Changer case grille"};
const MODE_SELECTION = {id:2,html:"Sélection",value:"Sélectionner cases"};
const MODE_ERASE = {id:3,html:"Effaçage",value:"Effacer murs autour case"};