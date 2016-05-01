<?php

require_once('timestampUtils.php');
require_once('domTreeUtils.php');

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
// Puts photos into a local (Sam's server) XML cached file for quick access.
if(!isset($_REQUEST["getAlbumStartAndEnd"]) &&
   isset($_REQUEST["picasaUserFeed"])
   //&& isset($_REQUEST["albumId"]) 
   ) 
{
	//header('Content-type: text/html');
    //$picasaUser = $_REQUEST["picasaUserFeed"];
    //$albumId = $_REQUEST["albumId"];
    $url = $_REQUEST["picasaUserFeed"];
	$lowerTimeBound = $_REQUEST["lowerTimeBound"];
	$upperTimeBound = $_REQUEST["upperTimeBound"];
    
    if(0 < strlen($url))
    {
        if(!isset($lowerTimeBound))
        {
            echo "lowerTimeBound is NOT set <br />";
        }
        if(!isset($upperTimeBound))
        {
            echo "upperTimeBound is NOT set <br />";
        }
        
        //$url = "http://picasaweb.google.com/data/feed/api/user/$picasaUser/albumid/$albumId?imgmax=1200";
        echo "URL $url <br />";
        
        $photoFeed = file_get_contents($url);
        if(!isset($photoFeed)) 
        {
            echo "Could not get photos for user"; // '$picasaUser';
        }
        else 
        {
            echo "splitting photo feed into cached xml files.";
                    
            // MORRIS - make sure that the lowerTimeBound starts at 12am of the day.
            // NOTE - I am not sure why this adjustment is needed.  Perhaps my photo timestamps are
            // in GMT but the time being sent by the client time is not?
            $lowerTimeBound = roundDownToNearestDay($lowerTimeBound);
            
            $nextUrl = ''; // This may be filled with the continuation query URL for the photo feed.
        
            while($lowerTimeBound < $upperTimeBound)
            {
                $outputPath = "picasaxml/".$lowerTimeBound.".xml";
                //$nextUrl = 
                outputXMLCacheForPicasaFeed($photoFeed, $outputPath,
                                       $lowerTimeBound, min($lowerTimeBound + $oneUnixDay, $upperTimeBound));
                
                $lowerTimeBound += $oneUnixDay;
            }
            
            //header('Content-Type: application/json');
            //echo json_encode(array(next => $nextUrl));
        }
    }
}
else
// This informs the caller of the start and end timestamps for the photos in the album
if(isset($_REQUEST["getAlbumStartAndEnd"]) &&
   isset($_REQUEST["picasaUserFeed"]) &&
   isset($_REQUEST["albumId"])) 
{
    $picasaUser = $_REQUEST["picasaUserFeed"];
    $albumId = $_REQUEST["albumId"];
    
    $url = "http://picasaweb.google.com/data/feed/api/user/$picasaUser/albumid/$albumId?imgmax=1200";
    
    $photoFeed = file_get_contents($url);
    if(!isset($photoFeed)) 
    {
        header('Content-type: text/html');
        echo "Could not get photos for user '$picasaUser'";
    }
    else 
    {          
        $xmlReadDoc = new DOMDocument();
        $xmlReadDoc->loadXML($photoFeed); // From text (xml)
        
        $numNextUrls = findAndAppendNextFeed($xmlReadDoc);
        
        $domNodeList = $xmlReadDoc->getElementsByTagname('entry');
    
        // Find the bound by looking at the range of timestamps in the Picasa feed.
        unset($lowerTimeBound);
        unset($upperTimeBound);
        setTimeBoundsFromFeed($domNodeList, $lowerTimeBound, $upperTimeBound);
    
        if(isset($lowerTimeBound) && isset($upperTimeBound))
        {
            header('Content-Type: application/json');
            echo json_encode(array(lowerTimeBound => $lowerTimeBound, upperTimeBound => $upperTimeBound, numNextUrls => $numNextUrls));
        }
        else
        {
            header('Content-type: text/html');
            echo "An error occurred when trying to get the time bounds.<br />";
        }
    }
}
// else 
// if(isset($_REQUEST["picasaUserFeed"])) {

	// header('Content-type: text/html');
    // $picasaUser = $_REQUEST["picasaUserFeed"];
    // $useJson = "&alt=json";
    // // Only request albums for this user
    // $url = "http://picasaweb.google.com/data/feed/api/user/$picasaUser?kind=album$useJson";
    // //echo "URL $url <br />";
    
    // $info = file_get_contents($url);
    // if(!isset($info)) {
        // echo "Could not get albums for user '$picasaUser'";
    // }
    // else {
        // if(isset($useJson)) {
            // header('Content-Type: application/json');
            // echo json_encode($info);
        // }
        // else {
            // echo "$info";
        // }
    // }
// }
else 
if(isset($_REQUEST["getJournalList"])) {
    //http://stackoverflow.com/questions/2922954/getting-the-names-of-all-files-in-a-directory-with-php
    header('Content-Type: application/json');
    
    echo json_encode(
        array_map(
            'basenameNoExt',
            array_filter(glob('journalfiles/*.*'), 'is_file')
            ));
}

function basenameNoExt($file)
{
    return basename($file, '.html');
}

//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

// For fetching photos from local xml cache:
// This function reads the local cache xml file (of Google Photos data)  
// from the local server and filters/returns those photos is a certain time range. 
// // Returns - the URL for the photo feed query if the current photo feed query did 
// // not contain all entries in the feed.  (Picasa albums can have > 1000 photos but
// // their photo feeds are limited to 1000 results.)
function outputXMLCacheForPicasaFeed($photoFeedXMLText, $outputFileName,
                                $lowerTimeBound, $upperTimeBound)
{		
	$xmlReadDoc = new DOMDocument();
	$xmlReadDoc->loadXML($photoFeedXMLText); // From text (xml)
    
    // Check to see if this feed hits picasa's 1000 item limit and
    // therefore new has a link 'next' to the next batch of feed items.
    //$nextUrl = getNextFeedPageURL($xmlReadDoc); 
    $numNextUrls = findAndAppendNextFeed($xmlReadDoc);
    
	$domNodeList = $xmlReadDoc->getElementsByTagname('entry');
    echo "<br />Number of (entry) nodes in domNodeList is ".$domNodeList->length;
	$domElemsToRemove = array();
	$validEntries = false;
	foreach ($domNodeList as $domEntryElement) 
	{
		$timestamp = getEntryTimestamp($domEntryElement);
        // Only filter by the timestamp value if the lower and/or upper
        // time bound is set.
		if( (!isset($lowerTimeBound) || $lowerTimeBound <= $timestamp) && 
            (!isset($upperTimeBound) || $timestamp <= $upperTimeBound) )
		{
            echo "<br />Photo timestamp is $timestamp is in range.";
			$validEntries = true;
			foreach($domEntryElement->childNodes as $domEntryChild)
			{
				if("media:group" == $domEntryChild->nodeName)
				{
					foreach($domEntryChild->childNodes as $domChildChild)
					{
					   if("media:content" != $domChildChild->nodeName &&
					      "media:thumbnail" != $domChildChild->nodeName &&
					      "media:keywords" !=  $domChildChild->nodeName)
					   {
					   	   $domElemsToRemove[] = $domChildChild;
					   }
					}
				}
                else if("exif:tags" == $domEntryChild->nodeName)
				{
					foreach($domEntryChild->childNodes as $domChildChild)
                    {
					   if("exif:time" != $domChildChild->nodeName)
					   {
					   	   $domElemsToRemove[] = $domChildChild;
					   }
                    }
                }
				else if("gphoto:timestamp" != $domEntryChild->nodeName)
				{
					$domElemsToRemove[] = $domEntryChild;
				}
			}
		}
		else
		{
			$domElemsToRemove[] = $domEntryElement;
		}
	}
	foreach($domElemsToRemove as $domEntryElement)
	{
		deleteNode($domEntryElement);
	} 
	if($validEntries)
	{
		$writefile = fopen($outputFileName, "w") or exit("Unable to open file!");
		fwrite($writefile, $xmlReadDoc->saveXML());
		echo "wrote ".$outputFileName;
		fclose($writefile);
	}
	else
	{
		echo " no entries to write";
	}
    
    //return $nextUrl;
}

//////////////////////////////////////////////////////////////////////////////////////////////
//  MORRIS - the idea below is that I could find the time range for the album automatically
// and build all the XML cache files at once.  The problem I am having is that I hit the 
// server's time-limit for processes if there is more than 1 day's worth of photos.


// This function will find the highest and lowest timestamps in the feed,
// and then set $lowerTimeBound and $upperTimeBound appropriately, only
// setting those variable which the user did not provide.
// $domNodeList - should be the list of Picasa Feed 'entry' elements
function setTimeBoundsFromFeed(&$domNodeList, &$lowerTimeBound, &$upperTimeBound)
{
    unset($lowestTimeTmp);
    unset($highestTimeTmp);
    foreach ($domNodeList as $domEntryElement) 
    {
        $timestamp = getEntryTimestamp($domEntryElement);
        if(!isset($lowestTimeTmp) || $timestamp < $lowestTimeTmp)
        {
            $lowestTimeTmp = $timestamp;
        }
        if(!isset($highestTimeTmp) || $highestTimeTmp < $timestamp)
        {
            $highestTimeTmp = $timestamp;
        }
    }
    
    if(!isset($lowerTimeBound))
    {
        $lowerTimeBound = $lowestTimeTmp;
    }
    if(!isset($upperTimeBound))
    {
        $upperTimeBound = $highestTimeTmp;
    }
}


// Picasa feeds have a 1000 item limit.  If the feed has hit 
// that limit, there will be a 'link' tag with the attribute
// rel="next".  This link tag will contain the href to the next
// batch of feed items.
function getNextFeedPageURL($xmlDocPicasaFeed)
{
    $domLinkItems = $xmlDocPicasaFeed->getElementsByTagname('link');
    foreach ($domLinkItems as $domLinkElement) 
    {         
        $rel = $domLinkElement->attributes->getNamedItem('rel');
        if(isset($rel) && 'next' == $rel->nodeValue)
        {
            return $domLinkElement->getAttribute('href');
        }
    }
    
    return "";
}

// The argument '$picasaXMLDOMDoc' is the DOMDocument for an XML Picasa Web album feed.   
// If that feed is incomplete (because the album has more than 1000 images), then
// this function will download the data from the next feed queries and
// merge them into '$picasaXMLDOMDoc'.
function findAndAppendNextFeed(&$picasaXMLDOMDoc)
{
    // Check to see if this feed hits picasa's 1000 item limit and
    // therefore new has a link 'next' to the next batch of feed items.
    $nextUrl = getNextFeedPageURL($picasaXMLDOMDoc);
    $numLoops = 0;
    while(0 < strlen($nextUrl))
    {
        // http://stackoverflow.com/questions/15491234/merge-two-xml-documents-into-one-replacing-original-root-elements-with-new-root
        // http://stackoverflow.com/questions/10341556/how-can-i-easily-combine-two-xml-documents-with-the-same-parent-node-into-one-do
        $photoFeedCont = file_get_contents($nextUrl);
        $xmlDocCont = new DOMDocument();
        $xmlDocCont->loadXML($photoFeedCont);            
        foreach($xmlDocCont->documentElement->childNodes as $child)
        {
            $child = $picasaXMLDOMDoc->importNode($child, TRUE);
            $picasaXMLDOMDoc->documentElement->appendChild($child);
        }
        $numLoops++;
        $nextUrl = getNextFeedPageURL($xmlDocCont);
    }
    
    return $numLoops;
}

?>