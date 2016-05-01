var oldVisibleTimeStamps = new Array();

function updateThumbnailsForVisibleTimestamps()
{ 
	// get the of timestamps visible _at_ _all_ in
	// the text reading pane.
	var openingTime = getOpeningTime();
	var closingTime = getClosingTime();
	
	var thumbCombo = $("#thumbsettings");
	var filter = thumbCombo.val();
	if("All"==filter)
		filter="";
		
	// send request for xml
	$.post("getPhotosFromCache.php", 
	{lowerTimeBound:openingTime, upperTimeBound:closingTime, keyword:filter}, 
	     function(results) {
		// format and output result
		$("#serverresults").html(results);
	});
}

function clearTextBackgroundHighlighting()
{
	for (idx in oldVisibleTimeStamps)
	{
        var currentId = getJQuerySelectorByTime('span', oldVisibleTimeStamps[idx]);
		if(currentId != undefined && currentId.hasClass("bghighlight"))
			currentId.removeClass("bghighlight");		
	}
}

function onThumbnailLinkHover(elementId)
{
	// Iterate over all visible portions of text which are timestamped.
	// Identify the text chunk which corresponds to elementId.
	// Remove background highlighting from all visible text chunks.
	var timeStampWhichOwnsElement = 0;
	var foundBestTimestamp = false;
	for (idx in oldVisibleTimeStamps)
	{
        var curTimestamp = oldVisibleTimeStamps[idx];
        if(null === curTimestamp)
            continue;
    
		if(elementId < curTimestamp)
			foundBestTimestamp = true; // no visible timestamp owns this elementId
		
		if(false == foundBestTimestamp)
			timeStampWhichOwnsElement = curTimestamp;
		
        var currentId = getJQuerySelectorByTime('span', curTimestamp);
		if(currentId != undefined && currentId.hasClass("bghighlight"))
			currentId.removeClass("bghighlight");		
	}
	
	// now apply background highlighting to elementId's text chunk.
    var selectId = getJQuerySelectorByTime('span', timeStampWhichOwnsElement);
   	if(selectId != undefined && !selectId.hasClass("bghighlight"))
		selectId.addClass("bghighlight");
	
}

function scrollThumbnails(timestamp)
{
	var res = $("#serverresults")[0];
	var child = res.firstChild;
	while(child != undefined && 
		child != res.lastChild &&
		getTimeFromElement(child) < timestamp)
	{ 
		 child = child.nextSibling;			 
	}
	if(!child)
		return;
	
	child.scrollIntoView();
	
	// fade in all children in this block
	var nextTimestamp = 0;
	for (idx in oldVisibleTimeStamps)
	{
		if(oldVisibleTimeStamps[idx] > timestamp)
		{
			nextTimestamp = idx;
			break;
		}		
	}
	while(child != undefined && 
		child != res.lastChild &&
		getTimeFromElement(child) < nextTimestamp)
	{
		//child.fadeOut("slow");
		child = child.nextSibling;			 
	}
}

// When a thumbnail image/link has been clicked, replace the thumbnail pane with
// the full image pane.
function showFullImage(clickedElem)
{
	if(clickedElem)
		clickedElem.preventDefault();
	var target = clickedElem.currentTarget;
	var className = clickedElem.currentTarget.className;
	
	var res = $("#serverresults")[0];
	var child = res.firstChild;
	while(child != undefined && 
		child != res.lastChild &&
		getTimeFromElement(child) != getTimeFromElement(clickedElem.currentTarget))
	{ 
		child = child.nextSibling;	 
	}
	
	var myLink;
	if(getTimeFromElement(child) == getTimeFromElement(clickedElem.currentTarget))
		myLink = child;
	
	var source = "";
	source += "<table><tbody><tr><td style=\"vertical-align:center\">";
	if(myLink && myLink.previousSibling)
	{
		source += myLink.previousSibling.innerHTML;
	}
	source += "</td><td>";
	source += "<img class='full_image bwborder' data-time='" + getTimeFromElement(clickedElem.currentTarget) + 
		   "' src='" + clickedElem.currentTarget + "' alt='" 
		   + "" + "' />";
	source += "</td><td style='vertical-align:center'>";
	if(myLink && myLink.nextSibling)
	{
		source += myLink.nextSibling.innerHTML;
	}
	source += "</td></tr></tbody></table>";
	
	$("#imageborder").hide();
	$("#imagepane").html(source);
	
	if(myLink)
	{
		var children = $("#imagepane .thumbnail_link");
		for(idx=0;idx<children.length;idx+=1)
		{
			var child = children[idx];
			if( myLink.previousSibling && child && 
			   getTimeFromElement(child) == getTimeFromElement(myLink.previousSibling))
			{
				child.className = "previmage changeimagearrow";
				child.innerHTML = "&lt";
			}
			else if(myLink.nextSibling && child && 
			   getTimeFromElement(child) == getTimeFromElement(myLink.nextSibling))
			{
				child.className = "nextimage changeimagearrow";
				child.innerHTML = "&gt";
			}
		}
	}
	
	$("#thumbborder").hide();
	$("#imageborder").show();
}

function hideFullImage(clickedElem)
{
	if(clickedElem)
		clickedElem.preventDefault();
	$("#imageborder").hide();
	$("#thumbborder").show();	
}

function scrollContent(clickedElem, forward)
{
	if(clickedElem)
		clickedElem.preventDefault();
	
	var textpane = $("#textpane");
	var scrollAmount = textpane.height() - 20; 
	if(!forward)
		scrollAmount *= -1;
	textpane[0].scrollTop = textpane[0].scrollTop + scrollAmount;
}

function calculateAvailableWidth()
{
	return ($("#content").innerWidth() - $("#textborder").width()) - 5;
}

function resizeThumbBorder()
{
	var availableWidth = calculateAvailableWidth();
	$("#thumbborder").width(availableWidth);
}

function resizeImagePane()
{
	// MORRIS - can I set the max-width CSS parameter to control image size?
	var element = $("#imageborder")[0];
	
	var availableWidth = calculateAvailableWidth();
	var availableHeight = $("#textborder").height();
	/*var imageWidth = $("#imageborder").width();
	var txt = (availableWidth-imageWidth)/2 + "px";
	element.style.marginRight = txt;*/
	
	$("#imagepane").width(availableWidth-6);
	$("#imagepane").height(availableHeight-6);
}

function onSelectedJournalChanged() {
    var existingJournalSelect = document.getElementById('existingJournalSelect');
    var journalName = existingJournalSelect.options[existingJournalSelect.selectedIndex].value;
    var path = makeJournalPath(journalName);
    if(path != '') {
        $("#journalcontent").load(path + "?" + new Date().getTime()); //appending a timestamp so that we won't load out of the browser's cache
     } else {
        document.getElementById('journalcontent').innerHTML = '';
    }
    
    // Trigger an update of the timestamps and displayed thumbnails.
    $("#textpane").scroll();
}

jQuery(document).ready(function() {
    
    // If the user chooses to use an existing journal, load it into the page.
    $("#existingJournalSelect").change(function(){
        onSelectedJournalChanged();
    });
	
	//resizeThumbBorder();
	$("#thumbsettings").change(function(elem) {
		elem.preventDefault();
		updateThumbnailsForVisibleTimestamps();
  	});

	$(window).resize(function() 
	{
		//resizeThumbBorder();
		//resizeImagePane();
  	});
	
	$("#prevpage").click(function(clickedElem) {
		scrollContent(clickedElem, false);
	});
	
	$("#nextpage").click(function(clickedElem) {
		scrollContent(clickedElem, true);
	});
	
    $("#imagepane").on('click', ".changeimagearrow", function(clickedElem) { 
		showFullImage(clickedElem);
	});
        
    // JQuery 1.11.2
	$("#thumbpane").on('click', ".thumbnail_link", function(clickedElem) { 
		showFullImage(clickedElem);
	});
	$("#thumbpane").on('mouseenter', ".thumbnail_link", function() { 
		onThumbnailLinkHover(getTimeFromElement(this));
	});
	$("#thumbpane").on('mouseleave', ".thumbnail_link", function() {
		clearTextBackgroundHighlighting();	
	});
	$("#imagepane").on('mouseenter', ".full_image", function() { 
		onThumbnailLinkHover(getTimeFromElement(this));
	});
	$("#imagepane").on('mouseleave', ".full_image", function() {
		clearTextBackgroundHighlighting();	
	});
	$("#imagepane").on('click', ".full_image", function(clickedElem) { 
		hideFullImage(clickedElem);
	});
	$("#textpane").on('mouseenter', ".timestamp", function() {
		onThumbnailLinkHover(getTimeFromElement(this));	
	});
	$("#textpane").on('mouseleave', ".timestamp", function() {
		clearTextBackgroundHighlighting();
	});
    $("#textpane").on('click', ".timestamp", function() { 
		hideFullImage();
		scrollThumbnails(getTimeFromElement(this));
	});
	
	$("#textpane").scroll(function() {
		updateVisibleTimeStamps();
	});
   
	$("#btnGetFromServer").click(function(){
		// send request
		$.post("getPhotosFromCache.php", 
		{lowerTimeBound: getOpeningTime(), upperTimeBound:getClosingTime()}, 
			function(results) {
			// format and output result
			$("#serverresults").html(results);
		});
	});
	
});
