// Global variables to store the start/end timestamps
// of the currently selected album
var albumStartTime = 0;
var albumEndTime = 0;

function getOneDayUnixTime() {
    return 86400;
}

function getPicasaUserName() {
    return $('#picasaUser').val();
}

// Enables or disables the Import Album button
function setCachePhotosBtnEnabled(bEnable) {
    var importPhotos_button = document.getElementById('importPhotos_button');
    if(bEnable) {
        // Enable the Import Album button.
        importPhotos_button.removeAttribute('disabled');
    } else {
        // Disable the Import Album button.
        importPhotos_button.disabled = 'true';
    }
}

// This function fills the 'albumSelect' combobox with the list of 
// public albums for a particular user.
function listAlbums(root) {
    var feed = root.feed;
    var entries = feed.entry || [];
    
    if(0 < entries.length) {
        for (var i = 0; i < entries.length; ++i) {
            var entry = entries[i];
            var title = entry.title.$t;
            var albumId = (entry.gphoto$id.type == 'html') ? entry.gphoto$id.$t : escape(entry.gphoto$id.$t);
          
            // MORRIS - it would be more efficient to set the items outside of the loop
            $('#albumSelect').append(new Option(title, albumId));
        }
        
        // Trigger the change event on the albumSelect combobox.
        $('#albumSelect').change();
    }
}

// Retrieve the JSON feed for a Google photos feed.
function runJSONInScript(queryUrl) {
  // Retrieve the JSON feed.
  // MORRIS - can this be done without creating new script elements?
  if (queryUrl) {
    var script = document.createElement('script');
    script.setAttribute('src', queryUrl);
    script.setAttribute('id', 'jsonScript');
    script.setAttribute('type', 'text/javascript');
    document.documentElement.firstChild.appendChild(script);
  }
}

// This function tells the server to create XML caches for photos 
// in a particular Picasa album at 1-day intervals. 
// NOTE: the globals albumStartTime and albumEndTime need to be set
// prior to calling this function.
function cachePhotos(query) {
    var userName = getPicasaUserName();
    var selectedAlbumId = query.albumSelect.options[query.albumSelect.selectedIndex].value;
    var feedUrl = 'http://picasaweb.google.com/data/feed/api/user/' + userName + '/albumid/' + selectedAlbumId + '?imgmax=1200';
    if (userName && selectedAlbumId  && feedUrl && albumStartTime && albumEndTime && (albumStartTime < albumEndTime)) {
        // Hack - for large albums that span multiple days, the server process would timeout
        // while processing the thumbnails and creating the cached XML files.  I am
        // making multiple POST calls from the client-side to avoid the server's internal timeout.
        // Really, the iteration over days should be done server-side.
        
        // Start at 12:00am of the day (UTC), otherwise we will skip images from the 
        // mornings of all subsequent iterations of the while loop.
        var startdate = albumStartTime-(albumStartTime%getOneDayUnixTime());
        
        while (startdate < albumEndTime) {
            // get photos for 24 hours
            var enddate = startdate + (getOneDayUnixTime()-1);
            
            // Inform that the current is starting
            var dateToShow = getFormattedTimeFromUnixTime(startdate);
            var newElement = document.createElement('p');
            newElement.innerHTML = "Please wait, importing photos from " 
                                        + dateToShow + "...";
            document.getElementById('serverresults').appendChild(newElement);
            
            (function (pElem, dateShowing) {
                // send request
                $.post("makeGPhotoCache.php", 
                {picasaUserFeed: feedUrl, lowerTimeBound: startdate, upperTimeBound: enddate}, 
                    function(results) {
                    // Inform the user of the current import
                    pElem.innerHTML = "Finished import of photos from " 
                                                + dateShowing + ".";
                });
            })(newElement, dateToShow);           
            startdate += getOneDayUnixTime();
        }
    }
}

// This function fetches the timespan (start and end) for a 
// particular Picasa album.  The timespan will be used when
// building per-day XML cache files on the server.
function getAlbumTimespan() {
    var albumSelect_combo = document.getElementById('albumSelect');
    var selectedAlbumId = albumSelect_combo.options[albumSelect_combo.selectedIndex].value;
    var userName = getPicasaUserName();
    if (userName && selectedAlbumId) {
        
        // send request
        $.post("makeGPhotoCache.php", 
        {getAlbumStartAndEnd: "", picasaUserFeed: userName, albumId: selectedAlbumId}, 
            function(results) {
            // format and output result
            albumStartTime = results.lowerTimeBound;
            albumEndTime = results.upperTimeBound;
            $("#albumStartTime").html(getFormattedTimeFromUnixTime(albumStartTime));
            $("#albumEndTime").html(getFormattedTimeFromUnixTime(albumEndTime));
            
            setCachePhotosBtnEnabled(true);
        });
    }
}

function clearAlbumData() {
    $("#albumStartTime").html("<i>calculating...</i>");
    $("#albumEndTime").html("<i>calculating...</i>");
    setCachePhotosBtnEnabled(false);
    document.getElementById('serverresults').innerHTML = '';
}

function clearAlbumDataAndCombo() {
    // Clear the albums combo
    $('#albumSelect').empty();
    clearAlbumData();
}

jQuery(document).ready(function() {

    // set controls to default/empty
    clearAlbumDataAndCombo();
    
    $("#albumSelect").change(function(){
        clearAlbumData();
        getAlbumTimespan();
    });
    
	$("#picasaUser").change(function(){
        clearAlbumDataAndCombo();
    });

	$("#loadAlbums_button").click(function(){
        clearAlbumDataAndCombo();
                        
        var jsonUrl = 'http://picasaweb.google.com/data/feed/api/user/'
                        + getPicasaUserName()
                        + '?kind=album&alt=json-in-script&callback=listAlbums';
        runJSONInScript(jsonUrl);
    });
    
	$("#importPhotos_button").click(function(){
        $("#serverresults").innerHTML = '';
        cachePhotos(this.form);
    });
});
