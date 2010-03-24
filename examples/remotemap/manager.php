<?php
$lat=$_GET["lat"];
$lng=$_GET["lng"];
$zoom=$_GET["zoom"];
$xml="<pos lat='{$lat}' lng='{$lng}' zoom='{$zoom}'/>";
file_put_contents("syncdata/position.xml",$xml);
?>
