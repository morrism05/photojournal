// http://stackoverflow.com/questions/423376/how-to-get-the-file-name-from-a-full-path-using-javascript
function extractFileName (str) {
    // Split out all of the folders in the path
    str = str.split('\\');
    str = str.pop();
    str = str.split('/');
    str = str.pop();
    // Then remove the file type
    str = str.split('.');
    str = str[0];
    
    var unixTime = parseInt(str, 10);
    if (0 < unixTime) {
        return getFormattedTimeFromUnixTime(unixTime);
    }
    return str;
}

function loadJournalsCombo(comboId, valueToSelect) {
    $.post("makeGPhotoCache.php", 
    {getJournalList: ""}, 
        function(results) {
        listJournals(comboId, results, true);
        if('' != valueToSelect) {
            // change the journals combo. 
            setSelectedJournal('newOrExistingJournalSelect', valueToSelect);
        }
    });
}

function getJournalNameFromCombo(comboId) {
    var newOrExistingJournalSelect = document.getElementById(comboId);
    return newOrExistingJournalSelect.options[newOrExistingJournalSelect.selectedIndex].value;
}

function setSelectedJournal(comboId, timestamp) {
    var comboElem = document.getElementById(comboId);
    for (var i = 0; i < comboElem.options.length; i++) {
        if (comboElem.options[i].value == timestamp) {
            comboElem.options[i].selected = true;
            $('#'+comboId).change(); // trigger the changed event
            return;
        }
    }
}

// This function fills the comboId combobox with the list of 
// journals already in existance.
function listJournals(comboId, entries, bAddNewEntry) {
    var comboSelector = $('#'+comboId);
    comboSelector.empty();
    
    if(bAddNewEntry) {
        // Default option is to create a new journal
        comboSelector.append(new Option('<New...>', ''));
    }
    
    // Existing
    if(0 < entries.length) {
        for (var i = 0; i < entries.length; ++i) {
            var entry = extractFileName(entries[i]);
            
            // MORRIS - it would be more efficient to set the items outside of the loop
            comboSelector.append(new Option(entry, entries[i]));
        }
        
        // Trigger the change event on the combobox
        comboSelector.change();
    }
}

function makeJournalPath(journalName) {
    return 'journalfiles/'+journalName+'.html';
}