<?php

require_once('timestampUtils.php');

// Calculates and returns the path for this journal given the date of the journal 
function getJournalPath($journalEntryDate)
{
    return "journalfiles/$journalEntryDate.html";
}

// Writes a journal entry out to a file on the server.  This can either
// create a new file or overwrite the existing file.
function saveJournalEntry($journalEntryDate, $journalEntryTitle, $journalEntryContent)
{    
	$formattedTime = formatTimestampForDisplay($journalEntryDate);
    
    $journalEntryContent = 
        "<h2><a id=\"$journalEntryTitle\">$journalEntryTitle</a></h2>"
        ."<h3><a id=\"$journalEntryDate\">$formattedTime</a></h3>"
        .$journalEntryContent
        .'<p id="endOfEntry">&lt;End of Journal&gt;</p>';

    $outputFilePath = getJournalPath($journalEntryDate);
    $writefile = fopen($outputFilePath, "w") or exit("Unable to open file!");
    fwrite($writefile, $journalEntryContent);
    fclose($writefile);
    
    // return the saved file name
	header('Content-type: text/plain');
    echo $journalEntryDate;
}

// For the creating a new journal entry workflow:
// We expect this to be called as setp #1 in creating a new journal entry.
// This just writes the text of the journal entry, before any timestamps
// have been placed.
// It will create a new HTML snip on the server. 
if(isset($_REQUEST["journalEntryTitle"]) && 
   isset($_REQUEST["journalEntryDate"]) && 
   isset($_REQUEST["journalEntryContent"]))
{
	$journalEntryTitle = $_REQUEST["journalEntryTitle"];
	$journalEntryDate = $_REQUEST["journalEntryDate"];
	$journalEntryContent = $_REQUEST["journalEntryContent"];
    
    saveJournalEntry($journalEntryDate, $journalEntryTitle, $journalEntryContent);
}

// For placing timestamps workflow:
// This is step #2 in creating a new journal entry.  This is called after
// timestamps have been placed in an entry.
// This clause writes to the server a new file
// containing a journal entry marked up with timestamp data.
if(isset($_REQUEST["journalName"]) && 
   isset($_REQUEST["applyTimestamps"]))
{
	header('Content-type: text/html');
	echo "Apply Timestamps; ";
	
	$journalName = $_REQUEST["journalName"];
	$fileContent = $_REQUEST["applyTimestamps"];
    
    // For some reason the " around tag params like ID and CLASS are getting escaped when sent
    // to the server.  Thus, id="1234" becomes id=\"1234\".  I am trying to clean this up.
    $fileContent = str_replace('\"', '"', $fileContent);
    $fileContent = str_replace("\'", "'", $fileContent);
    
	if(0 >= strlen($journalName) ||
	   0 >= strlen($fileContent) )
	{
	   echo "Unexpected zero-length arguments.";
	}
	else
	{
	    echo "journalName: $journalName";
        $outputFilePath = getJournalPath($journalName);  
		$writefile = fopen($outputFilePath, "w") or exit("Unable to open file!");
		fwrite($writefile, $fileContent);
		echo "wrote ".$outputFilePath;
		fclose($writefile);
	}
}

?>