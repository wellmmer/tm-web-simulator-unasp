var states = 0;


function addEstado(n)
{
	var div = document.createElement("div");
	var estadoBox = document.createElement("div");
	div.setAttribute('class','estadoBox');
	estadoBox.setAttribute('id',"estadoBox-"+n+"-data");
	div.setAttribute('id','estadoBox-'+n);

	var transTable = document.createElement("table");
	transTable.innerHTML = "<tr><td> Char </td> <td> -> </td> <td>Char</td> <td>State</td> <td>{L,R}</td></tr>";
	estadoBox.appendChild(transTable);
	transTable.setAttribute('id', 'transTable-' +n);
	transTable.setAttribute('class', 'transTable');
	
	div.innerHTML = "State "+ n;
	var del = document.createElement("button");
	del.setAttribute('class','delstate-button btn btn-red');
	del.innerHTML = "Delete";
	del.onclick=function(){removeState(n); deleteestadoBoxElement(div);};
	
	var addTransitionButton = document.createElement("button");
	addTransitionButton.setAttribute('class','addtransition-button btn btn-orange');
	addTransitionButton.innerHTML = "Add Transition";
	addTransitionButton.onclick = function(){addTransition(n)};
	
	var addTransitionButtonTop = document.createElement("button");
	addTransitionButtonTop.setAttribute('class','addtransition-button-top btn btn-blue');
	addTransitionButtonTop.innerHTML = "Add Transition";
	addTransitionButtonTop.onclick = function(){addTransition(n)};
	
	
	
	document.getElementById("estadoBoxes").appendChild(div);
	div.appendChild(del);
	div.appendChild(addTransitionButtonTop);
	
	div.appendChild(estadoBox);
	div.appendChild(addTransitionButton);
	
	addTransition(n);
	
	if(n == states) states += 1;
	
	return estadoBox;
}

function addTransition(n) {
	var transTable = document.getElementById("transTable-"+n);
	var tr = transTable.insertRow(-1);
	
	var charSeen = document.createElement('textarea');
	charSeen.setAttribute('class','dataArea');
	charSeen.onchange=limitLength(charSeen);
	charSeen.addEventListener('input',function()
	{
		if(!((n + "_" + charSeen.value) in ruleset))
		{
			charSeen.disabled = true; 
			limitLength(charSeen); 
			addRule(charSeen);
		}
		else
		{
			charSeen.value = "";
		}
		
	});
	tr.insertCell(0).appendChild(charSeen);
	
	tr.insertCell(1);
	
	var charNext = document.createElement('textarea');
	charNext.onchange=limitLength(charNext);
	charNext.addEventListener('input',function(){limitLength(charNext); addRule(charNext);});
	charNext.setAttribute('class','dataArea');
	tr.insertCell(2).appendChild(charNext);
	
	var stateNext = document.createElement('textarea');
	stateNext.setAttribute('class','dataArea');
	stateNext.addEventListener('input',function(){addRule(stateNext);});
	tr.insertCell(3).appendChild(stateNext);
	
	var dirNext = document.createElement('textarea');
	dirNext.setAttribute('class','dataArea');
	dirNext.onchange=limitLength(dirNext);
	dirNext.addEventListener('input',function(){limitLength(dirNext); addRule(dirNext);});
	tr.insertCell(4).appendChild(dirNext);
	
	var del = document.createElement("button");
	del.setAttribute('class','delstate-button btn btn-red');
	del.innerHTML = "Delete";
	del.onclick=function(){ removeRule(del); deleteTransitionElement(tr);};
	tr.insertCell(5).appendChild(del);
	
	transTable.appendChild(tr);
	return tr;
}

function limitLength(textArea)
{
	if(textArea.value.length > 1)
	{
		textArea.value=textArea.value.substring(textArea.value.length-1,textArea.value.length);
	}
}

function addRule(ta)
{
	var cells = ta.parentNode.parentNode.childNodes;
	var estadoBox = ta.parentNode.parentNode.parentNode.parentNode.parentNode;
	var state = estadoBox.getAttribute('id').substring(estadoBox.getAttribute('id').indexOf('-')+1);
	
	
	var charSeen = cells[0].childNodes[0].value;
	var charNext = cells[2].childNodes[0].value;
	var stateNext = cells[3].childNodes[0].value;
	if(stateNext == "A" || stateNext =="a") stateNext = -1;
	if(stateNext == "R" || stateNext =="r") stateNext = -2;
	var dirNext = cells[4].childNodes[0].value;
	
	ruleset[state + "_" + charSeen] = [charNext, stateNext, dirNext];
	
	console.log(ruleset);
}

function removeRule(ta)
{
	var cells = ta.parentNode.parentNode.childNodes;
	var estadoBox = ta.parentNode.parentNode.parentNode.parentNode.parentNode;
	var state = estadoBox.getAttribute('id').substring(estadoBox.getAttribute('id').indexOf('-')+1);
	
	
	var charSeen = cells[0].childNodes[0].value.substring(0,1);
	
	ruleset.removeItem(state + "_" + charSeen);
	
	console.log(ruleset);
}

function removeState(n)
{
	for(var k in ruleset)
	{
		if(k.substring(0,k.indexOf("_")) == n + "")
		{
			ruleset.removeItem(k);
		}
	}
	console.log(ruleset);
}

function playButton()
{
	play();
	desenharMaquina();
}
function stepButton()
{
	step();
	desenharMaquina();
}

function stopButton()
{
	stop();
	desenharMaquina();
}

function resetButton()
{
	reset();
	desenharMaquina();
}

function stateButton()
{
	state = document.getElementById("estadoArea").value;
}

function deleteestadoBoxElement(tr)
{
	tr.parentNode.removeChild(tr);
}

function deleteTransitionElement(tr)
{
	tr.parentNode.removeChild(tr);
}

function estadoBoxUpdate(x)
{
	currentState = document.getElementById("estadoArea").value;
}

function fitaBoxUpdate(x)
{
	tape = document.getElementById("tape").value;
}

function clearestadoBoxes()
{
	document.getElementById("estadoBoxes").innerHTML="";
	states = 0;
	addEstado(0);
}

function newButton()
{
	clearRules();
	clearestadoBoxes();
	reset();
	desenharMaquina();
}

function loadButton()
{
	newButton();
	var str = document.getElementById("savedata").value;
	readMachineCode(str);
	//document.getElementById("estadoArea").value = currentState;
	//document.getElementById("tape").value = tape;
	populateEditor();
	desenharMaquina();
}

function saveButton()
{
	reset();
	document.getElementById("savedata").value = outputMachineCode();
	desenharMaquina();
}

function populateEditor()
{
	for(var k in ruleset)
	{
		if(k.indexOf("_") > 0 )
		{
			//Just tear the rule to pieces for later
			addToState = k.substring(0, k.indexOf("_"));
			addCharSeen = k.substring(k.indexOf("_") + 1);
			addNextChar= ruleset[k][0];
			addNextState = ruleset[k][1];
			addNextDir = ruleset[k][2];
			
			//If there isn't a box for this state yet, add one
			estadoBox = document.getElementById("estadoBox-"+addToState);
			if(estadoBox == null) estadoBox = addEstado(addToState);
			
			//TODO: doublecheck that a rule isn't a duplicate here
			
			//Make a row for the rule
			tr = addTransition(addToState);
			tr.cells[0].childNodes[0].value = addCharSeen;
			tr.cells[2].childNodes[0].value = addNextChar;
			tr.cells[3].childNodes[0].value = addNextState;
			tr.cells[4].childNodes[0].value = addNextDir;
		}
	}
}

















