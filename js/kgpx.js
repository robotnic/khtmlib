//
// This object takes an XML DOM Object or an XML String
// The second parameter is an optional className for styling
//

khtml.maplib.Gpx=function(gpx,classname) {

	//privat helper function - makes a dom Object from string
	function MyParseXml(xmlString)
	{
		var xmlDoc;
		//for IE
		if (window.ActiveXObject)
		{
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = false;
			xmlDoc.loadXML(xmlString);
		}
		//for Mozilla, Firefox, Opera, etc.
		else if (document.implementation && document.implementation.createDocument)
		{
			var parser = new DOMParser();
			xmlDoc = parser.parseFromString(xmlString,"text/xml");
		}
		return xmlDoc;
	}


	//
	//  START
	//

	if(typeof(gpx)=="string"){ //test if parameter is a string or dom object
		this.dom=MyParseXml(gpx);	
	}else{
		this.dom=gpx;
	}	

	this.layer=new khtml.maplib.Vector()
	if(classname){
		this.classname=classname;
	}

	this.minlat=90;
	this.maxlat=-90;
	this.minlng=180;
	this.maxlng=-180;


	var trksegs=this.dom.getElementsByTagName("trkseg");
	//iterate all track segments
	for(var i=0; i < trksegs.length;i++){
		var pointArray=new Array();

		var trkseg=trksegs.item(i);
		var trkpts=trkseg.getElementsByTagName("trkpt");
		//iterate all trackpoints
		for(var j=0; j < trkpts.length;j++){
			var trkpt=trkpts.item(j);
			var lat=parseFloat(trkpt.getAttribute("lat"));
			var lng=parseFloat(trkpt.getAttribute("lon"));
			pointArray.push(new khtml.maplib.Point(lat,lng));

			//calulate bounds
			if(this.minlat > lat) this.minlat=lat;
			if(this.maxlat < lat) this.maxlat=lat;
			if(this.minlng > lng) this.minlng=lng;
			if(this.maxlng < lng) this.maxlng=lng;
		}
		var line=this.layer.createPolyline(pointArray);
		if(this.classname){
			line.className=classname;
		}else{
			line.style.fill="none";
			line.style.stroke="blue";
			line.style.strokeWidth="2";
		}
	}


	this.init=function(mapObj){
		// call method in kvector.js
		this.layer.init(mapObj);
	}
	this.render=function(){
		// call method in kvector.js
		this.layer.render();
	}
	this.bounds=function(){
		var sw=new khtml.maplib.Point(this.minlat,this.minlng);
		var ne=new khtml.maplib.Point(this.maxlat,this.maxlng);
		var bounds=new khtml.maplib.Bounds(sw,ne);
		return bounds;
	}
	this.clear=function(){
		this.layer.clear();
	}




}

