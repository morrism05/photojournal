// Time stamps are in UNIX time.  See http://www.epochconverter.com/

function getDatepickerUnixTime() {
    return $('#datepicker').datepicker("getDate") / 1000;
}

function setDatepickerTime(timestamp) {
    var unixTime = timestamp * 1000;
    var myDate = $.datepicker.parseDate('@', unixTime);
    $('#datepicker').datepicker("setDate", myDate);
}

function getIntervalUnixTime() {
    return ($('#intervalInDays').val() * 86400);
}

// http://stackoverflow.com/questions/13763/how-do-i-remove-a-child-node-in-html-using-javascript
function removeElement(node) {
    node.parentNode.removeChild(node);
    // MORRIS - how do I remove any event handlers associated with this node?
}
// The user will drag-and-drop an image onto a paragraph of the journal to say that
// the paragraph text describes the image.  The image will be placed ahead of the paragraph.
function dropImageIntoJournalText(event) {
    // Figure out onto which paragraph the image was dropped.
    var x = event.originalEvent.clientX, y = event.originalEvent.clientY;
    var paragraphElement = document.elementFromPoint(x, y);
    
    // Find the containing paragraph ('P') element
    while(null !== paragraphElement)
    {
        if('P' == paragraphElement.nodeName)
            break;
        paragraphElement = paragraphElement.parentElement;
    }
    // The target was not contained in a paragraph - abort the drop.
    if(null == paragraphElement)
        return;
    
    // Get the element (HTML source in text) which was dropped onto the 
    // journal paragraph.
    var imgHtmlText = event.originalEvent.dataTransfer.getData('text/html');
    var imgElement = $('img', $.parseHTML(imgHtmlText))[0];
    if(null !== imgElement)
    {
        // prepare the dynamically created img for insertion
        imgElement.className = "thumbnail_timestamp";
        imgElement.style = "";
        imgElement.title = "Click to remove";
        
        // Insert the image before this paragraph
        paragraphElement.parentElement.insertBefore(imgElement, paragraphElement);
    }
}

//http://stackoverflow.com/questions/16777003/what-is-the-easiest-way-to-disable-enable-buttons-and-links-jquery-bootstrap
jQuery.fn.extend({
	disable: function(state) {
		return this.each(function() {
			var $this = $(this);
			if($this.is('input, button'))
				this.disabled = state;
			else
				$this.toggleClass('disabled', state);
		});
	}
});

// Iterate the "textformarkup" div.  Put all
// child elements from one thumbnail_timestamp IMG to the next
// thumbnail_timestamp IMG into a span with the id matching the 
// timestamp of the first thumbnail.
function getJournalWithTimestampSpans() {
    var textForMarkup = document.getElementById('textformarkup');
    var journalBodyNoSpans = textForMarkup.innerHTML;
    
    var spnWithTime; // created when the first IMG to replace is found
    var childs = textForMarkup.childNodes;
    var idxChilds = 0;
    if(idxChilds < childs.length) do {
        var curChild = childs[idxChilds];
        if("thumbnail_timestamp" == curChild.className) {
            // Set up the className and data-time of the span.
            // The data-time will match the data-time of the thumbnail we just found.
            spnWithTime = document.createElement("span");
            spnWithTime.className = "timestamp";
            spnWithTime.setAttribute('data-time', curChild.getAttribute('data-time'));
            
            // Add span after the thumbnail_timestamp
            textForMarkup.insertBefore(spnWithTime, curChild.nextSibling);                
            
            // Preserve the placeholder thumbnail_timestamp.  
            // CSS for the journal display pages can make it invisible.
            idxChilds++; // move past the IMG
            
            // move to the child after the inserted span
            idxChilds++;
        }
        else if(typeof spnWithTime === 'undefined') {
            // do nothing... we have not found the first thumbnail_timestamp yet
            idxChilds++;
        }
        else {
            // This removes the entry from 'childs' shortening the
            // list length, thus childs.length is -1.
            spnWithTime.appendChild(childs[idxChilds]);
        }
    } while(idxChilds < childs.length);
    
    var journalBodyWithSpans = textForMarkup.innerHTML;
    // Reset the innerHTML to the version without spans, so that the user can continue
    // editing the journal if he wants.
    textForMarkup.innerHTML = journalBodyNoSpans;
    return journalBodyWithSpans;
}

function removeTimestampSpans() {
    // remove all of the existing span data, as the user will be placing new span data.
    $("span.timestamp").children().unwrap();
}

function setClassVisible(classname, visible) {
    var visibleDisplay = ''; // setting empty string restores default visibility
    if(!visible)
        visibleDisplay = 'none';
    var elements = document.getElementsByClassName(classname);
    for(var i = 0; i < elements.length; i++) {
        elements.item(i).style.display = visibleDisplay;
    }
}

function loadJournal(journalName) {
    if(journalName != '') {
        var path = makeJournalPath(journalName);
        setClassVisible('makeJournalEntry', false);
        $("#textformarkup").load(path + "?" + new Date().getTime()); //appending a timestamp so that we won't load out of the browser's cache
        removeTimestampSpans();
        document.getElementById('journalName').value = journalName;
        setClassVisible('placeTimestamps', true);
        
        // Load the thumbnails for the day.
        setDatepickerTime(journalName);
        $('#btnGetThumbnails').click();
    }
}

function onSelectedJournalChanged() {
    var journalName = getJournalNameFromCombo('newOrExistingJournalSelect');
    if(journalName != '') {
        loadJournal(journalName);
    } else {
        setClassVisible('makeJournalEntry', true);
        document.getElementById('journalName').value = '';
        setClassVisible('placeTimestamps', false);
    }
}

// Copy/pasted from:
// http://stackoverflow.com/questions/7336281/converting-textarea-newlines-into-p-and-br-tags-by-javascript
function encode4HTML(str) {
    return str
        .replace(/\r\n?/g,'\n')
        // normalize newlines - I'm not sure how these
        // are parsed in PC's. In Mac's they're \n's
        .replace(/(^((?!\n)\s)+|((?!\n)\s)+$)/gm,'')
        // trim each line
        .replace(/(?!\n)\s+/g,' ')
        // reduce multiple spaces to 2 (like in "a    b")
        .replace(/^\n+|\n+$/g,'')
        // trim the whole string
        .replace(/[<>&"']/g,function(a) {
        // replace these signs with encoded versions
            switch (a) {
                case '<'    : return '&lt;';
                case '>'    : return '&gt;';
                case '&'    : return '&amp;';
                case '"'    : return '&quot;';
                case '\''   : return '&apos;';
            }
        })
        .replace(/\n{2,}/g,'</p><p>')
        // replace 2 or more consecutive empty lines with these
        .replace(/\n/g,'<br />')
        // replace single newline symbols with the <br /> entity
        .replace(/^(.+?)$/,'<p>$1</p>');
        // wrap all the string into <p> tags
        // if there's at least 1 non-empty character
}

jQuery(document).ready(function() {
    
    //----------------------------------------------------------
    // Event handlers
    $("#thumbpane").on('click', ".thumbnail_link", function(clickedElem) { 
        clickedElem.preventDefault();
        clickedElem.stopPropagation();
        //addSpanToSelectedText(this.id);
    });
    
    // Add event-handling which will also work for  dynamically added IMGs,
    // such as when we load an existing journal from an HTML snippet or we
    // inject an IMG into the DOM on drag-and-drop.
    // http://stackoverflow.com/questions/1359018/in-jquery-how-to-attach-events-to-dynamic-html-elements
    $('#textformarkup').on('click', 'img.thumbnail_timestamp', function(clickedElem) {
        // do something
        clickedElem.preventDefault();
        clickedElem.stopPropagation();            
        removeElement(clickedElem.target);
    });

    $('#btnGetThumbnails').click(function(){
        var startdate = getDatepickerUnixTime();
        var enddate = startdate + getIntervalUnixTime();

        // send request
        $.post("getPhotosFromCache.php", 
        {lowerTimeBound: startdate, upperTimeBound: enddate}, 
            function(results) {
            // format and output result
            $(".serverresults").html(results);
        });
    });
    		
    // Load the existing journals combobox
    loadJournalsCombo('newOrExistingJournalSelect', '');

    // If the user chooses to us an existing journal, load it into the page.
    $('#newOrExistingJournalSelect').change(function(){
        onSelectedJournalChanged();
    });
    
    $('#btnSave').click(function(){        
        var entryDate = getDatepickerUnixTime();
        var entryTitle = document.getElementById('entryTitle').value;        
        var entryContent = encode4HTML(document.getElementById('entryContent').value);
        
	    // send request
        $.post("saveJournal.php", 
        {journalEntryTitle: entryTitle, journalEntryDate: entryDate, journalEntryContent: entryContent}, 
            function(results) {
            var journalName = results;
            loadJournalsCombo('newOrExistingJournalSelect', journalName);
        });
        
        // Load the thumbnails for the day.
        $('#btnGetThumbnails').click();
    });
    
    $('#btnApplyTimestamps').click(function(){
        // Replace the thumbnails the user dropped into the journal with
        // span tags that partition the journal into slices of time.
        var journalBodyWithSpans = getJournalWithTimestampSpans();
        
        var userJournalName = document.getElementById('journalName').value;
	    // send request
        $.post("saveJournal.php", 
        {journalName: userJournalName, applyTimestamps: journalBodyWithSpans}, 
            function(results) {
            results += "_";
        });
    });
        
    // Drag and Drop attempt -----------------------------
    //http://stackoverflow.com/questions/9544977/using-jquery-on-for-drop-events-when-uploading-files-from-the-desktop
    $('#textformarkup').on('dragover', function(e){
        e.preventDefault();
        e.stopPropagation();
    });
    $('#textformarkup').on('dragenter', function(e){
        e.preventDefault();
        e.stopPropagation();
    });
    $('#textformarkup').on('drop', function(e){
        e.preventDefault(); 
        e.stopPropagation();
        
        dropImageIntoJournalText(e);
    });
      
    //----------------------------------------------------------    
    // Initialize the datepicker control
    $( "#datepicker" ).datepicker();
});
