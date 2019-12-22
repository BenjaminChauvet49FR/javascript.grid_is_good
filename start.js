//This script is where all functions are launched at start !

document.getElementById("submit_save_grid").addEventListener('click',saveString);
document.getElementById("submit_load_grid").addEventListener('click',loadString);
canevas.addEventListener('click', clickCanvas,false);
setInterval(drawCanvas,30);