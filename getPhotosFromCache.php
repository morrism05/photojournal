<?php

require_once('domTreeUtils.php');
require_once('timestampUtils.php');

// For fetching photos from local xml cache:
// This generates the HTML for each thumbnail in the time range.
// MORRIS - Should I be returning JSON instead and doing the HTML construction on the client?
function outputXmlThumbsAsHtml($xmlDoc, $lowerTimeBound, $upperTimeBound, $keywordFilter)
{
	$domNodeList = $xmlDoc->getElementsByTagname('entry');
	foreach ($domNodeList as $domEntryElement) 
	{
		$timestamp = 0;
		$imageLink = "";
		$thumbnailLink = "";
		$width = 1;
		$height = 1;
		$keywords = "";
		foreach ($domEntryElement->childNodes as $domEntryChild)
		{
			if("gphoto:timestamp" == $domEntryChild->nodeName)
			{
				$timestamp = $domEntryChild->nodeValue/1000;
			}			
			if("media:group" == $domEntryChild->nodeName)
			{
				foreach($domEntryChild->childNodes as $domChildChild)
				{  
					if("media:content" == $domChildChild->nodeName)
					{
						$imageLink = $domChildChild->getAttribute("url");
					}
					
					if("media:thumbnail" == $domChildChild->nodeName)
					{
						$thumbnailLink = $domChildChild->getAttribute("url");
						if($domChildChild->getAttribute("width") > $domChildChild->getAttribute("height"))
							$height = $domChildChild->getAttribute("height")/$domChildChild->getAttribute("width");
						else
							$width = $domChildChild->getAttribute("width")/$domChildChild->getAttribute("height");
					}
					if("media:keywords" ==  $domChildChild->nodeName)
					{
						$keywords = $domEntryChild->nodeValue;
					}
				}
			}
		}
		
        // Originally we excluded timestamps equal to upperTimeBound because the upperTimeBound
        // would be from the first off screen timestamp.
        //if($upperTimeBound <= $timestamp) {
        // Now we include the last because at the end of a journal the last image needs to be seen onscreen.
		if($upperTimeBound < $timestamp)
        {
			break;
        }
		if($timestamp < $lowerTimeBound)
        {
            //echo "Before start time ($timestamp < $lowerTimeBound): $imageLink <br />";
			continue;
        }
		if(0 < strlen($keywordFilter))
		{
			if(0 >= strlen($keywords) ||
		           false === strpos($keywords, $keywordFilter))
				continue;
		}
		
		$formattedTime = formatTimestamp($timestamp);
		  
		$result = 
		"<div class=\"thumbnail_spacer\" data-time=\"".$timestamp."\">"
		."<a class=\"thumbnail_link blacktext\" data-time=\"".$timestamp."\" style=\"width:".$width."em; height:".$height."em;\" href=\"".$imageLink."\">"
		."<img class=\"thumbnail bwborder\" data-time=\"".$timestamp."\" style=\"width:".$width."em; height:".$height."em;\"  src=\"".$thumbnailLink."\" alt=\"".$formattedTime.", ".$keywords."\"/>"
		."</a>"
		."</div>"
		;
		
		echo $result;
	}
}

// Command Handling **********************************************************

// For fetching photos from local xml cache:
// This clause is called everytime we fetch thumbnails for a particular timespan,
// such as when we have scrolled down in the journal and need to refresh the images.
if(isset($_REQUEST["lowerTimeBound"]) &&
   isset($_REQUEST["upperTimeBound"])) {
	$upperTimeBound = $_REQUEST["upperTimeBound"];
	$lowerTimeBound = $_REQUEST["lowerTimeBound"];
	$keyword = $_REQUEST["keyword"];
    
    header('Content-type: text/html');
    	   
    // On my server in the "picasaxml/" folder I have .xml files which are  
    // caches of Google Photo data for one day.
    // Find the first cache file which might contain the requested time range.
	$fileTime = roundDownToNearestDay($lowerTimeBound);
    
    if($upperTimeBound <= 0)
    {
        
        // // MORRIS - this is suspect because my current day calc is based in 
        // // days that are start at UTC 0-time, and the photo times may be from
        // // other timezones.
        // // The $upperTimeBound will be 0 if there is just 1 timestamp on the screen.
        // // Limit the query 11:59pm of the current day.
        // // MORRIS 11:59 of the current UTC day often does not work out well.  For instance,
        // // if you happened to stay up until 1am of the next day, then I would give you all
        // // images from the next day too.    
        // $upperTimeBound = $fileTime + 86400;
        
        // Let's instead just show all the photos up to the requested time, and nothing more.
        $upperTimeBound = $lowerTimeBound;
        //echo "upperTimeBound set to $upperTimeBound<br/>";
    }
	
    // This loop visits the first xml file and iterates to the 
    // xml files of subsequent days as required.    
	while($fileTime < $upperTimeBound)
	{
        //echo "fileTime $fileTime <br />";
    
        $filePath = "picasaxml/".$fileTime.".xml";
        //echo "filePath set to $filePath<br/>";
        
        // I need to check that the XML file exists before
        // I try to load it.  Otherwise the error.log gets filled.
        if(file_exists($filePath))
        {
            // Load the cached XML document (which is the feed of photos from a day)
            // from Sam's server.
            $xmlDoc = new DOMDocument();
            $xmlDoc->load($filePath);
            
            outputXmlThumbsAsHtml($xmlDoc, $lowerTimeBound, $upperTimeBound, $keyword);
        }
        
		$fileTime += $oneUnixDay;
	}
}

?>