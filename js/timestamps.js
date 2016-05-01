function getJQuerySelectorByTime(tag, time) {
    if(tag === undefined || tag === null || 
       time === undefined || time === null)
       return undefined;
    var currentId = $(tag+"[data-time='"+time+"']"); 
    return currentId;
}

function getTimeFromElement(elem) {
    if(elem === undefined || elem === null)
        return undefined;
    return parseInt(elem.getAttribute('data-time'));
}

function formatFixedLength($value, $numDigits) {
	$zeros = "";
	for(ii=($numDigits-String($value).length); ii>0; ii--)
		$zeros += "0";
	return $zeros + $value;
}

function getFormattedTimeFromUnixTime(unixTime) {
    $date = new Date(); 
    $date.setTime(unixTime*1000);
    
    $formatted = "";
	$formatted += $date.getFullYear();
    $formatted += "/";
	$formatted += formatFixedLength($date.getMonth()+1,2);
    $formatted += "/";
	$formatted += formatFixedLength($date.getDate(),2);
    $formatted += " ";
	$formatted += formatFixedLength($date.getHours(),2);
    $formatted += ":";
	$formatted += formatFixedLength($date.getMinutes(),2);
    $formatted += ":";
	$formatted += formatFixedLength($date.getSeconds(),2);
	
	return $formatted;
}

function getOpeningTime() {
     if(0<oldVisibleTimeStamps.length)
     	return oldVisibleTimeStamps[0];
     else
     	return 0;
}

function getClosingTime() {
     if(1<oldVisibleTimeStamps.length)
        return oldVisibleTimeStamps[oldVisibleTimeStamps.length-1];
     else
     	return 0;	
}

function makeTimeQuery() {
     var openingTime = getOpeningTime();
     var closingTime = getClosingTime();
     if(0<openingTime && 0<closingTime)
        return openingTime+","+closingTime;
     if(0<openingTime)
        return openingTime;
     if(0<closingTime)
        return closingTime;

     return 0;
}

function printTimeStampArr(leadingOffScreenTimeStamp, 
	                   visibleTimeStamps, 
	                   trailingOffScreenTimeStamp) {
     var htmlOut = "";
     htmlOut += "leading off-screen timestamp: "+leadingOffScreenTimeStamp+"<br />";
     htmlOut += "visible timestamps: <br />";
     for(x in visibleTimeStamps)
        htmlOut += visibleTimeStamps[x]+"<br />";
     htmlOut += "trailing off-screen timestamp: "+trailingOffScreenTimeStamp+"<br />";     
     $(".visibletimestamps").html(htmlOut);
}

function objectsAreSame(x, y) {
    if(x.length != y.length)
        return false;
    for(var propertyName in x) 
    {
        if(x[propertyName] !== y[propertyName]) 
            return false;
    }
    return true;
}

function updateVisibleThumbnails() { 
     //alert("requesting thumbs");
     
     // send request for xml
     var openingTime = getOpeningTime();
     var closingTime = getClosingTime();
     $.post("getPhotosFromCache.php", 
     {lowerTimeBound:openingTime, upperTimeBound:closingTime}, 
     	     function(results) {
        // format and output result
        $(".serverresults").html(results);
     });
}

// This function assumes that the closing timestamp will NOT be included in the thumbnail results.
function updateVisibleTimeStamps()
{
	var textpaneTop = $("#textpane").position().top;
	var textpaneBottom = textpaneTop + $("#textpane").height();
	
	var leadingOffScreenTimeStamp = 0;
	var trailingOffScreenTimeStamp = 0;
	var visibleTimeStamps = new Array();
	$(".timestamp").each(function(i) 
	{
		var timestampLocation = $(this).position().top;
        var time = getTimeFromElement(this);
		if(timestampLocation <= textpaneTop)
		{
			leadingOffScreenTimeStamp = time;
		}
		else if(textpaneTop < timestampLocation && 
			timestampLocation < textpaneBottom)
		{
			visibleTimeStamps.push(time);
		}
		else if(0==trailingOffScreenTimeStamp && 
			textpaneBottom <= timestampLocation)
		{
			trailingOffScreenTimeStamp = time;
		}
	});
     
	if(0<leadingOffScreenTimeStamp)
		visibleTimeStamps.splice(0,0,leadingOffScreenTimeStamp);
    // MORRIS - it is possible at the beginning of a journal to have
    // no visible timestamps at all, thus there is no leadingOffScreenTimeStamp.
    // In this case trailingOffScreenTimeStamp will be put at index 0 of the array
    // and appear as if it is the opening timestamp!
    // ...this would not be a problem if the server returns all images upto but EXCLUDING the closing time.
	if(0<trailingOffScreenTimeStamp &&
       0<visibleTimeStamps.length) // only have an ending timestamp if there is something visible onscreen. 
		visibleTimeStamps.push(trailingOffScreenTimeStamp-1); // The -1 is because we want to show everthing upto but not including the offscreen timestamp.     	
	if(false == objectsAreSame(oldVisibleTimeStamps, visibleTimeStamps))
	{
		// Update get updated photo pane from server
		
		// // debugging
		// printTimeStampArr(leadingOffScreenTimeStamp, 
				  // visibleTimeStamps, 
				  // trailingOffScreenTimeStamp);
		
		oldVisibleTimeStamps = visibleTimeStamps;
		
		updateThumbnailsForVisibleTimestamps();
	}
}
