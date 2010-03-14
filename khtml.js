
//
//  khtml javascript library
//  verion 0.34
//  LGPL Bernhard Zwischenbrugger
//  http://www.khtml.org/iphonemap/help.php
//
//  css3vector should bring more speed for vector graphics in webkit (disabled because of bugs)
//


//
//  styles for fonts, path,... it's just an array
//

function kStyle(){
	this.arrayStyle=new Array();
	this.myclass=null;
	this.addStyle=function(name,value){
		var style=new Array(name,value);
		this.arrayStyle.push(style);
	}
	this.setClassName=function(name){
		this.myClass=name;	
	}
	this.getClassName=function(name){
		return this.myClass;	
	}
	this.removeStyle=function(name){
		//not implemented
	}
	this.removeAllStyles=function(){
		//not implemented
	}
	this.getArray=function(){
		return this.arrayStyle;
	}

}

//
// Marker Object - work in progress
// There should be a possibility to add orbitrary html as marker
//

function kMarker(point,color){
	var img=document.createElement("img");
	var div=document.createElement("div");
	img.setAttribute("src","images/dot_"+color+".png");
	img.style.position="absolute";
	img.style.top="-3px";    //<---  flag
	img.style.left="-4px";    //<---  flag
	img.style.width="8px";    //<---  flag
	img.style.height="8px";    //<---  flag
	div.appendChild(img);
	div.style.position="absolute";
	div.style.top="0px";
	div.style.left="0px";
	this.marker=div;
	this.point=point;
		
	this.init=function(mapObj){
		mapObj.overlayDiv.appendChild(this.marker);
		this.render(mapObj);
	}
	this.render=function(mapObj){
		var xy=mapObj.latlngToXY(this.point);	
		if(xy["x"] < 40 || xy["y"] < 40) {    // <---- flag  ; workaround for overflow:hidden bug
			this.marker.style.display="none";
		}else{
			this.marker.style.display="";
			this.marker.style.left=xy["x"]+"px";
			this.marker.style.top=xy["y"]+"px";
		}
	}
	this.destroy=function(){
		this.marker.parentNode.removeChild(this.marker);
	}
	this.moveTo=function(point){
		this.point=point;
	}
}

//
//  maybe this can be removed
//

function kRect(bounds){
	this.bounds=bounds;
	this.rect=document.createElement("div");
	this.rect.style.position="absolute";
	this.rect.style.opacity=0.5;
	this.rect.style.border="2px solid red";

	this.init=function(mapObj){
		mapObj.overlayDiv.appendChild(this.rect);
		this.render(mapObj);
	}
	this.render=function(mapObj){
		var p1=this.bounds.getSW();
		var p2=this.bounds.getNE();
		var xy1=mapObj.latlngToXY(p1);
		var xy2=mapObj.latlngToXY(p2);
		//console.log(xy1["x"]+":"+xy1["y"]+":"+xy2["x"]+":"+xy2["y"]);
		this.rect.style.top=xy2["y"]+"px";
		this.rect.style.left=xy1["x"]+"px";
		this.rect.style.width=(xy2["x"] - xy1["x"])+"px";
		this.rect.style.height=(xy1["y"] - xy2["y"])+"px";
		
	}


}

//
//  Draws SVG Lines. The mathematics is not so easy but all difficult calculations are in latlng2XY and latlng2XYlayer
//  There are too versions for drawing. One for 3d css and the other for browsers without 3d css.
//  Code is a bit mixed (3dcss, non 3dcss)
//

function kPolyline(points,style){
	this.oldIntZoom=null;
	this.path=null;
	this.paths=new Array();
	this.text=null;
	this.textPath=null;
	this.renderComplete=new Array();
	if(style){
		this.styleArray=style.getArray();
	}else{
		this.styleArray=[];
	}
	
	if(points){
		this.points=points;
	}else{
		this.points=new Array();
	}
	
		
	this.init=function(mapObj){
		this.path=document.createElementNS("http://www.w3.org/2000/svg","path");
		this.path.setAttribute("fill","none");
		for(var i=0; i < this.styleArray.length;i++){
			this.path.setAttribute(this.styleArray[i][0],this.styleArray[i][1]);
		}
		
		if(!mapObj.css3dvector){	
			mapObj.svg.appendChild(this.path);
		}else{
			this.pathsvg=document.createElementNS("http://www.w3.org/2000/svg","svg");
			//this.pathsvg.style.top=-mapObj.svgHeight/2;
			//this.pathsvg.style.left=-mapObj.svgWidth/2;
			this.pathsvg.style.width=mapObj.svgWidth;
			this.pathsvg.style.height=mapObj.svgHeight;
			this.pathsvg.style.position="absolute";
			this.pathsvg.appendChild(this.path);
		}

		//dirty flag
		while(this.renderComplete.length >0){
			this.renderComplete.pop();
		}
	
	//	this.render(mapObj);
	}

	this.render=function(mapObj){
		if(!mapObj) return;
		this.map=mapObj;
		if(this.points.length < 2){
			return;
		}
		var intZoom=mapObj.intZoom;
		if(!mapObj.css3dvector){
			var svg=mapObj.svg;
			var path=this.path;
		}
		
		/*
		if(!svg){
			alert("big bug: 333");
			return;
		}
		*/


		if(mapObj.css3dvector){
			if(this.renderComplete[intZoom]=="yes"){
				return;	
			}
			this.renderComplete[intZoom]="yes";
		}

		if(mapObj.css3dvector){
                        var svg=this.pathsvg.cloneNode(true);
			
                        var path=svg.firstChild;
                }
		this.paths.push(path);



		var d="M";
		var c=0;	
		for(var point in this.points){
			if(mapObj.css3dvector){
				var xy=mapObj.latlngToXYlayer(this.points[point]);	
			}else{
				var xy=mapObj.latlngToXY(this.points[point]);	
			}
			if(d=="M"){
				d+=xy["x"]+","+xy["y"];
			}else{
				d+=" L"+xy["x"]+","+xy["y"];
			}
		}
		//console.log(d);
		path.setAttribute("d",d);
		//this.path.setAttribute("opacity",1);
		//document.getElementById("debug").textContent=d; //this.points[point].getLat()+":"+xy["y"];
		if(!mapObj.css3dvector){
			svg.appendChild(path);
		}else{
			mapObj.layers[intZoom]["svg"].appendChild(svg);
			//this.pathsvg.appendChild(path);
		}
		if(this.text){
			var id="khtml"+Math.random();
			path.setAttribute("id",id);
			if(!mapObj.css3dvector){
				this.textPath.setAttributeNS("http://www.w3.org/1999/xlink","href","#"+id);
				svg.appendChild(this.text);
			}else{
				var clonedText=this.text.cloneNode(true)
				svg.appendChild(clonedText);
				clonedText.firstChild.setAttributeNS("http://www.w3.org/1999/xlink","href","#"+id);
			}
		}
		
	}

	this.addPoint=function(point){
		this.points.push(point);
		if(this.map){
			this.render(this.map);
		}
	}
	this.setText=function(text,style){
		if(style){
			this.textStyleArray=style.getArray();
		}else{
			this.textStyleArray=[];
		}
		if(this.text){
			while(this.textPath.firstChild){
				this.textPath.removeChild(this.textPath.firstChild);
			}
		}else{
			this.text=document.createElementNS("http://www.w3.org/2000/svg","text");
			this.text.setAttribute("y",-2);
			this.textPath=document.createElementNS("http://www.w3.org/2000/svg","textPath");
			this.textPath.setAttribute("startOffset","50%");
			this.text.appendChild(this.textPath);
		}
		var textNode=document.createTextNode(text);
		this.textPath.appendChild(textNode);

		for(var i=0; i < this.textStyleArray.length;i++){
                        this.text.setAttribute(this.textStyleArray[i][0],this.textStyleArray[i][1]);
                }

	}
	this.setPoints=function(points){
		this.points=points;
		if(this.map){
			this.render(this.map);
		}
	}
	this.destroy=function(){
		debug="";
		document.getElementById("debug").textContent=debug;
		while(this.renderComplete.length >0){
			this.renderComplete.pop();
		}
		while(this.paths.length >0){
			var p=this.paths.pop();
			if(this.map.css3dvector){
				p=p.parentNode;
			}
			if(p.parentNode){
				p.parentNode.removeChild(p);
			}
			
		}
	}
}

//
// A Point in 2D
//

function kPoint(lat,lng){
	this.lat=parseFloat(lat);
	this.lng=parseFloat(lng);
	this.getLat=function(){
		return this.lat;
	}
	this.getLng=function(){
		return this.lng;
	}
}

//
// An area defined by 2 Points
//

function kBounds(sw,ne){
	this.sw=sw;
	this.ne=ne;
	this.center=new kPoint((sw.getLat() +ne.getLat())/2, (sw.getLng() +ne.getLng())/2);
	this.getSW=function(){
		return this.sw;
	}
	this.getNE=function(){
		return this.ne;
	}
	this.getCenter=function(){
		return this.center;
	}
	this.getDistance=function(){
		return distance(this.sw.getLat(),this.sw.getLng(),this.ne.getLat(),this.ne.getLng());
	}

	this.getInnerRadius=function(){
		var w=distance(this.center.getLat(),this.sw.getLng(),this.center.getLat(),this.ne.getLng());	
		var h=distance(this.sw.getLat(),this.center.getLng(),this.ne.getLat(),this.center.getLng());	
		if(w > h){
			return h/2;
		}else{
			return w/2;
		}

	}

	function distance(latdeg1,lngdeg1,latdeg2,lngdeg2){
		//Umrechnung von Grad auf Radian
		var lat1=latdeg1*Math.PI/180;
		var lng1=lngdeg1*Math.PI/180;
		var lat2=latdeg2*Math.PI/180;
		var lng2=lngdeg2*Math.PI/180;

		//Eigentliche Berechnung
		var w=Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(lng2 - lng1))*180/Math.PI        ;

		var d=w/360*40000*1000;

		return d;  //in meter

	}

}

//
//
//   THIS IS THE MAIN CLASS
//
//


function kmap(map){

	//Overlays 

	this.addOverlay=function(obj){
		this.overlays.push(obj);
		if(typeof(obj.init)=="function"){
			obj.init(this);
		}
		this.renderOverlays();
	}
	this.renderOverlays=function(){
		this.overlayDiv.style.display="";	
		if(!this.internetExplorer){
			this.svg.style.display="";	
		}
		var that=this;
		for(obj in this.overlays){
			this.overlays[obj].render(that);
		}
	}

	this.hideOverlays=function(){
		this.overlayDiv.style.display="none";	
		if(!this.internetExplorer){
			this.svg.style.display="none";	
		}
		/*
		for(obj in this.overlays){
	//		this.overlays[obj].hide();
		}
		*/
	}
	this.removeOverlays=function(){
		while(this.overlays.length >0){
			var overlay=this.overlays.pop();
			overlay.destroy();
		}

	}

	//
	// every change (lat,lng,zoom) will call a user defined function
	//

	this.callbackFunctions=new Array();
	this.addCallbackFunction=function(func){
		if(typeof(func)=="function"){
			this.callbackFunctions.push(func);
		}
	}
	this.executeCallbackFunctions=function(){
		for(var i=0;i< this.callbackFunctions.length;i++){
			this.callbackFunctions[i].call();
		}
	}


	//
	//  A simple distance measuring
	//
	this.startDistance=function(){
		this.distanceMeasuring="yes";
	}	
	this.endDistance=function(){
		this.distanceMeasuring="no";
	}	

	/*==================================================
	//
	//    Touchscreen and Mouse EVENTS
	//
	===================================================*/


	//
	//  Touchscreen
	//  Here also the multitouch zoom is done
	//

	this.start=function(evt){
		if(evt.preventDefault){
			evt.preventDefault(); // The W3C DOM way
		} else {
			evt.returnValue = false; // The IE way
		}
		this.hideOverlays();
		if(evt.touches.length ==1){
			this.startMoveX=this.moveX - evt.touches[0].pageX /this.faktor /this.sc;
			this.startMoveY=this.moveY - evt.touches[0].pageY  /this.faktor/this.sc;
			if(this.mousedownTime!=null){	
				var now=(new Date()).getTime();
				if(now - this.mousedownTime < this.doubleclickTime){
					var zoomD=Math.ceil(0.01+this.getZoom());
					this.autoZoomIn(evt.touches[0].pageX,evt.touches[0].pageY,zoomD);	
				}
			}
			this.mousedownTime=(new Date()).getTime();
			var that=this;
			var tempFunction=function () {that.autoZoomOut()};
			this.zoomOutInterval=window.setInterval(tempFunction,20);
		}
			
		if(evt.touches.length ==2){
			window.clearInterval(this.zoomOutInterval);
			this.moveok=false;
			var X1=evt.touches[0].pageX;
			var Y1=evt.touches[0].pageY;
			var X2=evt.touches[1].pageX;
			var Y2=evt.touches[1].pageY;
			this.startDistance=Math.sqrt(Math.pow((X2 - X1),2) + Math.pow((Y2 - Y1),2)) ;
			this.startZZ=this.zoom;
			var x=(X1+X2)/2 /this.faktor /this.sc;
			var y=(Y1+Y2)/2 /this.faktor /this.sc;
			this.startMoveX=this.moveX - x;
			this.startMoveY=this.moveY - y;
		}
	}

	this.move=function(evt){
		if(evt.preventDefault){
			evt.preventDefault(); // The W3C DOM way
		} else {
			evt.returnValue = false; // The IE way
		}

	//	this.mousedownTime=null;
		if(evt.touches.length ==1){
			if(this.moveok){
				this.moveX=evt.touches[0].pageX / this.faktor/this.sc + this.startMoveX;
				this.moveY=evt.touches[0].pageY / this.faktor/this.sc + this.startMoveY;
				if(!this.zoomOutStarted){
					if((Math.abs(this.moveX -this.startMoveX) > 0.01) ||(Math.abs(this.moveY - this.startMoveY) >0.01)){
						window.clearInterval(this.zoomOutInterval);
						this.zoomOutSpeed=0.01;
						this.mousedownTime=null;
					}
					var center=new kPoint(this.lat,this.lng);
					this.setCenter2(center,this.zoom);
				}
			}else{
				//alert("no move");
			}
		}

			//document.getElementById("debug").textContent=this.moveY;
		if(evt.touches.length == 2){
			this.mousedownTime=null;
			var X1=evt.touches[0].pageX;
			var Y1=evt.touches[0].pageY;
			var X2=evt.touches[1].pageX;
			var Y2=evt.touches[1].pageY;
			var Distance=Math.sqrt(Math.pow((X2 - X1),2) + Math.pow((Y2 - Y1),2)) ;
			var zoomDelta=(Distance / this.startDistance );
			//document.getElementById("debug").textContent=zoomDelta;
			var zz=this.startZZ+zoomDelta -1;
			if(zz < 1){
				zz=1;
			}
			if(zz > 18){
				zz=18;
				zoomDelta=1;
			}
			var x=(X1+X2)/2;
			var y=(Y1+Y2)/2;

			faktor=Math.pow(2,zz);   
			var zoomCenterDeltaX=x /faktor  -this.width/2;
			var zoomCenterDeltaY=y /faktor  -this.height/2;
			var f=Math.pow(2,zoomDelta -1);
			var dx=zoomCenterDeltaX - zoomCenterDeltaX*f;
			var dy=zoomCenterDeltaY - zoomCenterDeltaY*f;

			this.moveX=(x+dx) /faktor +this.startMoveX ;
			this.moveY=(y+dy) /faktor +this.startMoveY ;

			//document.getElementById("debug").textContent=x+":"+y+": "+dx+":"+dy+": "+this.startMoveX+":"+f+zoomDelta;

			var center=new kPoint(this.lat,this.lng);
			this.setCenter2(center,zz);
		}
	}

	this.end=function(evt){
		if(evt.preventDefault){
			evt.preventDefault(); // The W3C DOM way
		} else {
			evt.returnValue = false; // The IE way
		}
		window.clearInterval(this.zoomOutInterval);
		this.zoomOutStarted=false;
		if(evt.touches.length==0){
			this.moveok=true;
		}
	/*
		this.moveX=0;
		this.moveY=0;
		this.lat=this.movedLat;
		this.lng=this.movedLng;
	*/
		this.renderOverlays();
	}


	//
	//  mouse events
	//

	this.mousedown=function(evt){
		if(evt.preventDefault){
			evt.preventDefault(); // The W3C DOM way
		} else {
			window.event.returnValue = false; // The IE way
		}

		if(this.mousedownTime2!=null){
			var now=(new Date()).getTime();
			if(now - this.mousedownTime2 < this.doubleclickTime2){
				var zoom=this.getZoom();
				var zoomD=Math.ceil(0.01+this.getZoom())-zoom;
				this.autoZoomIn(evt.pageX -this.mapLeft,evt.pageY -this.mapTop,zoomD);
			}
		}
		this.mousedownTime2=(new Date()).getTime();

		if(this.distanceMeasuring=="yes"){
			this.distanceStartpoint=this.XYTolatlng(-this.mapLeft + evt.pageX,this.mapTop+this.height - evt.pageY);
			var marker=new kMarker(this.distanceStartpoint,"green");
			this.addOverlay(marker);
			this.moveMarker=new kMarker(this.distanceStartpoint,"green");
		
			var points=new Array();
			var style=new kStyle();
			style.addStyle("stroke-width",1);
			style.addStyle("stroke","green");
			this.measureLine=new kPolyline(points,style);
			this.addOverlay(this.measureLine);

			return;
		}


		if(evt.shiftKey){
			this.selectRectLeft=evt.pageX - this.mapLeft;
			this.selectRectTop=evt.pageY - this.mapTop;



	//		this.distanceStartpoint=this.XYTolatlng(-this.mapLeft + evt.pageX,this.mapTop+this.height - evt.pageY);

			this.selectRect=document.createElement("div");
			this.selectRect.style.left=this.selectRectLeft+"px";
			this.selectRect.style.top=this.selectRectTop+"px";
			this.selectRect.style.border="1px solid grey";
			this.selectRect.style.opacity=0.5;
			this.selectRect.style.position="absolute";
			this.selectRect.style.backgroundColor="white";
			this.map.parentNode.appendChild(this.selectRect);	
		}else{
			this.hideOverlays();
			this.startMoveX=this.moveX - (evt.pageX - this.mapLeft) /this.faktor /this.sc;
			this.startMoveY=this.moveY - (evt.pageY - this.mapTop)  /this.faktor/this.sc;
			this.movestarted=true;
		}
		return false;
	}

	this.mousemove=function(evt){
		if(evt.preventDefault){
			evt.preventDefault(); // The W3C DOM way
		} else {
			window.event.returnValue = false; // The IE way
		}
		//this.mousedownTime2=0; //if it's moved it's not a doubleclick
		if(this.distanceMeasuring){
			if(this.moveMarker){
				this.normalize();
				var movePoint=this.XYTolatlng(-this.mapLeft + evt.pageX,this.mapTop+this.height - evt.pageY);
				this.moveMarker.moveTo(movePoint);
				this.addOverlay(this.moveMarker);
				//add line
				var points=new Array();
				points.push(this.distanceStartpoint);
				points.push(movePoint);
				this.measureLine.setPoints(points);
				var mbr=new kBounds(movePoint,this.distanceStartpoint);
				var d=Math.round(mbr.getDistance());
				var dkm=d / 1000;
				/*		
				if(dkm > 10){
					dkm=Math.round(dkm*10)/10;
				}	
				if(dkm > 100){
					dkm=Math.round(dkm*100)/100;
				}	
				if(dkm > 1000){
					dkm=Math.round(dkm*1000)/1000;
				}	
				if(dkm > 10000){
					dkm=Math.round(dkm*10000)/10000;
				}	
				*/	
				var style2=new kStyle();
				style2.addStyle("fill","black");
				style2.addStyle("stroke","white");
				style2.addStyle("stroke-width",0.5);
				style2.addStyle("font-size","18px");
				style2.addStyle("font-weight","bold");
				style2.addStyle("text-anchor","middle");
				style2.addStyle("dy","-2");
				this.measureLine.setText(dkm+" km",style2);
				var that=this;
				this.measureLine.render(that);
				return;
			}
		}
		if(evt.shiftKey){
			if(this.selectRect){
				this.selectRect.style.width=evt.pageX - this.mapLeft - this.selectRectLeft+"px";
				this.selectRect.style.height=evt.pageY - this.mapTop - this.selectRectTop +"px";
			}
		}else{
			if(this.movestarted){
				this.moveX=(evt.pageX - this.mapLeft) / this.faktor/this.sc + this.startMoveX;
				this.moveY=(evt.pageY - this.mapTop) / this.faktor/this.sc + this.startMoveY;
				var center=new kPoint(this.lat,this.lng);
				//alert(evt.pageX);
				this.setCenter2(center,this.zoom);
			}
		}
		return false;
	}
	this.mouseup=function(evt){
		if(evt.preventDefault){
			evt.preventDefault(); // The W3C DOM way
		} else {
			evt.returnValue = false; // The IE way
		}
		if(this.moveMarker){
			this.moveMarker=null;
		}
		if(this.selectRect){
			var p1=this.XYTolatlng(this.selectRect.offsetLeft ,this.height - this.selectRect.offsetTop -this.selectRect.offsetHeight );
			var p2=this.XYTolatlng(this.selectRect.offsetLeft +this.selectRect.offsetWidth,this.height - this.selectRect.offsetTop  );
			/*
			var pp1=new kMarker(p1,"green");
			this.addOverlay(pp1);

			var pp2=new kMarker(p2,"green");
			this.addOverlay(pp2);
			*/


			var bounds=new kBounds(p1,p2);
			//alert(p1.getLat()+":"+p1.getLng()+":"+p2.getLat()+":"+p2.getLng());
			this.setBounds(bounds);
			this.selectRect.parentNode.removeChild(this.selectRect);			
			this.selectRect=null;
		}

		//using this normalize some things are working better, others not so goot. 
		//delelte it will solve some problems but bring other problems
		//this.normalize();

		this.movestarted=false;
		this.renderOverlays();
	}

	//
	// this function should draw the map and remove any moveX,moveY
	// Maybe buggy
	//
	this.normalize=function(){
		//normalize after move speed trick
		var lat=this.movedLat;
		var lng=this.movedLng;
		var center=new kPoint(lat,lng);
		var zoom=this.getZoom();
		this.moveX=0;
		this.moveY=0;
		this.setCenterNoLog(center,zoom);
		//end normalize (maybe this.stop needs the same)
	}

	//
	//  mouse wheel zoom
	//  the mousewheel speed depends on browser and os
	//  to optimize this could improve the map a lot.
	//  todo: wheelspeed
	//

	this.mousewheel=function(evt){
		if(evt.preventDefault){
			evt.preventDefault(); // The W3C DOM way
		} else {
			evt.returnValue = false; // The IE way
		}

		
		if (!evt) /* For IE. */
			evt = window.event;
		if (evt.wheelDelta) { /* IE/Opera. */
			delta = evt.wheelDelta/60;
			if (window.opera){
				delta = delta/4;
			}
		} else if (evt.detail) { /** Mozilla case. */
			delta = -evt.detail/3;
		}

		if (navigator.userAgent.match("Safari") ){
			delta = evt.wheelDelta/150;
		}
		var now=(new Date()).getTime();
		var timeDelta=now - this.zoomSpeedTimer;
		this.zoomSpeedTimer=now;
		if(timeDelta < 100){
			this.zoomSpeedAcceleration*=1.2;
		}else{
			this.zoomSpeedAcceleration=1;
		}
		var oldzoom=this.zoom;
		var dzoom=delta *this.zoomSpeed * this.zoomSpeedAcceleration;
		fak=30;

		var dzoom=delta/timeDelta* fak;

		if(!isNaN(dzoom)){
			var zoom=this.zoom+dzoom;
		}

		if(zoom < 1){
			zoom=1;
			dzoom=0;
		}


		faktor=Math.pow(2,zoom);   
		var zoomCenterDeltaX=(evt.pageX -this.mapLeft)   -this.width/2;
		var zoomCenterDeltaY=(evt.pageY -this.mapTop)  -this.height/2;
		var f=Math.pow(2,dzoom );

		var dx=zoomCenterDeltaX - zoomCenterDeltaX*f;
		var dy=zoomCenterDeltaY - zoomCenterDeltaY*f;

		this.moveX=this.moveX+dx /faktor;
		this.moveY=this.moveY+dy /faktor;

		this.setCenter2(this.center,zoom);	
		this.renderOverlays();

	}


	//
	//  zoom in animation
	//

	this.autoZoomIn=function(x,y,z){
		if(z < 0){
			//alert(this.getZoom());
			this.renderOverlays();
			return;
		}
		zoomGap=false;
		if(z < 0.1){
			zoomGap=true;
		}
		this.hideOverlays();
		var dzoom=0.1;
		var zoom=this.zoom + dzoom;
		if(zoomGap){
			zoom=Math.round(zoom);
			dzoom=z;
		}

		faktor=Math.pow(2,zoom);
		var zoomCenterDeltaX=x   -this.width/2;
		var zoomCenterDeltaY=y  -this.height/2;
		var f=Math.pow(2,dzoom );

		var dx=zoomCenterDeltaX - zoomCenterDeltaX*f;
		var dy=zoomCenterDeltaY - zoomCenterDeltaY*f;

		this.moveX=this.moveX+dx /faktor;
		this.moveY=this.moveY+dy /faktor;


		var center=new kPoint(this.lat,this.lng);
		this.setCenter2(center,zoom);
		var newz=z - dzoom;
		var that=this;
		if(!zoomGap){
		var tempFunction=function () {that.autoZoomIn(x,y,newz)};
		window.setTimeout(tempFunction,40);
		}
		
	}

	//
	//  zoom out animation
	//

	this.autoZoomOut=function(){
		if(this.mousedownTime!=null){	
			var now=(new Date()).getTime();
			if(now - this.mousedownTime > this.zoomOutTime){
				this.zoomOutStarted=true;
				var center=new kPoint(this.lat,this.lng);
				var zoom=this.zoom - this.zoomOutSpeed;
				this.setCenter2(center,zoom);
				this.zoomOutSpeed=this.zoomOutSpeed * 1.01;
			}
		}
	}	


	//
	//  Set the map coordinates and zoom
	//


	this.setCenter=function(center,zoom){
		this.moveX=0;
		this.moveY=0;
		this.record();
		this.executeCallbackFunctions();
		this.setCenterNoLog(center,zoom);
	}

	// same as setCenter but moveX,moveY are not reset (for internal use)

	this.setCenter2=function(center,zoom){
		//document.getElementById("debug").textContent=this.moveX+":"+this.moveY;
		this.record();
		this.executeCallbackFunctions();
		this.setCenterNoLog(center,zoom);
	}


	//
	// same as setCenter but no history item is generated (for undo, redo)
	//
	this.setCenterNoLog=function(center,zoom){
		/*
		this.moveX=0;
		this.moveY=0;
		*/
		var zoom=parseFloat(zoom);
		this.center=center;		
		this.zoom=zoom;	
		this.lat=center.getLat();
		this.lng=center.getLng();

		this.layer(this.map,this.lat,this.lng,this.moveX,this.moveY,zoom);
	}

	//
	//  For good speed many frames are dropped. If the frames must not be dropped, this medthod can be used
	//	
	this.forceSetCenter=function(center,zoom){
		var zoom=parseFloat(zoom);
		this.center=center;		
		this.zoom=zoom;	
		this.lat=center.getLat();
		this.lng=center.getLng();
		this.moveX=0;
		this.moveY=0;

		this.layer(this.map,this.lat,this.lng,this.moveX,this.moveY,zoom);
	}



	//
	//  read the map center (no zoom value)
	//

	this.getCenter=function(){
		var center=new kPoint(this.movedLat,this.movedLng);
		return center;
	}

	//
	//  read bounds. The Coordinates at corners of the map div  sw, ne would be better (change it!)
	//


	this.getBounds=function(){
		var p1=this.XYTolatlng(0,0);
		var p2=this.XYTolatlng(this.width,this.height);    
		var bounds=new kBounds(p1,p2);
	//	alert(p1.getLat()+":"+p1.getLng()+":"+p2.getLat()+":"+p2.getLng());
		return bounds;
	}

	//
	//  like setCenter but with two gps points
	//

	this.setBounds=function(b){
		this.getSize();
		var p1=b.getSW();
		var p2=b.getNE();
		var center=b.getCenter();
		var xy1=getTileNumber(p1.getLat(),p1.getLng(),0);
		var xy2=getTileNumber(p2.getLat(),p2.getLng(),0);
		var dx=Math.abs(xy1[0] - xy2[0]);
		var dy=Math.abs(xy1[1] - xy2[1]);
		zoomX=-(Math.log(dx))/(Math.log(2));
		zoomY=-(Math.log(dy))/(Math.log(2));
		if(zoomX < zoomY){
			var zoom=zoomX;
		}else{
			var zoom=zoomY;
		}
		if(zoom > 18){
			zoom=18;
		}
		zoom=zoom+1;
		this.setCenter(center,zoom);
		this.setMapPosition();

	}
	this.getZoom=function(){
		return this.zoom;
	}


	//
	// WGS84 to x,y at the layer calculation
	// This method is uses when 3D CSS is used.
	// For Vector graphics also the 3D CSS is used.
	//


        this.latlngToXYlayer=function(point){
		//if you use this function be warned that it only works for the SVG Layer an  css3d
                var zoom=this.map.intZoom;
                var lat=point.getLat();
                var lng=point.getLng();
                
                tileTest=getTileNumber(lat,lng,zoom);
                tileCenter=getTileNumber(this.movedLat,this.movedLng,zoom);

                var faktor=Math.pow(2,this.intZoom);
                var x=(tileCenter[0] - tileTest[0])*this.tileW*faktor ;
                var y=(tileCenter[1] - tileTest[1])*this.tileW*faktor ;

		if(x > 1000000){
			alert("grosser wert");
		}

		var dx=this.layers[this.intZoom]["dx"];
		var dy=this.layers[this.intZoom]["dy"];
		//alert(dx+":"+dy);

                var point= new Array();
                //alert(lng+":"+this.movedLng+":"+x+":"+tileCenter[0]+":"+tileTest[0]);
                point["x"]=-x +this.svgWidth/2 ;
                point["y"]=-y +this.svgHeight/2 ;
		/*
                var rand=Math.random();
                if(rand > 1.2){
                        point["x"]=0;
                        point["y"]=0;
                }
		*/

//                var debug=point["x"]+":"+point["y"]+":"+this.intZoom;
                return(point);

        }

	//
	// WGS84 to x,y at the div calculation
	//

	this.latlngToXY=function(point){
		var lat=point.getLat();
                var lng=point.getLng();
		tileTest=getTileNumber(lat,lng,this.intZoom);
		tileCenter=getTileNumber(this.movedLat,this.movedLng,this.intZoom);
		var x=(tileCenter[0] - tileTest[0])*this.tileW*this.sc -this.width/2;
		var y=(tileCenter[1] - tileTest[1])*this.tileW*this.sc -this.height/2; 

		var point= new Array();
		//alert(lng+":"+this.movedLng+":"+x+":"+tileCenter[0]+":"+tileTest[0]);
		point["x"]=-x;
		point["y"]=-y;
		return(point);

	}


	//
	//  screen (map div) coordinates to lat,lng 
	//

	this.XYTolatlng=function(x,y){
		var center=this.getCenter();
		if(!center){return};
		var faktor=Math.pow(2,this.intZoom)
		var centerLat=center.getLat();
		var centerLng=center.getLng();

		var xypoint=getTileNumber(centerLat,centerLng,this.intZoom);
		var dx=x - this.width/2;
		var dy=-y + this.height/2;  //das style
	
                var lng=(xypoint[0] + dx/this.tileW/this.sc )/faktor  *360 -180;
                var lat360=(xypoint[1] + dy/this.tileH/this.sc )/faktor  *360 -180;

//		alert("dx:"+dx/this.tileW+" center: "+xypoint[0]+":"+lng+":"+lat360);
	
		var lat=-y2lat(lat360)+0;
		var p=new kPoint(lat,lng);
		return p;
	}


	//
	//  for iPhone to make page fullscreen (maybe not working)
	//

	this.reSize=function(){
		var that=this;
		//setTimeout("window.scrollTo(0,1)",500);
		var tempFunction=function () {that.getSize(that)};
		window.setTimeout(tempFunction,1050);

	}

	//
	// read the size of the DIV that will contain the map
	//


	this.getSize=function(){
		this.width=this.map.parentNode.offsetWidth;
		this.height=this.map.parentNode.offsetHeight;
		var obj=this.map
		var left=0;
		var top=0;
		do {
			left += obj.offsetLeft;
			top  += obj.offsetTop ;
			obj = obj.offsetParent;
		} while (obj.offsetParent);

		this.map.style.left=this.width/2+"px";  //not very good programming style
		this.map.style.top=this.height/2+"px";  //not very good programming style
		this.mapTop=top;
		this.mapLeft=left;
	}


	//for undo,redo
	this.recordArray=new Array();		
	this.record=function(){
		var center=this.getCenter();
		var lat=center.getLat();
		var lng=center.getLng();
		var zoom=this.getZoom();
		var item=new Array(lat,lng,zoom);
		this.recordArray.push(item);
	}
	this.play=function(i){
		if(i <1) return;
		if(i > (this.recordArray.length -1)) return;
		var item=this.recordArray[i];
		var center=new kPoint(item[0],item[1]);
		//undo,redo must not generate history items
		this.moveX=0;
		this.moveY=0;
		this.setCenterNoLog(center,item[2]);
	}



	/*================== layer (which layer is visible) =====================
	Description: This method desides with layer is visible at the moment. 
	It has the same parameters as the "draw" method, but no "intZoom"
	========================================================================= */

	
	this.layer=function(map,lat,lng, moveX, moveY, zoom){
		if(!this.css3d){
			if(this.blocked)return;
			this.blocked=true;
		}
		var intZoom=Math.floor(zoom);
		if(intZoom > this.maxIntZoom){
			intZoom=18;
		}
		this.intZoom=intZoom;
		//document.getElementById("debug").textContent=intZoom;
		if(!this.visibleZoom){
			this.visibleZoom=intZoom;
			this.oldIntZoom=intZoom;
		}
		this.faktor=Math.pow(2,intZoom);   //????????
                var zoomDelta=zoom - intZoom;
                this.sc=Math.pow(2,zoomDelta);

		//draw the layer with current zoomlevel
		this.draw(this.map,lat,lng,moveX,moveY,intZoom,zoom);

		//if the current zoomlevel is not loaded completly, there must be a second layer displayed
		if(intZoom!=this.visibleZoom){
			this.draw(this.map,lat,lng,moveX,moveY,this.visibleZoom,zoom);
		}

		
		if(this.layers[intZoom]["loadComplete"] ){
			if(this.visibleLayer!=intZoom){
				this.hideLayer(this.visibleZoom);
				this.visibleZoom=intZoom;
				this.layers[this.visibleZoom]["layerDiv"].style.visibility="";
			}
		}
		if(this.oldIntZoom!=this.intZoom){
			if(this.oldIntZoom!=this.visibleZoom){
				this.hideLayer(this.oldIntZoom);
			}
		}
		this.oldIntZoom=intZoom;	

		//firefox cheats a little bit and needs a time penalt
		if(!this.css3d){
			var that=this;
			var func=function(){that.blocked=false;};
			window.setTimeout(func,10);
		}
	}






	/* ==================== DRAW (speed optimized!!!)===============================
	
	This function draws one layer. It is highly opimized for iPhone. 
	Please DO NOT CHANGE things except you want to increase speed!
	For opimization you need a benchmark test.

	How it works:
	The position of the images is fixed.
	The layer (not the images) is moved because of better performance
	Even zooming does not change position of the images, if 3D CSS is active (webkit).

	this method uses "this.layers" , "this.oldIntZoom", "this.width", "this.height";
	
	===================================================================================*/

	this.draw=function(map,lat,lng, moveX, moveY, intZoom,zoom){
		var faktor=Math.pow(2,intZoom);

		//create new layer
		if(!this.layers[intZoom]){
			var tile=getTileNumber(lat,lng,intZoom);
			this.layers[intZoom]=new Array();
			this.layers[intZoom]["startTileX"]=tile[0];
			this.layers[intZoom]["startTileY"]=tile[1];
			this.layers[intZoom]["startLat"]=lat;
			this.layers[intZoom]["startLng"]=lng;
			this.layers[intZoom]["images"]=new Object();
			var layerDiv=document.createElement("div");
			layerDiv.setAttribute("zoomlevel",intZoom);
			layerDiv.style.position="absolute";

			//svg layer for scalable things
			if(this.css3dvector){
				var svg=document.createElement("div");
				svg.style.top=-this.svgHeight/2;
				svg.style.left=-this.svgWidth/2;
				svg.style.zIndex=1;
				svg.style.position="absolute";
				this.layers[intZoom]["svg"]=svg;
				layerDiv.appendChild(svg);
			}
			


			//higher zoomlevels are places in front of lower zoomleves.
			//no z-index in use.  z-index could give unwanted side effects to you application if you use this lib.
			var layers=map.childNodes;
			var appended=false;
			for(var i=layers.length-1; i>=0;i--){
				var l=layers.item(i);	
				if(l.getAttribute("zoomlevel")  < intZoom){
					
					this.map.insertBefore(layerDiv,l);
					appended=true;
					break;
				}
			}
			if(!appended){
				//the new layer has the highest zoomlevel
				this.map.appendChild(layerDiv);
			}
		
			//for faster access, a referenz to this div is in an array	
			this.layers[intZoom]["layerDiv"]=layerDiv;
			var latDelta=0;
			var lngDelta=0;
		}else{
			//The layer with this zoomlevel already exists. If there are new lat,lng value, the lat,lng Delta is calculated
			var layerDiv=this.layers[intZoom]["layerDiv"];
			var latDelta=lat-this.layers[intZoom]["startLat"];
			var lngDelta=lng-this.layers[intZoom]["startLng"];
			//console.log(latDelta+":"+lngDelta);
		}
		layerDiv.style.visibility="hidden";

		//if the map is moved with drag/drop, the moveX,moveY gives the movement in Pixel (not degree as lat/lng)
		//here the real values of lat, lng are caculated
		this.movedLng=(this.layers[intZoom]["startTileX"]/faktor - moveX/this.tileW )  *360 -180 +lngDelta;
		var movedLat360=(this.layers[intZoom]["startTileY"]/faktor - moveY/this.tileH )  *360 -180 ;
		this.movedLat= -y2lat(movedLat360) +latDelta;

		//calculate real x,y
		var tile=getTileNumber(this.movedLat,this.movedLng,intZoom);
		var x=tile[0];
		var y=tile[1];
		

		var intX=Math.floor(x);
		var intY=Math.floor(y);
		
		
		var startX=this.layers[intZoom]["startTileX"];
		var startY=this.layers[intZoom]["startTileY"];

		var startIntX=Math.floor(startX);
		var startIntY=Math.floor(startY);

		var startDeltaX=-startX + startIntX;
		var startDeltaY=-startY + startIntY;

		var dx= x -startX ;
		var dy=y -startY ;


		var dxInt=Math.floor(dx -startDeltaX);
		var dyInt=Math.floor(dy -startDeltaY);
		var dxDelta=dx - startDeltaX ;
		var dyDelta=dy - startDeltaY;

		//work in progress
		if(this.css3dvector){
			if(!this.layers[intZoom]["dx"]){
				this.layers[intZoom]["dx"]=+dxDelta*this.tileW -this.svgWidth/2;
				this.layers[intZoom]["svg"].style.left=this.layers[intZoom]["dx"]+"px";
						
			}
			if(!this.layers[intZoom]["dy"]){
				this.layers[intZoom]["dy"]=+dyDelta*this.tileH -this.svgHeight/2;
				this.layers[intZoom]["svg"].style.top=this.layers[intZoom]["dy"]+"px";
			}
		}


		//set all images to hidden (only in Array) - the values are used later in this function
                for(var vimg in this.layers[intZoom]["images"]){
			this.layers[intZoom]["images"][vimg]["visibility"]=false;
		}

		//for debug only
		var width=this.width;
		var height=this.height;

                var zoomDelta=zoom - intZoom;
                sc=Math.pow(2,zoomDelta);

		if(sc < 1) sc=1;
		//here the bounds of the map are calculated.
		//there is NO preload of images. Preload makes everything slow
		minX=Math.floor((-width/2 /sc) /this.tileW  +dxDelta ) ;
		maxX=Math.ceil((width/2 /sc) /this.tileW +dxDelta ) ;
		minY=Math.floor((-height/2 /sc) /this.tileH +dyDelta);
		maxY=Math.ceil((height/2 /sc) /this.tileH +dyDelta);
		

		//now the images are placed on to the layer
                for(var i= minX; i < maxX;i++){
                for(var j=  minY; j < maxY;j++){
			var xxx=Math.floor(startX + i );
			var yyy=Math.floor(startY + j );

			//The world is recursive. West of America is Asia.
                        var xx=xxx % faktor;
                        var yy=yyy % faktor;
                        if(xx < 0) xx=xx+faktor;  //modulo function gives negative value for negative numbers
                        if(yy < 0) yy=yy+faktor;

			//Calculate the tile server. Use of a,b,c should increase speed but should not influence cache.
			var hashval=(xx + yy) %3;
			switch(hashval){
				case 0:var server="a";break;
				case 1:var server="b";break;
				case 2:var server="c";break;
				default: var server="f";
			}
				
                        var src="http://"+server+".tile.openstreetmap.org/"+intZoom+"/"+xx+"/"+yy+".png";
//                        var src="/iphonemapproxy/imgproxy.php?url=http://"+server+".tile.openstreetmap.org/"+intZoom+"/"+xx+"/"+yy+".png";
			//see imageproxy.php for offline map usage

			//bing tiles
			//var n=mkbin(intZoom,xxx,yyy);
			//var src="http://ecn.t0.tiles.virtualearth.net/tiles/a"+n+".jpeg?g=367&mkt=de-de";
			//var src="http://maps3.yimg.com/ae/ximg?v=1.9&t=a&s=256&.intl=de&x="+xx+"&y="+(yy)+"&z="+intZoom+"&r=1";
			//end bing tiles

			//
                        var id="http://"+server+"c.tile.openstreetmap.org/"+intZoom+"/"+xxx+"/"+yyy+".png";
		
			//draw images only if they don't exist on the layer	
                        if(this.layers[intZoom]["images"][id] == null){
		
                                var img=document.createElement("img");
                                img.style.visibility="hidden";
                                img.style.position="absolute";
                                img.setAttribute("src",src);
                                img.style.left=i*this.tileW+"px";
                                img.style.top=j*this.tileH+"px";
                                img.style.width=this.tileW+"px";
                                img.style.height=this.tileH+"px";

				//if the images are loaded, they will get visible in the imgLoad function
                                Event.attach(img,"load",this.imgLoaded,this,false);
                                Event.attach(img,"error",this.imgError,this,false);

				//add img before SVG, SVG will be visible 
				if(layerDiv.childNodes.length >0){
                                        layerDiv.insertBefore(img,layerDiv.childNodes.item(0));
                                }else{
                                        layerDiv.appendChild(img);
                                }

				//To increase performance all references are in an array
                                this.layers[intZoom]["images"][id]= new Object();
                                this.layers[intZoom]["images"][id]["img"]=img;
				this.layers[intZoom]["loadComplete"]=false;
				//}	
			
                        }else{

			}

			if(!this.css3d){
		
				var sc=Math.pow(2,zoomDelta);
				var ddX=(tile[0]-intX )+ Math.floor(dxDelta);
				var ddY=(tile[1]-intY )+ Math.floor(dyDelta);
				
				var tileW=Math.round(this.tileW*sc);
				var tileH=Math.round(this.tileH*sc);

				var left=Math.floor((-ddX)*tileW +i*tileW );
				var top=Math.floor(-ddY*tileH +j*tileH );
				var right=Math.floor((-ddX)*tileW +(i+1)*tileW );
				var bottom=Math.floor(-ddY*tileH +(j+1)*tileH );
				var img=this.layers[intZoom]["images"][id]["img"];
				img.style.left=left+"px";
				img.style.top=top+"px";
				img.style.height=(right - left )+"px";
				img.style.width=(bottom - top )+"px";
			
			}


			//set all images that should be visible at the current view to visible (only in the layer);
                        this.layers[intZoom]["images"][id]["visibility"]=true;

                }}

		//remove all images that are not loaded and are not visible in current view.
		//if the images is out of the current view, there is no reason to load it. 
		//Think about fast moving maps. Moving is faster than loading. 
		//If you started in London and are already in Peking, you don't care
		//about images that show vienna for example
		//this code is useless for webkit browsers (march 2010) because of bug:
		//https://bugs.webkit.org/show_bug.cgi?id=6656

                for(var vimg in this.layers[intZoom]["images"]){
			if(this.layers[intZoom]["images"][vimg]["visibility"]){
				this.layers[intZoom]["images"][vimg]["img"].style.visibility="";
			}else{
				this.layers[intZoom]["images"][vimg]["img"].style.visibility="hidden";
				//delete img if not loaded and not needed at the moment
				if(this.layers[intZoom]["images"][vimg]["img"].getAttribute("loaded")!="yes"){
					/*	
					var src=this.layers[zoomlevel]["images"][vimg]["img"].getAttribute("src");	
					var z=this.intZoom;
					src=src+"&nix=first&zoom="+z;
					this.layers[zoomlevel]["images"][vimg]["img"].setAttribute("src",src);
					*/
					layerDiv.removeChild(this.layers[intZoom]["images"][vimg]["img"]);	
					delete this.layers[intZoom]["images"][vimg]["img"];
					delete this.layers[intZoom]["images"][vimg];
				}	
			}
		}


		//move and zoom the layer
		//The 3D CSS is used to increase speed. 3D CSS is using hardware accelerated methods to zoom and move the layer.
		//every layer is moved independently - maybe not the best approach, but maybe the only working solution

                var zoomDelta=zoom - intZoom;
                var sc=Math.pow(2,zoomDelta);
		var left=-dxDelta * this.tileW ;
		var top=-dyDelta * this.tileH ;


		if(this.css3d){
			//document.getElementById("debug").textContent=zoomDelta+": "+sc+": "+left+": "+top;
                        var scale=" scale3d("+sc+","+sc+",1) ";
			/*	
			var zx=this.zoomCenterDeltaX;	
			var zy=this.zoomCenterDeltaY;	
			left=left-zx*sc;
			top=top-zx*sc;
			*/

                        layerDiv.style['-webkit-transform-origin']=(-1*left )+"px "+(-1*top )+"px";
                        var transform= 'translate3d('+left+'px,'+top+'px,0px)  '+scale;
                        layerDiv.style.webkitTransform=transform;
                }else{
                        //layerDiv.style.left=left+"px";
                        //layerDiv.style.top+"px";
                }

		//set the visibleZoom to visible
		layerDiv.style.visibility="";
	}
// ====== END OF DRAW ======	


//
//  this function was for BING tiles. It's not in use but I don't want to dump it.
//


	function mkbin(z,x,y){
		var nn=parseInt(x.toString(2))+parseInt(y.toString(2))*2;
		n="";
		for(var i=0; i < 30; i++){
			var restX=parseInt(x/2);
			var restY=parseInt(y/2);
			var xx=(x/2-restX)*2;
			var yy=(y/2-restY)*2;
			x=restX;	
			y=restY;	
			s=Math.round(xx+yy*2);
			n=s+n;
			if(x==0 && y==0) break;
		}
			
		/*
		var xx=parseInt(xxx/1000000);
		var yy=parseInt(yyy/1000000);
		var xx1=(xxx/1000000 - xx)*1000000;
		var yy1=(yyy/1000000 - yy)*1000000;
		var n1=xx+yy*2;	
		var n2=Math.round(xx1)+Math.round(yy1)*2;
		var n=parseInt(xxx)+parseInt(yyy)*2;	
		var nn="";
		if(n2 <100000) nn="0";
		if(n2 <10000) nn="00";
		if(n2 <1000) nn="000";
		if(n2 <100) nn="0000";
		if(n2 <10) nn="00000";
		var nnn=n1+nn+n2;
		*/
		document.getElementById("debug").textContent=n+":"+nn;
		return n;
	}

	//
	//this function trys to remove images if they are not needed at the moment.
	//For webkit it's a bit useless because of bug
	//https://bugs.webkit.org/show_bug.cgi?id=6656
	//For Firefox it really brings speed
	//	
	this.hideLayer=function(zoomlevel){
		if(this.intZoom!=zoomlevel){
			if(this.layers[zoomlevel]){
				this.layers[zoomlevel]["layerDiv"].style.visibility="hidden";
			}
		}
			
		//delete img if not loaded and not needed at the moment
		//for(var layer in this.layers){
		//var zoomlevel=layer;
                //for(var vimg in this.layers[zoomlevel]["images"]){
                for(var vimg in this.layers[zoomlevel]["images"]){
			if(this.layers[zoomlevel]["images"][vimg]){
			if(this.layers[zoomlevel]["images"][vimg]["img"]){
			if(this.layers[zoomlevel]["images"][vimg]["img"].getAttribute("loaded")!="yes"){
				if(zoomlevel!=this.intZoom){
					/*
					var src=this.layers[zoomlevel]["images"][vimg]["img"].getAttribute("src");	
					var z=this.intZoom;
					src=src+"&nix=load&zoom="+z;
					this.layers[zoomlevel]["images"][vimg]["img"].setAttribute("src",src);
					*/
					this.layers[zoomlevel]["images"][vimg]["img"].setAttribute("src","#");
					this.layers[zoomlevel]["layerDiv"].removeChild(this.layers[zoomlevel]["images"][vimg]["img"]);	
					delete this.layers[zoomlevel]["images"][vimg]["img"];
					delete this.layers[zoomlevel]["images"][vimg];
				}
			}else{

			}
			}
			}
		}

	}

	//
	// method is called if an image has finished loading  (onload event)
	//
        this.imgLoaded=function(evt){
		if(evt.target){
			var img=evt.target;
		}else{
			var img=evt.srcElement;
		}
		var loadComplete=true;
		img.style.visibility="";
		img.setAttribute("loaded","yes");
		if(!img.parentNode)return;
		var zoomlevel=img.parentNode.getAttribute("zoomlevel");
		for(var i=0; i < img.parentNode.getElementsByTagName("img").length;i++){
			if(img.parentNode.getElementsByTagName("img").item(i).getAttribute("loaded")!="yes"){
				loadComplete=false;
			}		
		}

		this.layers[zoomlevel]["loadComplete"]=loadComplete;
		if(loadComplete){
		if(this.intZoom==zoomlevel){
		//if(Math.abs(this.intZoom - zoomlevel) < Math.abs(this.intZoom - this.visibleZoom)){
			//this.layers[this.visibleZoom]["layerDiv"].style.visibility="hidden";
			this.hideLayer(this.visibleZoom);
			this.visibleZoom=zoomlevel;
			this.layers[this.visibleZoom]["layerDiv"].style.visibility="";
		}		
		}		
		//document.getElementById("debug").textContent=this.visibleZoom+" : "+this.intZoom;

        }
	//
	// Image load error
	//
        this.imgError=function(evt){
                //evt.target.style.backgroundColor="lightgrey";
		this.imgLoaded(evt);
        }

	//next function is from wiki.openstreetmap.org
        var getTileNumber=function(lat, lon, zoom) {
                var xtile = ( (lon + 180) / 360 * (1<<zoom) ) ;
                var ytile = ( (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1<<zoom) ) ;
//		alert("LL: "+lon+":"+lat+":"+xtile+":"+zoom);
                var returnArray=new Array(xtile,ytile);
                return returnArray;
        }

	//map is positioned absolute and is an a clone of the original map div.
	//on window resize it must be positioned again
	this.setMapPosition=function(){
		var obj=this.mapParent;
		this.clone.style.width=obj.offsetWidth+"px";
		this.clone.style.height=obj.offsetHeight+"px";
		var left=0;
		var top=0;
		do {
			left += obj.offsetLeft;
			top  += obj.offsetTop ;
			obj = obj.offsetParent;
		} while (obj.offsetParent);
		//console.log(left,top);
		this.clone.style.top=top+"px";
		this.clone.style.left=left+"px";
		this.clone.style.position="absolute";
		this.clone.style.overflow="hidden";
		document.body.appendChild(this.clone);
	}
                       
	//functions from wiki gps2xy 
        var lat2y=function(a) { return 180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2));}
        var y2lat=function(a) { return 180/Math.PI * (2 * Math.atan(Math.exp(a*Math.PI/180)) - Math.PI/2); }


	//
	//
	//  INIT kmap
	//
	//

	this.internetExplorer=false;
        if(navigator.userAgent.indexOf("MSIE")!=-1){
                this.internetExplorer=true;
		//alert("Sorry, Internet Explorer does not support this map, please use a good Browser like chrome, safari, opera.");
        }

	this.maxIntZoom=18;
        this.mapParent=map;
	mapInit=map;
	
	map=mapInit.cloneNode(true);

	this.clone=map;
	map.removeAttribute("id");
        var obj=mapInit;
	this.setMapPosition();

	//should be bigger than screen
	this.svgWidth=100000;
	this.svgHeight=100000;
/*
	var left=0;
	var top=0;
        do {
                left += obj.offsetLeft;
                top  += obj.offsetTop ;
                obj = obj.offsetParent;
        } while (obj.offsetParent);
	map.style.top=top+"px";
	map.style.left=left+"px";
*/
	//document.body.appendChild(map);


	//distance tool
	this.distanceMeasuring="no";
	this.moveMarker=null;
	this.measureLine=null;


        this.map=document.createElement("div");
        this.map.style.position="absolute";
        map.appendChild(this.map);
        this.getSize();

        this.overlayDiv=document.createElement("div");
        this.overlayDiv.style.width=this.width+"px";
        this.overlayDiv.style.height=this.height +"px";
        this.overlayDiv.style.position="absolute";
        this.overlayDiv.style.overflow="hidden";
	map.appendChild(this.overlayDiv);

	if(!this.internetExplorer){
		this.svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
		this.svg.style.width=this.width;
		this.svg.style.height=this.height;
		this.svg.style.position="absolute";
		map.appendChild(this.svg);
		map.style.overflow="hidden";
	}

        this.layers=new Array();
        this.overlays=new Array();
        this.visibleZoom=null;
        this.oldVisibleZoom=null;
        this.intZoom=null;

        this.moveX=0;
        this.moveY=0;
        this.startMoveX=0;
        this.startMoveY=0;
        this.sc=1;
	this.blocked=false;

        this.tileW=256;
        this.tileH=256;
        this.zoom=1;
        this.movestarted=false;

	//touchscreen
        this.mousedownTime=null;
        this.doubleclickTime=200;
	//mouse
        this.mousedownTime2=null;
        this.doubleclickTime2=500;

        this.zoomOutTime=1000;
        this.zoomOutSpeed=0.01;
        this.zoomOutInterval=null;
        this.zoomOutStarted=false;

        this.zoomSpeed=0.2;
        this.zoomSpeedTimer=null;
        this.zoomSpeedAcceleration=1;


        this.css3d=false;
	this.css3dvector=false;
        if(navigator.userAgent.indexOf("iPhone OS")!=-1){
                this.css3d=true;
        }
        if(navigator.userAgent.indexOf("Safari")!=-1){
                this.css3d=true;
        }

	if(this.internetExplorer){
		var w=map;
	}else{
		var w=window;
		// how to do that in ie?
		Event.attach(window,"resize",this.getSize,this,false);
	}
	Event.attach(map,"touchstart",this.start,this,false);
	Event.attach(map,"touchmove",this.move,this,false);
	Event.attach(w,"touchend",this.end,this,false);
	Event.attach(w,"mousemove",this.mousemove,this,false);
	Event.attach(map,"mousedown",this.mousedown,this,false);
	Event.attach(w,"mouseup",this.mouseup,this,false);
	Event.attach(w,"orientationchange",this.reSize,this,false);
	Event.attach(map,"DOMMouseScroll",this.mousewheel,this,false);
}





 
 
 
 
 
 
 
 
// Rest of Code ist a Copy from
//http://hiveminds.org.hiveminds.co.uk/phpBB/viewtopic6b81.html?t=2930
//
// Event.attach is for events and OO Programing.
//
//
 
 
/***
<member name="$a" type="global static method">
   <summary>Loops through each argument in the supplied argument object and puts it into an array.</summary>
   <param name="a">Argument object to loop through.</param>
   <returns>Array</returns>
</member>
***/
function $a(a) {
   var r = new Array();
   for (var i = 0, l = a.length; i < l; i++) {
      r.push(a[i]);
   }
   return r;
}
 
// Creates an object called "Event" if one doesn't already exist (IE).
if (!Event) {
   var Event = {};
}
 
/***
<member name="Event.attach" type="static method">
   <summary>Attach an event listener to an object.</summary>
   <param name="o">Object whose event to attach.</param>
   <param name="t">Type of event.</param>
   <param name="f">Method to fire when event is raised.</param>
   <param name="fc">Context of called method f. Defaults to object o.</param>
   <param name="c">Use capture (not available in IE).</param>
   <param name="*">Arguments to pass to function f.</param>
</member>
***/
Event.attach = function (o, t, f, fc, c) {
   var a = (arguments.length > 5 ? $a(arguments).slice(5, arguments.length) : new Array());
   var fn = function(e) {
      a.unshift(e || window.event);
      return f.apply((fc ? fc : o), a);
   }
   if (o.addEventListener) {
        if (navigator.appName.indexOf("Netscape") == -1){
                if(t=="DOMMouseScroll"){
                        t="mousewheel";
                }
        }
        if (navigator.userAgent.indexOf("Safari")!=-1 ){
                if(t=="DOMMouseScroll"){
                        o.onmousewheel=fn;
                }else{
                        o.addEventListener(t, fn, c);
                }
        }else{
                o.addEventListener(t, fn, c);
        }
   } else {
        if(t=="DOMMouseScroll"){
                o.attachEvent("onmousewheel",fn);
        }else{
              o.attachEvent("on" + t, fn);
        }
   }

};


