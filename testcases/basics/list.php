<?php
$ob_file = fopen('index.html','w');

function ob_file_callback($buffer)
{
  global $ob_file;
  fwrite($ob_file,$buffer);
}

ob_start('ob_file_callback');
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html>
<head>
<style type="text/css">
html,body{
margin:0;
width:100%;
height:100%;
font-family:Arial;
}
#frame{
position:absolute;
top:70px;
left:200px;
right:100%;
bottom:0px;
width:80%;
height:180%;
border:0px solid lightgrey;
display:block;
}
.item{
border-bottom:1px solid gray;
}
.item a{
color:gray;
display:block;
width:100%;
background-color:white;
margin:0px;
padding:2px;
font-weight:bold;
text-decoration:none;
border:1px solid white;
}
.item a:hover{
background-color:black;
border:1px solid lightgrey;
color:white;
}
.item2 {
padding-right:20px;

}
.item2 a{
color:gray;
display:block;
width:100%;
background-color:white;
margin:0px;
padding-left:20px;
font-weight:bold;
text-decoration:none;
border:1px solid white;
font-size:12px;
}

.item2 a:hover{
background-color:black;
border:1px solid lightgrey;
color:white;
}

#selected a{
color:black;

background-color:yellow;

}
#header{
position:absolute;
top:0px;
left:0px;
width:100%;
height:50px;

-moz-box-shadow: 1px 1px 14px #dfdfdf;
-webkit-box-shadow: 1px 1px 14px #dfdfdf;
box-shadow: 1px 1px 14px #dfdfdf;
}

#navi{
list-style:none;
position:absolute;
padding:0px;
top:70px;
left:0px;
}
#sourcebutton button{
position:absolute;
top:10px;
right:10px;
}
#header h1{
position:absolute;
left:70px;
top:-20px;
}
</style>
<script type="text/javascript">
function showPage(el){
	var c=el.parentNode.parentNode.childNodes;
	
	for(var i=0; i < c.length; i++){	
		if(c.item(i).nodeType==1){
			//c.item(i).className="item";
			c.item(i).removeAttribute("id");
		}
	}
	el.parentNode.setAttribute("id","selected");
	var src=el.getAttribute("href");	
	var href="showsrc.php?file="+src;
	document.getElementById("sourcebutton").setAttribute("href",href);
}
function showSrc(src){
	var href="showsrc.php?file=src+"+src;
	document.getElementById("frame").href=href;

}
</script>
</head>
<body>
<ul id="navi">
<?php
$dir=new directoryIterator(".");
foreach($dir as $file){
	if($file->isDot())continue;
	if(substr($file,-4)==".php")continue;
	if(substr($file,-5)==".xslt")continue;
	if(substr($file,-4)==".swp")continue;
	if(substr($file,-4)==".png")continue;
	if($file=="index.html")continue;
	$f=$file->getFilename();
	$ff=$f;
	if($file->isDir()){
		$ff=$f."/index.html";
	}
	
	echo "<li class='item'><a href='{$f}'  onmouseup='showPage(this)' target='frame'>{$file->getFilename()}</a>  </li>";
	if($file->isDir()){
		$dir2=new directoryIterator($f);
		foreach($dir2 as $file2){
			if($file2->isDot())continue;
			if($file2=="index.html")continue;
			if(substr($file2,-5)!=".html"&&!$file2->isDir())continue;
			$fff=$file2->getFilename();
			if($file2->isDir()){
				//$fff.="/index.html";
			}
			echo "<li class='item2'><a href='{$f}/{$fff}'  onmouseup='showPage(this)' target='frame'>{$fff}</a>  </li>\n";
		}
	}
}




?>
</ul>
<div id="header">
<img src="favicon.png"/>
<h1>
khtml.maplib API examples
</h1>
<a href="#" id="sourcebutton" target="frame">
<button id="sourcebutton">source</button>
</a>
</div>
<iframe id="frame" name="frame" src="first.html">

</iframe>
</body>
</html>
<?php
ob_end_flush();
readfile("index.html");

?>
