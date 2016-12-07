function SaveToCloud()
{
	SetSaveMessage( "Saving...", null );
	var oUnpackedObject = SaveMachineSnapshot();
	var gistApiInput = {
		"description": "Saved Turing machine state from http://morphett.info/turing/turing.html",
		"public": false,
		"files": {
			"machine.json": {
				"content": JSON.stringify( oUnpackedObject )
			}
		}
	};
	$.ajax({
		url: "https://api.github.com/gists",
		type: "POST",
		data: JSON.stringify(gistApiInput),
		dataType: "json", 
		contentType: 'application/json; charset=utf-8',
		success: saveSuccessCallback,
		error: saveErrorCallback
	});
}

/* SaveMachineSnapshot(): Store the current machine and state as an object suitable for saving as JSON */
function SaveMachineSnapshot()
{
	return( {
		"program": oTextarea.value,
		"state": sState,
		"tape": sTape,
		"tapeoffset": nTapeOffset,
		"headposition": nHeadPosition,
		"steps": nSteps,
		"initialtape": $("#InitialInput")[0].value,
		"initialstate": $("#InitialState")[0].value,
		"fullspeed": bFullSpeed,
		"variant": nVariant,
		"version": 1		/* Internal version number */
	});
}

function saveSuccessCallback( oData )
{
	if( oData && oData.id ) {
		var sURL = window.location.href.replace(/[\#\?].*/,"");		/* Strip off any hash or query parameters, ie "?12345678" */
		sURL += "?" + oData.id;									/* Append gist id as query string */
		//var sURL = "http://morphett.info/turing/turing.html" + "?" + oData.id;
		debug( 1, "Save successful. Gist ID is " + oData.id + " Gist URL is " + oData.url /*+ ", user URL is " + sURL */ );
		
		var oNow = new Date();
		
		var sTimestamp = (oNow.getHours() < 10 ? "0" + oNow.getHours() : oNow.getHours()) + ":" + (oNow.getMinutes() < 10 ? "0" + oNow.getMinutes() : oNow.getMinutes()) + ":" + (oNow.getSeconds() < 10 ? "0" + oNow.getSeconds() : oNow.getSeconds());/* + " " + oNow.toLocaleDateString();*/
		
		SetSaveMessage( "Saved! Your URL is <br><a href=" + sURL + ">" + sURL + "</a><br>Bookmark or share this link to access your saved machine.<br><span style='font-size: small; font-style: italic;'>Last saved at " + sTimestamp + "</span>", 1 );
		
	} else {
		debug( 1, "Error: Save failed. Missing data or id from Github response." );
		SetSaveMessage( "Save failed, sorry :(", 2 );
	}
}

function SetSaveMessage( sStr, nBgFlash )
{
	$("#SaveStatusMsg").html( sStr );
	$("#SaveStatus").slideDown();
	if( nBgFlash ) {	/* Flash background of notification */
		$("#SaveStatusBg").stop(true, true).css("background-color",(nBgFlash==1?"#88ee99":"#eb8888")).show().fadeOut(800);
	}
}
