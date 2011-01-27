//
//  khtml javascript library
//  verion 0.54
//  LGPL Bernhard Zwischenbrugger
//  http://www.khtml.org/iphonemap/help.php
//


var khtml=new Object();
khtml.maplib=new Object();


khtml.maplib.getVersion=function(){
                return "khtmlib v0.01";
}


khtml.maplib.Point=function(lat,lng){
                this.latitude=parseFloat(lat);
                this.longitude=parseFloat(lng);
                this.lat=function(lat){
                        if(lat){
                                this.latitude=lat;
                        }
                        return this.latitude;
                }
                this.lng=function(lng){
                        if(lng){
                                this.longitude=lng;
                        }
                        return this.longitude;
                }

}


//
// An area defined by 2 Points
//

khtml.maplib.Bounds=function(southwest, northeast) {
    this.southwest = southwest;
    this.northeast = northeast;
    this.center = new khtml.maplib.Point((southwest.lat() + northeast.lat()) / 2, (southwest.lng() + northeast.lng()) / 2);
    this.sw = function () {
        return this.southwest;
    }
    this.ne = function () {
        return this.northeast;
    }
    this.getCenter = function () {
        return this.center;
    }

    this.getOpticalCenter = function (themap) {
        var swXY = themap.latlngToXY(this.southwest);
        var neXY = themap.latlngToXY(this.northeast);
        var centerX = Math.abs(swXY["x"] + neXY["x"]) / 2;
        var centerY = Math.abs(swXY["y"] + neXY["y"]) / 2;
        var centerLatLng = themap.XYTolatlng(centerX, centerY);
        return centerLatLng;
    }
    this.getZoomLevel = function (themap) {
        origZoom = themap.getZoom();
        var swXY = themap.latlngToXY(this.southwest);
        var neXY = themap.latlngToXY(this.northeast);
        var dx = Math.abs(swXY["x"] - neXY["x"]);
        var dy = Math.abs(swXY["y"] - neXY["y"]);
        var zoomX = themap.width / dx;
        var zoomY = themap.height / dy;
        if (zoomX > zoomY) var zoom = zoomY;
        if (zoomX <= zoomY) var zoom = zoomX;

        var dzoom = (Math.log(zoom)) / (Math.log(2));
        var newzoom = origZoom + dzoom;
        return (newzoom);
    }

    this.getDistance = function () {
        return distance(this.southwest.lat(), this.southwest.lng(), this.northeast.lat(), this.northeast.lng());
    }

    this.getDistanceText = function () {
        var d = parseFloat(distance(this.southwest.lat(), this.southwest.lng(), this.northeast.lat(), this.northeast.lng()));

        if (d < 1000) {
            return Math.round(d) + "m";
        }

        if (d < 10000) {
            var km = Math.round(d / 10) / 100;
            return km + "km";
        }
        if (d < 100000) {
            var km = Math.round(d / 100) / 10;
            return km + "km";
        }
        var km = Math.round(d / 1000);
        return km + "km";
    }

    this.getInnerRadius = function () {
        var w = distance(this.center.lat(), this.southwest.lng(), this.center.lat(), this.northeast.lng());
        var h = distance(this.southwest.lat(), this.center.lng(), this.northeast.lat(), this.center.lng());
        if (w > h) {
            return h / 2;
        } else {
            return w / 2;
        }
    }

    function distance(latdeg1, lngdeg1, latdeg2, lngdeg2) {
        //Umrechnung von Grad auf Radian
        var lat1 = latdeg1 * Math.PI / 180;
        var lng1 = lngdeg1 * Math.PI / 180;
        var lat2 = latdeg2 * Math.PI / 180;
        var lng2 = lngdeg2 * Math.PI / 180;

        //Eigentliche Berechnung
        var w = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)) * 180 / Math.PI;
        var d = w / 360 * 40000 * 1000;

        return d; //in meter
    }
}

//
//
//   THIS IS THE MAIN CLASS
//
//

khtml.maplib.Map=function(map) {

    //
    // Overlays handling
    //

    this.addOverlay = function (obj) {
        this.overlays.push(obj);
        if (typeof(obj.init) == "function") {
            obj.init(this);
        }
        this.renderOverlay(obj);
    }
    this.renderOverlay = function (obj) {
	obj.render();
    }
    this.renderOverlays = function () {
        this.overlayDiv.style.display = "";
	//this.overlayClone=this.overlayDiv.cloneNode(true);
	//this.clone.appendChild(this.overlayClone);
	
        var that = this;
	var i=0;
        for (obj in this.overlays) {
		if(i==0){
			try{
			//this.overlays[obj].clear(that);
			}catch(e){};
			i++;
		}
		
		this.overlays[obj].render();
	
        }
    }
    this.hideOverlays = function () {
       for (obj in this.overlays) {
		try{
		this.overlays[obj].clear(that);
		}catch(e){};
        }
    }

    this.removeOverlays = function () {
        while (this.overlays.length > 0) {
            var overlay = this.overlays.pop();
            overlay.clear();
        }
    }

    this.stopRenderOverlays = function () {
       for (obj in this.overlays) {
		if(typeof(this.overlays[obj].cancel)=="function"){
		    this.overlays[obj].cancel();
		}
        }
    }

    this.removeOverlay = function (ov) {
        for (var i = 0; i < this.overlays.length; i++) {
            var overlay = this.overlays[i];
            if (ov == overlay) {
                ov.clear();
		this.overlays.splice(i ,1);
		break;
            }
        }
    }


    //
    // every change (lat,lng,zoom) will call a user defined function
    //

    this.callbackFunctions = new Array();
    this.addCallbackFunction = function (func) {
        if (typeof(func) == "function") {
            this.callbackFunctions.push(func);
        }
    }
    this.executeCallbackFunctions = function () {
        for (var i = 0; i < this.callbackFunctions.length; i++) {
            this.callbackFunctions[i].call();
        }
    }


    /*==================================================
    //
    //    Touchscreen and Mouse EVENTS
    //
    ===================================================*/

    //
    //  Touchscreen
    //  Here also the multitouch zoom is done
    //  Bugs: if map is not fullscreen it will not work as it should. (see pageX, pageY)

    this.oldMoveX=0;
    this.oldMoveY=0;

    this.start = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault(); // The W3C DOM way
        } else {
            evt.returnValue = false; // The IE way
        }
        this.moveAnimationBlocked = true;
        //this.hideOverlays();
        if (evt.touches.length == 1) {
            this.startMoveX = this.moveX - evt.touches[0].pageX / this.faktor / this.sc;
            this.startMoveY = this.moveY - evt.touches[0].pageY / this.faktor / this.sc;
            if (this.mousedownTime != null) {
                var now = (new Date()).getTime();
                if (now - this.mousedownTime < this.doubleclickTime) {
                    var zoomD = Math.ceil(0.01 + this.getZoom() - this.intZoom);
                    this.autoZoomIn(evt.touches[0].pageX, evt.touches[0].pageY, zoomD);
                }
            }
            this.mousedownTime = (new Date()).getTime();
            var that = this;
            clearTimeout(this.zoomOutInterval);
            var tempFunction = function () {
                that.autoZoomOut()
            };
            this.zoomOutInterval = window.setInterval(tempFunction, 20);
        }

        if (evt.touches.length == 2) {
            window.clearInterval(this.zoomOutInterval);
            this.moveok = false;
            var X1 = evt.touches[0].pageX;
            var Y1 = evt.touches[0].pageY;
            var X2 = evt.touches[1].pageX;
            var Y2 = evt.touches[1].pageY;
            this.startDistance = Math.sqrt(Math.pow((X2 - X1), 2) + Math.pow((Y2 - Y1), 2));
            this.startZZ = this.position.zoom;
            var x = (X1 + X2) / 2 / this.faktor / this.sc;
            var y = (Y1 + Y2) / 2 / this.faktor / this.sc;
            this.startMoveX = this.moveX - x;
            this.startMoveY = this.moveY - y;
        }
	this.oldMoveX=this.moveX;
	this.oldMoveY=this.moveY;
    }

	this.moveok=true;
    this.move = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault(); // The W3C DOM way
        } else {
            evt.returnValue = false; // The IE way
        }

        //	this.mousedownTime=null;
        if (evt.touches.length == 1) {
            if (this.moveok) {
                this.lastMoveX = this.moveX;
                this.lastMoveY = this.moveY;
                this.moveX = evt.touches[0].pageX / this.faktor / this.sc + this.startMoveX;
                this.moveY = evt.touches[0].pageY / this.faktor / this.sc + this.startMoveY;
                if (!this.zoomOutStarted) {
                    if ((Math.abs(this.moveX - this.oldMoveX)  > 5) || (Math.abs(this.moveY - this.oldMoveY) > 5)) {
			//alert(this.moveX+":"+this.moveY);
                        window.clearInterval(this.zoomOutInterval);
                        this.zoomOutSpeed = 0.01;
                        this.mousedownTime = null;
                    }
                    var center = new khtml.maplib.Point(this.lat, this.lng);
                    this.setCenter2(center, this.position.zoom);
                    this.moveAnimationBlocked = false;
                }
                if ((Math.abs(this.moveX - this.oldMoveX) > 5) || (Math.abs(this.moveY - this.oldMoveY) >5)) {
		//	alert(this.moveX+":"+this.moveX);
			//alert(99);
                    this.mousedownTime = null; //prevents doubleclick if map is moved already
                }
            } else {
                //alert("no move");
            }
        }

        if (evt.touches.length == 2) {
            this.mousedownTime = null;
            var X1 = evt.touches[0].pageX;
            var Y1 = evt.touches[0].pageY;
            var X2 = evt.touches[1].pageX;
            var Y2 = evt.touches[1].pageY;
            var Distance = Math.sqrt(Math.pow((X2 - X1), 2) + Math.pow((Y2 - Y1), 2));
            var zoomDelta = (Distance / this.startDistance);
            var zz = this.startZZ + zoomDelta - 1;
            if (zz < 1) {
                zz = 1;
            }
            if (zz > this.tileSource.maxzoom) {
                zz = this.tileSource.maxzoom;
                zoomDelta = 1;
            }
            var x = (X1 + X2) / 2;
            var y = (Y1 + Y2) / 2;

            faktor = Math.pow(2, zz);
            var zoomCenterDeltaX = x / faktor - this.width / 2;
            var zoomCenterDeltaY = y / faktor - this.height / 2;
            var f = Math.pow(2, zoomDelta - 1);
            var dx = zoomCenterDeltaX - zoomCenterDeltaX * f;
            var dy = zoomCenterDeltaY - zoomCenterDeltaY * f;

            this.moveX = (x + dx) / faktor + this.startMoveX;
            this.moveY = (y + dy) / faktor + this.startMoveY;

            var center = new khtml.maplib.Point(this.lat, this.lng);
            this.setCenter2(center, zz);
        }
    }

    this.end = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault(); // The W3C DOM way
        } else {
            evt.returnValue = false; // The IE way
        }
        window.clearInterval(this.zoomOutInterval);
        this.zoomOutStarted = false;
	this.zoomOutSpeed = 0.01;

        if (evt.touches.length == 0) {
            this.moveok = true;
            if (this.moveAnimationMobile) {
                if (this.moveAnimationBlocked == false) {
                    var speedX = this.lastMoveX - this.moveX;
                    var speedY = this.lastMoveY - this.moveY;
                    clearTimeout(this.animateMoveTimeout);
                    this.animateMove(speedX, speedY);
                }
            }
        }
        
    }

    //
    //  mouse events
    //  (distance measure code not in use anymore)
    //

    //ie sucks
    this.pageX = function (evt) {
        try {
            if (evt.pageX === undefined) {
                var px = evt.clientX + document.body.scrollLeft;
            } else {
                var px = evt.pageX;
            }
            return px - this.mapLeft;
        } catch (e) {
            return this.lastMouseX;
            //return this.width/2 + this.mapLeft;
        }
    }
    this.pageY = function (evt) {
        try {
            if (evt.pageY === undefined) {
                var py = evt.clientY + document.body.scrollTop;
            } else {
                var py = evt.pageY;
            }
            return py - this.mapTop;
        } catch (e) {
            return this.lastMouseY;
            //return this.height/2  +this.mapTop;
        }
    }

    this.doubleclickBlocked=false;
    this.doubleclick = function (evt) {
	this.discretZoom(1,this.pageX(evt), this.pageY(evt));
	return;

        var that=this;
        if(this.doubleclickBlocked){
                return;
        }
        that.doubleclickBlocked = true;
        var func = function () {
                that.doubleclickBlocked = false;
        };
	setTimeout(func,500);

        var zoom = this.getZoom();
        var zoomD = Math.ceil(0.0001 + this.getZoom()) - zoom;
        this.autoZoomIn(this.pageX(evt), this.pageY(evt), zoomD);
    }

    this.mousedown = function (evt) {
        this.mapParent.focus();
        if (evt.preventDefault) {
            evt.preventDefault(); // The W3C DOM way
        } else {
            window.event.returnValue = false; // The IE way
        }

        this.lastMouseX = this.pageX(evt);
        this.lastMouseY = this.pageY(evt);
        this.moveAnimationBlocked = true;
        if (this.mousedownTime2 != null) {
            var now = (new Date()).getTime();
            if (now - this.mousedownTime2 < this.doubleclickTime2) {
                this.doubleclick(evt);
            }
        }
        this.mousedownTime2 = (new Date()).getTime();



        if (evt.shiftKey) {
            this.selectRectLeft = this.pageX(evt);
            this.selectRectTop = this.pageY(evt);

            //		this.distanceStartpoint=this.XYTolatlng( this.pageX(evt), this.pageY(evt));
            this.selectRect = document.createElement("div");
            this.selectRect.style.left = this.selectRectLeft + "px";
            this.selectRect.style.top = this.selectRectTop + "px";
            this.selectRect.style.border = "1px solid gray";
            if (!this.internetExplorer) {
                this.selectRect.style.opacity = 0.5;
                this.selectRect.style.backgroundColor = "white";
            }
            this.selectRect.style.position = "absolute";
            this.map.parentNode.appendChild(this.selectRect);
        } else {
            //this.hideOverlays();
            this.startMoveX = this.moveX - (this.pageX(evt)) / this.faktor / this.sc;
            this.startMoveY = this.moveY - (this.pageY(evt)) / this.faktor / this.sc;
            this.movestarted = true;
        }
        return false;
    }

    this.mousemove = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault(); // The W3C DOM way
        } else {
            window.event.returnValue = false; // The IE way
        }
        //this.mousedownTime2=0; //if it's moved it's not a doubleclick
        this.lastMouseX = this.pageX(evt);
        this.lastMouseY = this.pageY(evt);
        
        if (evt.shiftKey) {
            if (this.selectRect) {
                this.selectRect.style.width = Math.abs(this.pageX(evt) - this.selectRectLeft) + "px";
                this.selectRect.style.height = Math.abs(this.pageY(evt) - this.selectRectTop) + "px";
                if (this.pageX(evt) < this.selectRectLeft) {
                    this.selectRect.style.left = this.pageX(evt);
                }
                if (this.pageY(evt) < this.selectRectTop) {
                    this.selectRect.style.top = this.pageY(evt);
                }
            }
        } else {
            if (this.movestarted) {
                this.lastMoveX = this.moveX;
                this.lastMoveY = this.moveY;
                this.lastMoveTime = new Date();
                this.moveX = (this.pageX(evt)) / this.faktor / this.sc + this.startMoveX;
                this.moveY = (this.pageY(evt)) / this.faktor / this.sc + this.startMoveY;

                var center = new khtml.maplib.Point(this.lat, this.lng);
                //alert(evt.pageX);
                this.setCenter2(center, this.position.zoom);
                this.moveAnimationBlocked = false;
            }
        }
        return false;
    }
    this.mouseup = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault(); // The W3C DOM way
        } else {
            evt.returnValue = false; // The IE way
        }
        this.lastMouseX = this.pageX(evt);
        this.lastMouseY = this.pageY(evt);
        if (this.moveMarker) {
            this.moveMarker = null;
        }
        if (this.selectRect) {
            //this.normalize();
            var p1 = this.XYTolatlng(this.selectRect.offsetLeft,  this.selectRect.offsetTop + this.selectRect.offsetHeight);
            var p2 = this.XYTolatlng(this.selectRect.offsetLeft + this.selectRect.offsetWidth,  this.selectRect.offsetTop );

            var bounds = new khtml.maplib.Bounds(p1, p2);
            this.setBounds(bounds);
            this.selectRect.parentNode.removeChild(this.selectRect);
            this.selectRect = null;
        }

        //using this normalize some things are working better, others not so goot. 
        //delelte it will solve some problems but bring other problems
        //this.normalize();
	    var now=new Date();	
	    var timeDelta=now - this.lastMoveTime;						
        if (this.wheelSpeedConfig["moveAnimateDesktop"] &&timeDelta !=0) {
            if (this.movestarted) {
                if (this.moveAnimationBlocked == false) {
                    var speedX = (this.lastMoveX - this.moveX) / timeDelta ;
                    var speedY = (this.lastMoveY - this.moveY) / timeDelta ;
			var maxSpeed=5;
			if(speedX >maxSpeed)speedX=maxSpeed;
			if(speedY >maxSpeed)speedY=maxSpeed;
			if(speedX < -maxSpeed)speedX=-maxSpeed;
			if(speedY < -maxSpeed)speedY=-maxSpeed;
			
			if(Math.abs(speedX) > this.wheelSpeedConfig["animateMinSpeed"] || Math.abs(speedY) > this.wheelSpeedConfig["animateMinSpeed"]){
			    this.animateMove(speedX, speedY);
			}else{
			    //this.renderOverlays();
			}
                }
            }
        } else {
            //this.renderOverlays();
        }
	var that=this;
	var tempFunction=function(){
		that.movestarted = false;
	}
	setTimeout(tempFunction,1);	
    }

    //
    // Mouse wheel
    //

    this.startZoomTime=null;
    this.mousewheel=function(evt){
	if (evt.preventDefault) {
            evt.preventDefault(); // The W3C DOM way
        } else {
            evt.returnValue = false; // The IE way
        }
        this.mapParent.focus();

	if(!evt){
		evt = window.event;
	}
        if (evt.wheelDelta) { /* IE/Opera/Chrom. */
            delta = evt.wheelDelta / 60;
            if (window.opera) {
                delta = delta ;
            }
        } else if (evt.detail) { /** Mozilla case. */
            delta = -evt.detail / 3;
                if(this.lastWheelDelta * delta <0){
                //      console.log(this.lastWheelDelta * delta);
                        if(!this.wheelSpeedConfig["digizoom"]){
                                delta=0;
                        }
                }
                this.lastWheelDelta=-evt.detail/3;
        }
	if(delta <0){
		var direction=-1;
	}else{
		var direction=1;
		
	}
	if(this.wheelSpeedConfig["digizoom"]){
		this.discretZoom(direction,this.pageX(evt), this.pageY(evt));
		return;
	}
	if(!this.startZoomTime){
		this.startZoomTime=(new Date());
		this.startZoomTime2=(new Date());
		this.oldZoom=this.zoom();
		this.speed=1;
	}
	var delta=(new Date()) - this.startZoomTime;
	var delta2=(new Date()) - this.startZoomTime2;

	var that=this;
	var tempFunc=function(){
		that.startZoomTime=new Date();
	}
	this.startZoomTime=new Date();
	if(delta > 300){
		//console.log("reset");
		this.startZoomTime2=new Date();
		this.oldZoom=this.zoom();
		this.speed=1;
		delta2=0.1;
	}
	this.speed=this.speed*2;
	//setTimeout(tempFunc,0);
	if(this.speed > 5) this.speed=5;
	
	//var w=document.getElementById("map").getElementsByTagName("img").item(0).offsetWidth;
	//console.log(delta,delta2);
	var zoom=this.oldZoom + delta2/3000*this.speed *direction;	
	if(zoom > this.position.maxZoom) zoom=this.position.maxZoom;
	if(zoom < this.position.minZoom) zoom=this.position.minZoom;
	//console.log("zoom: "+zoom);
	
	this.centerAndZoomXY(this.center(),zoom,this.pageX(evt), this.pageY(evt));	

    }

    this.zoomTimeouts=new Array();
    this.discretZoomBlocked=false;	
    this.discretZoom=function(direction,x,y){
        var that=this;
        if(this.discretZoomBlocked){
                return;
        }

        var func = function () {
                that.discretZoomBlocked = false;
        };
        this.discretZoomBlockedTimeout=setTimeout(func,200);
        this.discretZoomBlocked = true;

	var steps=20;
	for(var i=1;i<=steps;i++){
		if(this.zoomTimeouts[i]){
			clearTimeout(this.zoomTimeouts[i]);
		}
	}
        var start=this.zoom();
	if(direction==1){
		var end=Math.ceil(this.zoom() +0.9);
	}else{
		var end=Math.floor(this.zoom() -0.9);
	}
	var delta=Math.abs(start - end);
	//console.log(start, end, delta);
	var lastDZ=0;
	for(var i=1;i<=steps;i++){
		var rad=i/steps*Math.PI/2;
		var dz=direction*(Math.sin(rad))*delta ;
		var ddz=dz - lastDZ;
		//console.log(i,dz,ddz,rad,direction);
		this.zoomTimeouts[i]=this.discretZoomExec(x,y,ddz,i,steps );
		lastDZ=dz;
	}
    }	
    this.discretZoomExec=function(x,y,dz,i,steps){
		var that=this;
		var tempFunc=function(){
			var zoom=that.zoom() + dz;
			if(i==steps){
				zoom=Math.round(zoom);
			}
			//console.log(zoom);
			that.centerAndZoomXY(that.center(),zoom,x,y);

		}
		return setTimeout(tempFunc,i*20);
    }


/*
    this.zoomAccelerate = 0;
	this.lastWheelDelta=0; //workaround for spontan wheel dircetion change (mac firefox, safari windows)
    this.mousewheel = function (evt) {
        if (evt.preventDefault) {
            evt.preventDefault(); // The W3C DOM way
        } else {
            evt.returnValue = false; // The IE way
        }
        this.mapParent.focus();

        this.wheelEventCounter++;
        var that = this;
        var tempFunction = function () {
            that.wheelEventCounter--
        };
        window.setTimeout(tempFunction, 1000);

        delta = null;
        if (!evt) // For IE. 
        evt = window.event;
        if (evt.wheelDelta) { // IE/Opera/Chrom. 
            delta = evt.wheelDelta / 60;
            if (window.opera) {
                delta = delta ;
            }
        } else if (evt.detail) { // Mozilla case. 
            delta = -evt.detail / 3;
		if(this.lastWheelDelta * delta <0){
		//	console.log(this.lastWheelDelta * delta);
			if(!this.wheelSpeedConfig["digizoom"]){
				delta=0;
			}
		}
		this.lastWheelDelta=-evt.detail/3;
        }
        if (navigator.userAgent.indexOf("Chrome") != -1) {
            if (navigator.userAgent.indexOf("Linux") != -1) {
                delta = evt.wheelDelta / 120;
            }
        }
//	document.getElementById("debug").textContent=delta;
//	console.log(evt.detail);

	if(this.wheelSpeedConfig["digizoom"]){
		this.digizoom(this.pageX(evt), this.pageY(evt), delta);
		return;
	}

        var dzoom = delta * this.wheelSpeedConfig["acceleration"] * 0.03;

        if (dzoom > 0 && this.zoomAccelerate < 0) this.zoomAccelerate = 0;
        if (dzoom < 0 && this.zoomAccelerate > 0) this.zoomAccelerate = 0;

        if (!isNaN(dzoom)) {
            this.zoomAccelerate = this.zoomAccelerate + dzoom;
        } else {
            alert("hopala");
            this.zoomAccelerate = 0;
        }

        var that = this;

        var tempFunction = function () {
            that.zooming(that.pageX(evt), that.pageY(evt))
        };
        if (this.wheelZoomTimeout) {
            window.clearTimeout(this.wheelZoomTimeout);
        }
        window.setTimeout(tempFunction, 20);
    }
*/

    this.digizoomblocked=false;
    this.digizoomblockedTimeout=null;
    this.digizoom=function(mousex,mousey,delta){
	if(this.digizoomblockedTimeout){
		clearTimeout(this.digizoomblockedTimeout);
	}
	var that=this;	
	if(this.digizoomblocked){
		return;
	}
	
        var func = function () {
                that.digizoomblocked = false;
        };
	this.digizoomblockedTimeout=setTimeout(func,2000);
	this.digizoomblocked = true;

	if(delta >0){
		var zoomD = Math.ceil(0.01+ this.getZoom() - this.getIntZoom());
	}else{
		var zoomD = Math.ceil( this.getZoom() - this.getIntZoom())-0.98;
	}
	this.autoZoomIn(mousex, mousey, zoomD);

    }

    this.wheelZoomTimeout = null;
    this.zooming = function (pageX, pageY) {
        var ttt = this.zoomAccelerate;

        if (this.wheelZoomTimeout) {
            clearTimeout(this.wheelZoomTimeout);
        }
        if (Math.abs(this.zoomAccelerate) > this.wheelSpeedConfig["zoomAnimationSlowdown"] * 2) {
            if (this.wheelSpeedConfig["animate"]) {
                var that = this;
                var tempFunction = function () {
                    that.zooming(pageX, pageY)
                };
                var time = 1 / this.wheelSpeedConfig["animationFPS"] * 1000;
                this.wheelZoomTimeout = window.setTimeout(tempFunction, time);
            } else {
                //alert("gut");
            }
        }

        if (this.zoomAccelerate > this.wheelSpeedConfig["maxSpeed"] / 10) this.zoomAccelerate = this.wheelSpeedConfig["maxSpeed"] / 10;
        if (this.zoomAccelerate < -this.wheelSpeedConfig["maxSpeed"] / 10) this.zoomAccelerate = -this.wheelSpeedConfig["maxSpeed"] / 10;
        var oldzoom = this.position.zoom;
        this.position.zoom = this.position.zoom + this.zoomAccelerate *8 /(4 +this.getZoom()); // * this.wheelSpeedConfig["speed"]; 
        if (this.position.zoom <= this.tileSource.minzoom) {
            this.position.zoom = this.tileSource.minzoom;
        }
        if (this.position.zoom >= this.tileSource.maxzoom) {
            this.position.zoom = this.tileSource.maxzoom;
        }

        faktor = Math.pow(2, this.position.zoom);
        var zoomCenterDeltaX = (pageX) - this.width / 2;
        var zoomCenterDeltaY = (pageY) - this.height / 2;

        var dzoom = this.position.zoom - oldzoom;
        var f = Math.pow(2, dzoom);

        var dx = zoomCenterDeltaX - zoomCenterDeltaX * f;
        var dy = zoomCenterDeltaY - zoomCenterDeltaY * f;

        this.moveX = this.moveX + dx / faktor;
        this.moveY = this.moveY + dy / faktor;

        if (this.zoomAccelerate > 0) {
            this.zoomAccelerate = this.zoomAccelerate - this.wheelSpeedConfig["zoomAnimationSlowdown"];
        }
        if (this.zoomAccelerate < 0) {
            this.zoomAccelerate = this.zoomAccelerate + this.wheelSpeedConfig["zoomAnimationSlowdown"];
        }

        this.setCenter2(this.position.center, this.position.zoom);
        //this.renderOverlays();

        if (Math.abs(this.zoomAccelerate) < this.wheelSpeedConfig["zoomAnimationSlowdown"] * 2) {
            this.zoomAccelerate = 0;
        }
    }

    //
    //  Map continues moving after mouse up
    //

    this.animateMove = function (speedX, speedY) {
        clearTimeout(this.animateMoveTimeout);
        if (Math.abs(speedX) <= 0.00001 && Math.abs(speedY) <= 0.00001) {
            //this.renderOverlays();
            return;
        }
        this.moveX = -speedX + this.moveX;
        this.moveY = -speedY + this.moveY;

        var that = this;
        var tempFunction = function () {
            that.animateMove(speedX * that.wheelSpeedConfig["moveAnimationSlowdown"], speedY * that.wheelSpeedConfig["moveAnimationSlowdown"]);
        }
        this.animateMoveTimeout = window.setTimeout(tempFunction, 20);
        this.setCenter2(this.position.center, this.position.zoom);
    }

    //
    //  zoom  animation
    //

    this.autoZoomInTimeout = null;
    this.autoZoomStartTime = null;
    this.autoZoomIn = function (x, y, z) {
        //console.log(x,y,z);
        if (this.autoZoomInTimeout) {
            window.clearTimeout(this.autoZoomInTimeout);
        }
        var stepwidth = 0.20;
	
        if (z < 0) {
		stepwidth = -stepwidth
        }
        zoomGap = false;
        if (Math.abs(z) <= Math.abs(stepwidth)) {
            zoomGap = true;
        }
        //this.hideOverlays();
        var dzoom = stepwidth;
        var zoom = this.position.zoom + dzoom;
        zoom = Math.round(zoom * 1000) / 1000;
        if (zoomGap) {
		//console.log("---: "+z+":"+zoom);
			if(z<0){
			    zoom = Math.floor(zoom);
			}else{
			    zoom = Math.ceil(zoom -0.2);
			}
		
		//console.log("---"+zoom);
            //dzoom = z;
            dzoom = zoom - this.position.zoom ;
            //console.log("gap: "+dzoom+" : "+zoom);
        }

        faktor = Math.pow(2, zoom);
        var zoomCenterDeltaX = x - this.width / 2;
        var zoomCenterDeltaY = y - this.height / 2;
        var f = Math.pow(2, dzoom);

        var dx = zoomCenterDeltaX - zoomCenterDeltaX * f;
        var dy = zoomCenterDeltaY - zoomCenterDeltaY * f;

        var that = this;

	var now=new Date().getMilliseconds();
	if(this.autoZoomStartTime){
		var timeDelta=now - this.autoZoomStartTime;
	}else{
		var timeDelta=0;
	}
	//console.log(timeDelta);
	this.autoZoomStartTime=now;	

	if(timeDelta <100 || zoomGap){
	if(zoom >=this.tileSource.minzoom && zoom <= this.tileSource.maxzoom){
		this.moveX = this.moveX + dx / faktor;
		this.moveY = this.moveY + dy / faktor;
	}


        var center = new khtml.maplib.Point(this.lat, this.lng);
        if (zoom > this.tileSource.maxzoom){
		 zoom = this.tileSource.maxzoom;
	}
        if (zoom < this.tileSource.minzoom){
		 zoom = this.tileSource.minzoom;
	}
	var tempFunction=function(){
		that.setCenter2(center, zoom);
	}
        setTimeout(tempFunction, 1);
	}else{
		//console.log("dropped2");
	}
        var newz = z - dzoom;
        if (!zoomGap) {
            var tempFunction = function () {
                that.autoZoomIn(x, y, newz)
            };
            this.autoZoomInTimeout = window.setTimeout(tempFunction, 40);
        }else{ 
		this.digizoomblocked=false;
	}

    }
   
    //
    // same as centerAndZoom but zoom center is not map center
    //

    this.centerAndZoomXY=function(center,zoom,x,y){

        faktor = Math.pow(2, zoom);
        var zoomCenterDeltaX = x - this.mapsize.width / 2;
        var zoomCenterDeltaY = y - this.mapsize.height / 2;
	var dzoom=zoom - this.zoom() ;
        var f = Math.pow(2, dzoom);

        var dx = zoomCenterDeltaX - zoomCenterDeltaX * f;
        var dy = zoomCenterDeltaY - zoomCenterDeltaY * f;

        if(zoom >=this.tileSource.minzoom && zoom <= this.tileSource.maxzoom){
                this.moveX = this.moveX + dx / faktor;
                this.moveY = this.moveY + dy / faktor;
        }


        var center = new khtml.maplib.Point(this.lat, this.lng);
        if (zoom > this.tileSource.maxzoom){
                 zoom = this.tileSource.maxzoom;
        }
        if (zoom < this.tileSource.minzoom){
                 zoom = this.tileSource.minzoom;
        }
	this.setCenter2(center,zoom);
    }	


    //
    //  Set the map coordinates and zoom
    //

    this.centerAndZoom = function (center, zoom) {
        this.moveX = 0;
        this.moveY = 0;
        if (zoom > this.tileSource.maxzoom) {
            zoom = this.tileSource.maxzoom;
        }
        if (zoom < this.tileSource.minzoom) {
            zoom = this.tileSource.minzoom;
        }

        this.record();
        this.setCenterNoLog(center, zoom);
    }
    this.setCenter3 = function (center, zoom) {
        this.moveX = 0;
        this.moveY = 0;
        this.setCenterNoLog(center, zoom);
    }

    // same as setCenter but moveX,moveY are not reset (for internal use)
    this.setCenter2 = function (center, zoom) {
        this.record();
        this.setCenterNoLog(center, zoom);
    }


    //
    // same as setCenter but no history item is generated (for undo, redo)
    //

    this.setCenterNoLog = function (center, zoom) {
        this.position.center = center;
        this.lat = center.lat();
        this.lng = center.lng();

        var zoom = parseFloat(zoom);
        if (zoom > this.tileSource.maxzoom) {
            zoom = this.tileSource.maxzoom;
        }
        if (zoom < this.tileSource.minzoom) {
            zoom = this.tileSource.minzoom;
        }

        this.position.center = center;
        this.position.zoom = zoom;

        this.layer(this.map, this.lat, this.lng, this.moveX, this.moveY, zoom);
        this.executeCallbackFunctions();
    }



    //
    //  read the map center (no zoom value)
    //
    this.center=function(center){
	if(center){
		//this.position.center=center;
		this.centerAndZoom(center,this.getZoom());
	}
        if (this.moveX != 0 || this.moveY != 0) {
            var center = new khtml.maplib.Point(this.movedLat, this.movedLng);
		return center;
        }
	return this.position.center;
    }

    this.zoom=function(zoom){
	if(zoom){
		this.centerAndZoom(this.position.center,zoom);
	}
	return this.position.zoom;
    }

    this.moveXY=function(x,y){
	this.moveX=parseFloat(x)/ this.faktor / this.sc;
	this.moveY=parseFloat(y)/ this.faktor / this.sc;
	this.setCenter2(this.center(),this.zoom());
    }	

    this.tiles=function(tileSource){
	this.clearMap();
	this.tileSource=tileSource;
    }
    this.tileOverlays=new Array();		
    this.addTilesOverlay=function(t){
	this.tileOverlays.push(t);
	var ov=this.tileOverlays[this.tileOverlays.length -1];
	this.clearMap();
	return ov;
    }	

    this.removeTilesOverlay = function (ov) {
	//alert(this.tileOverlays.length);
        for (var i = 0; i < this.tileOverlays.length; i++) {
            var overlay = this.tileOverlays[i];
            if (ov == overlay) {
                //ov.clear();
                this.tileOverlays.splice(i ,1);
                break;
            }
        }
	this.clearMap();
    }

   
    this.getCenter = function () {
        if (this.moveX != 0 || this.moveY != 0) {
            var center = new khtml.maplib.Point(this.movedLat, this.movedLng);
        } else {
            if (!this.position.center) {
            } else {
                var center = this.position.center;
            }
        }
        return center;
    }


    //
    //  read bounds. The Coordinates at corners of the map div  sw, ne would be better (change it!)
    //

	this.bounds=function(b){
		if(b){
			this.setBounds(b);
		}else{
			return this.getBounds();
		}
	}

    this.getBounds = function () {
        var sw = this.XYTolatlng(0, this.height);
        var ne = this.XYTolatlng(this.width, 0);
        var bounds = new khtml.maplib.Bounds(sw, ne);
        //	alert(p1.lat()+":"+p1.lng()+":"+p2.lat()+":"+p2.lng());
        return bounds;
    }

    //
    //  like setCenter but with two gps points
    //
	

    this.setBounds = function (b) {
        //this.normalize();
        //the setbounds should be a mathematical formula and not guessing around.
        //if you know this formula pease add it here.
        //this.getSize();
        var p1 = b.sw();
        var p2 = b.ne();

        var minlat = p1.lat();
        var maxlat = p2.lat();
        var minlng = p1.lng();
        var maxlng = p2.lng();

        var minlat360 = lat2y(minlat);
        var maxlat360 = lat2y(maxlat);
        var centerLng = (minlng + maxlng) / 2;
        var centerLat360 = (minlat360 + maxlat360) / 2;
        var centerLat = y2lat(centerLat360);
        var center = new khtml.maplib.Point(centerLat, centerLng);
        var extendY = Math.abs(maxlat360 - minlat360);
        var extendX = Math.abs(maxlng - minlng);
        if (extendX / this.width > extendY / this.height) {
            var extend = extendX;
            var screensize = this.width;
        } else {
            var extend = extendY;
            var screensize = this.height;
        }
        //zoomlevel 1: 512 pixel
        //zoomlevel 2: 1024 pixel
        //...
        //extend = 360 > zoomlevel 1 , at 512px screen
        //extend = 360 > zoomlevel 2 , at 1024px screen
        //extend at zoomlevel1: extend/360 * 512px	
        var scalarZoom = 360 / extend;
        var screenfaktor = 512 / screensize;

        var zoom = (Math.log(scalarZoom / screenfaktor)) / (Math.log(2)) + 1;

        if (zoom > this.tileSource.maxzoom) {
            zoom = this.tileSource.maxzoom;
        }
        if (zoom < this.tileSource.minzoom) {
            zoom = this.tileSource.minzoom;
        }
        if (this.position.center) {
            if (this.wheelSpeedConfig["rectShiftAnimate"]) {
                this.animatedGoto(center, zoom, this.wheelSpeedConfig["rectShiftAnimationTime"]);
            } else {
                this.centerAndZoom(center, zoom );
            }
        } else {
            this.centerAndZoom(center, zoom);
        }
    }

    this.animatedGotoStep = null;
    this.animatedGotoTimeout=new Array();
    this.animatedGoto = function (newCenter, newZoom, time) {
        //this.hideOverlays();
        var zoomSteps = time / 10;
        var oldCenter = this.getCenter();
        var newLat = newCenter.lat();
        var newLng = newCenter.lng();
        var oldLat = oldCenter.lat();
        var oldLng = oldCenter.lng();
        var oldZoom = this.getZoom();
        var dLat = (newLat - oldLat) / zoomSteps;
        var dLng = (newLng - oldLng) / zoomSteps;
        var dZoom = (newZoom - oldZoom) / zoomSteps;
        var dMoveX = this.moveX / zoomSteps;
        var dMoveY = this.moveY / zoomSteps;
        var oldMoveX = this.moveX;
        var oldMoveY = this.moveY;
        this.animatedGotoStep = 0;
        var that = this;
	while(timeout= this.animatedGotoTimeout.pop()){
		clearTimeout(timeout);
	}
	
        for (var i = 0; i < zoomSteps; i++) {
            var lat = oldLat + dLat * i;
            var lng = oldLng + dLng * i;
            var zoom = oldZoom + dZoom * i;

            var tempFunction = function () {
                that.animatedGotoExec(oldLat, oldLng, oldZoom, dLat, dLng, dZoom, oldMoveX, oldMoveY, dMoveX, dMoveY)
            }
            this.animatedGotoTimeout[i]=window.setTimeout(tempFunction, 10 * i);
        }
/*
		var tempFunction=function(){ that.setCenter2(new khtml.maplib.Point(newLat,newLng),newZoom);that.renderOverlays()}
		window.setTimeout(tempFunction,time+200);
		*/

    }
    this.animatedGotoExec = function (oldLat, oldLng, oldZoom, dLat, dLng, dZoom, oldMoveX, oldMoveY, dMoveX, dMoveY) {
        this.moveX = -dMoveX;
        this.moveY = -dMoveY;
        var lat = oldLat + dLat * this.animatedGotoStep;
        var lng = oldLng + dLng * this.animatedGotoStep;
        var zoom = oldZoom + dZoom * this.animatedGotoStep;
        this.animatedGotoStep++;

        this.centerAndZoom(new khtml.maplib.Point(lat, lng), zoom);

    }

    this.getZoom = function () {
        return this.position.zoom;
    }
    this.getIntZoom = function () {
        return this.intZoom;
    }



    //
    // WGS84 to x,y at the div calculation
    //
    this.latlngToXY = function (point) {
        var lat = point.lat();
        var lng = point.lng();
        var intZoom = this.getIntZoom();
        tileTest = getTileNumber(lat, lng, intZoom);
        var worldCenter = this.getCenter();

        var tileCenter = getTileNumber(worldCenter.lat(), worldCenter.lng(), intZoom);
        var x = (tileCenter[0] - tileTest[0]) * this.tileW * this.sc - this.width / 2;
        var y = (tileCenter[1] - tileTest[1]) * this.tileW * this.sc - this.height / 2;

        var point = new Array();
        point["x"] = -x;
        point["y"] = -y;
        return (point);

    }


    //
    //  screen (map div) coordinates to lat,lng 
    //
    this.XYTolatlng = function (x, y) {
        var center = this.getCenter();
        if (!center) {
            return
        };
        var faktor = Math.pow(2, this.intZoom)
        var centerLat = center.lat();
        var centerLng = center.lng();

        var xypoint = getTileNumber(centerLat, centerLng, this.intZoom);
        var dx = x - this.width / 2;
        var dy = y -this.height / 2; //das style
        var lng = (xypoint[0] + dx / this.tileW / this.sc) / faktor * 360 - 180;
        var lat360 = (xypoint[1] + dy / this.tileH / this.sc) / faktor * 360 - 180;

        var lat = -y2lat(lat360) + 0;
        var p = new khtml.maplib.Point(lat, lng);
        return p;
    }


//mouse coordinates to lat, lng

	this.mouseToLatLng=function(evt){
		var x=this.pageX(evt);	
		var y=this.pageY(evt);	
		var p=this.XYTolatlng(x,y);
		return p;
	}

//---- the next too methodes are not in use anymore

    //
    //  for iPhone to make page fullscreen (maybe not working)
    //
    this.reSize = function () {
        var that = this;
        //setTimeout("window.scrollTo(0,1)",500);
        var tempFunction = function () {
            that.getSize(that)
        };
        window.setTimeout(tempFunction, 1050);

    }

    //
    // read the size of the DIV that will contain the map
    // this method is buggy - no good
    //

	//outdated
    this.getSize = function () {
        this.width = this.map.parentNode.offsetWidth;
        this.height = this.map.parentNode.offsetHeight;
        var obj = this.map
        var left = 0;
        var top = 0;
        do {
            left += obj.offsetLeft;
            top += obj.offsetTop;
            obj = obj.offsetParent;
        } while (obj.offsetParent);
/*
		this.map.style.left=this.width/2+"px";  //not very good programming style
		this.map.style.top=this.height/2+"px";  //not very good programming style
		*/
        this.mapTop = top;
        this.mapLeft = left;

    }


    //for undo,redo
    this.recordArray = new Array();
    this.record = function () {
        var center = this.getCenter();
        if (center) {
            var lat = center.lat();
            var lng = center.lng();
            var zoom = this.getZoom();
            var item = new Array(lat, lng, zoom);
            this.recordArray.push(item);
        }
    }
    this.play = function (i) {
        if (i < 1) return;
        if (i > (this.recordArray.length - 1)) return;
        var item = this.recordArray[i];
        var center = new khtml.maplib.Point(item[0], item[1]);
        //undo,redo must not generate history items
        this.moveX = 0;
        this.moveY = 0;
        this.setCenter3(center, item[2]);
    }



/*================== LAYERMANAGER (which layer is visible) =====================
Description: This method desides witch zoom layer is visible at the moment. 
It has the same parameters as the "draw" method, but no "intZoom".

This Layers are  NOT tile or vector overlays
========================================================================= */


    this.layerDrawLastFrame = null;
    this.doTheOverlayes=true;
    this.finalDraw=false;
    this.layerOldZoom=0;
    this.layer = function (map, lat, lng, moveX, moveY, zoom) {
			var delta=(new Date()) - this.startZoomTime;
	this.stopRenderOverlays();
	if(!zoom){
		var zoom=this.getZoom();
	}
        //if (!this.css3d) {
            if (this.layerDrawLastFrame) {
                window.clearTimeout(this.layerDrawLastFrame);
                this.layerDrawLastFrame = null;
            }
            if (this.blocked ||this.finalDraw==false) {

                //the last frames must be drawn to have good result
                var that = this;
                var tempFunction = function () {
			that.finalDraw=true;
                    that.layer(map, lat, lng, moveX, moveY, zoom);
                };
                this.layerDrawLastFrame = window.setTimeout(tempFunction, 100);

                if (this.blocked){
			var delta=(new Date()) - this.startZoomTime;
			return;
		}
            }
            this.blocked = true;
		
        //}

	//hide all zoomlayers
	//this.layers[this.visibleZoom]["layerDiv"].style.visibility;
	for(var i=0; i < 22;i++){
		if(this.layers[i]){
			this.layers[i]["layerDiv"].style.visibility="hidden";
		}
	}


	/*
	if(this.lastZoom!=this.getZoom()){
		if(this.finalDraw){
			var intZoom = Math.round(zoom );
			this.lastZoom=this.getZoom();
		}else{
			if(this.lastZoom > this.getZoom()){
				var intZoom = Math.round(zoom );
			}else{
				var intZoom = Math.round(zoom );
			}
		}
		if (intZoom > this.tileSource.maxzoom) {
		    intZoom = this.tileSource.maxzoom;
		}
		this.intZoom = intZoom;
	}else{
		intZoom=this.getIntZoom();
	}
	*/
	if(this.wheelSpeedConfig["digizoom"]){
		var intZoom = Math.floor(zoom );
	}else{
		var intZoom = Math.round(zoom );
	}
	if(this.layerOldZoom > zoom && !this.finalDraw){
		if (this.layers[intZoom] && !this.layers[intZoom]["loadComplete"]) {
			this.visibleZoom=intZoom+1;
			//console.log("not complete");
		}else{
			//console.log("complete");
		}
	}
	this.intZoom=intZoom;
	if (intZoom > this.tileSource.maxzoom) {
	    intZoom = this.tileSource.maxzoom;
	}
        if (!this.visibleZoom) {
            this.visibleZoom = intZoom;
            this.oldIntZoom = intZoom;
        }
        this.faktor = Math.pow(2, intZoom); //????????
        var zoomDelta = zoom - intZoom;
        this.sc = Math.pow(2, zoomDelta);

	//Calculate the next displayed layer
	this.loadingZoomLevel=intZoom;
	if(this.visibleZoom < intZoom){
		if(Math.abs(this.visibleZoom - intZoom) < 4){
			this.loadingZoomLevel=parseInt(this.visibleZoom) +1;
		}

	}
        //draw the layer with current zoomlevel
        this.draw(this.map, lat, lng, moveX, moveY, this.loadingZoomLevel, zoom ,this.tileSource.src);
	this.layers[this.loadingZoomLevel]["layerDiv"].style.visibility = "";


        //if the current zoomlevel is not loaded completly, there must be a second layer displayed
        if (intZoom != this.visibleZoom) {
		if(this.visibleZoom < intZoom+2){
		    this.draw(this.map, lat, lng, moveX, moveY, this.visibleZoom, zoom ,this.tileSource.src);
		    this.layers[this.visibleZoom]["layerDiv"].style.visibility = "";
		}else{
			this.layers[this.visibleZoom]["layerDiv"].style.visibility = "hidden";
		}

        }
	//preload for zoom out

        if (intZoom == this.visibleZoom) {
		    this.draw(this.map, lat, lng, moveX, moveY, this.visibleZoom -1, zoom ,this.tileSource.src);
		    this.layers[this.visibleZoom -1]["layerDiv"].style.visibility="hidden";
	}
	
	/*
	if(this.finalDraw){
		for(var i=0; i < this.tileOverlays.length;i++){
		    this.draw(this.map, lat, lng, moveX, moveY, this.visibleZoom, zoom ,this.tileOverlays[i].src);
		}
	}
	*/

        if (this.layers[this.loadingZoomLevel]["loadComplete"]) {
            if (this.visibleLayer != intZoom) {
		this.layers[this.loadingZoomLevel]["loadComplete"]=false;
                this.hideLayer(this.visibleZoom);
                //this.layers[this.visibleZoom]["layerDiv"].style.visibility = "hidden";
                this.visibleZoom = this.loadingZoomLevel;
                //this.layers[this.visibleZoom]["layerDiv"].style.visibility = "";
		}
	}
	if(this.quadtreeTimeout){
		clearTimeout(this.quadtreeTimeout);
	}
	if (this.loadingZoomLevel != intZoom ) {
			//load the level again
				//console.log("again:"+this.visibleZoom+":"+this.loadingZoomLevel+":"+intZoom);

			//this.layer(map, lat, lng, moveX, moveY, zoom) 
			var that = this;
			var tempFunction = function () {
			    that.layer(map, lat, lng, moveX, moveY);
				//console.log("again:"+that.visibleZoom+":"+that.loadingZoomLevel+":"+intZoom+":"+that.getZoom()+":"+zoom);
			};
			/*
			if(this.quadtreeTimeout){
				clearTimeout(this.quadtreeTimeout);
			}
			*/
			this.quadtreeTimeout = window.setTimeout(tempFunction, 200);
	}
        
        if (this.oldIntZoom != this.intZoom) {
            if (this.oldIntZoom != this.visibleZoom) {
                this.hideLayer(this.oldIntZoom);
            }
        }
        this.oldIntZoom = intZoom;

        if(this.delayedOverlay){
                window.clearTimeout(this.delayedOverlay);
        }
		
		//console.log("normalize",this.oldZoom,this.zoom(),this.moveX,this.moveY);
		if(this.doTheOverlayes || this.finalDraw || this.layerOldZoom==this.zoom()){
			var startTime=new Date();
			this.lastDX=this.moveX;
			this.lastDY=this.moveY;
			this.renderOverlays();
			this.layerOldZoom=this.zoom();	
			var duration=(new Date() - startTime);
			if(duration > 10){
				this.doTheOverlayes=false;
			}else{
				this.doTheOverlayes=true;
			}
		}else{
			this.hideOverlays();
		}
     
            var that = this;
            var func = function () {
                that.blocked = false;
            };
	    if(this.layerBlockTimeout){
		clearTimeout(this.layerBlockTimeout);
	    }	
            this.layerBlockTimeout=window.setTimeout(func, 20);
	    this.finalDraw=false;
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

    this.draw = function (map, lat, lng, moveX, moveY, intZoom, zoom, tileFunc) {

        this.framesCounter++;
        var that = this;
        var tempFunction = function () {
            that.framesCounter--
        };
        window.setTimeout(tempFunction, 1000);

        //console.log("draw");
        var faktor = Math.pow(2, intZoom);

        //create new layer
        if (!this.layers[intZoom]) {
            var tile = getTileNumber(lat, lng, intZoom);
            this.layers[intZoom] = new Array();
            this.layers[intZoom]["startTileX"] = tile[0];
            this.layers[intZoom]["startTileY"] = tile[1];
            this.layers[intZoom]["startLat"] = lat2y(lat);
            this.layers[intZoom]["startLng"] = lng;
            this.layers[intZoom]["images"] = new Object();
            var layerDiv = document.createElement("div");
            layerDiv.setAttribute("zoomlevel", intZoom);
            layerDiv.style.position = "absolute";




            //higher zoomlevels are places in front of lower zoomleves.
            //no z-index in use.  z-index could give unwanted side effects to you application if you use this lib.
            var layers = map.childNodes;
            var appended = false;
            for (var i = layers.length - 1; i >= 0; i--) {
                var l = layers.item(i);
                if (l.getAttribute("zoomlevel") < intZoom) {
                    this.map.insertBefore(layerDiv, l);
                    appended = true;
                    //break;
                }
            }
            if (!appended) {
                //the new layer has the highest zoomlevel
                this.map.appendChild(layerDiv);
            }

            //for faster access, a referenz to this div is in an array	
            this.layers[intZoom]["layerDiv"] = layerDiv;
            var latDelta = 0;
            var lngDelta = 0;
        } else {
            //The layer with this zoomlevel already exists. If there are new lat,lng value, the lat,lng Delta is calculated
            var layerDiv = this.layers[intZoom]["layerDiv"];
            var latDelta = lat2y(lat) - this.layers[intZoom]["startLat"];
            var lngDelta = lng - this.layers[intZoom]["startLng"];
        }
        layerDiv.style.visibility = "hidden";
        layerDiv.style.opacity=1;

        //if the map is moved with drag/drop, the moveX,moveY gives the movement in Pixel (not degree as lat/lng)
        //here the real values of lat, lng are caculated
        this.movedLng = (this.layers[intZoom]["startTileX"] / faktor - moveX / this.tileW) * 360 - 180 + lngDelta;
        var movedLat360 = (this.layers[intZoom]["startTileY"] / faktor - moveY / this.tileH) * 360 - 180 - latDelta;
        this.movedLat = -y2lat(movedLat360); // -latDelta;  //the bug
        //calculate real x,y
        var tile = getTileNumber(this.movedLat, this.movedLng, intZoom);
        var x = tile[0];
        var y = tile[1];

        var intX = Math.floor(x);
        var intY = Math.floor(y);


        var startX = this.layers[intZoom]["startTileX"];
        var startY = this.layers[intZoom]["startTileY"];


        var startIntX = Math.floor(startX);
        var startIntY = Math.floor(startY);

        var startDeltaX = -startX + startIntX;
        var startDeltaY = -startY + startIntY;

        var dx = x - startX;
        var dy = y - startY;

        var dxInt = Math.floor(dx - startDeltaX);
        var dyInt = Math.floor(dy - startDeltaY);
        var dxDelta = dx - startDeltaX;
        var dyDelta = dy - startDeltaY;



        //set all images to hidden (only in Array) - the values are used later in this function
        for (var vimg in this.layers[intZoom]["images"]) {
            this.layers[intZoom]["images"][vimg]["visibility"] = false;
        }

        //for debug only
        var width = this.width;
        var height = this.height;

        var zoomDelta = zoom - intZoom;
        sc = Math.pow(2, zoomDelta);

//        if (sc < 1) sc = 1;
        if (sc < 0.5) sc = 0.5;
        //here the bounds of the map are calculated.
        //there is NO preload of images. Preload makes everything slow
        minX = Math.floor((-width / 2 / sc) / this.tileW + dxDelta);
        maxX = Math.ceil((width / 2 / sc) / this.tileW + dxDelta);
        minY = Math.floor((-height / 2 / sc) / this.tileH + dyDelta);
        maxY = Math.ceil((height / 2 / sc) / this.tileH + dyDelta);

        //now the images are placed on to the layer
        for (var i = minX; i < maxX; i++) {
            for (var j = minY; j < maxY; j++) {
                var xxx = Math.floor(startX + i);
                var yyy = Math.floor(startY + j);

                //The world is recursive. West of America is Asia.
                var xx = xxx % faktor;
                //var yy=yyy % faktor;
                var yy = yyy;
                if (xx < 0) xx = xx + faktor; //modulo function gives negative value for negative numbers
                if (yy < 0) continue;
                if (yy >= faktor) continue;

                var src = tileFunc(xx, yy, intZoom);
                var id = src + "-" + xxx + "-" + yyy;

/*
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
                        var id="http://"+server+".tile.openstreetmap.org/"+intZoom+"/"+xxx+"/"+yyy+".png";
			*/

                //draw images only if they don't exist on the layer	
                if (this.layers[intZoom]["images"][id] == null) {

                    var img = document.createElement("img");
                    img.style.visibility = "hidden";
                    img.style.position = "absolute";
                    img.setAttribute("src", src);
                    img.style.left = i * this.tileW + "px";
			//console.log(i,i*this.tileW);
                    img.style.top = j * this.tileH + "px";
                    img.style.width = this.tileW + "px";
                    img.style.height = this.tileH + "px";


                    //add img before SVG, SVG will be visible 
                    if (layerDiv.childNodes.length > 0) {
                        layerDiv.insertBefore(img, layerDiv.childNodes.item(0));
                    } else {
                        layerDiv.appendChild(img);
                    }

                    //To increase performance all references are in an array
			
                    this.layers[intZoom]["images"][id] = new Object();
                    this.layers[intZoom]["images"][id]["img"] = img;
                    this.layers[intZoom]["images"][id]["array"] = new Array();;
                    this.layers[intZoom]["images"][id]["array"].push(img);
                    this.layers[intZoom]["loadComplete"] = false;
				
			//tileOverlays
			for(ov in this.tileOverlays){
				//console.log(ov);
				var ovObj=this.tileOverlays[ov];
				var ovImg=img.cloneNode(true);
				var src=ovObj.src(xx,yy,intZoom);	
				var ovId=id+"_"+ov;
				//console.log(ovId);
				//console.log(src);	
				ovImg.setAttribute("src",src);
				ovImg.setAttribute("overlay",ov);
				    Event.attach(ovImg, "load", this.imgLoaded, this, false);
				layerDiv.appendChild(ovImg);
				    this.layers[intZoom]["images"][id]["array"].push(ovImg);
				    //this.layers[intZoom]["images"][ovId] = new Object();
				    //this.layers[intZoom]["images"][ovId]["img"] = ovImg;
				    //this.layers[intZoom]["loadComplete"] = false;
			}
                    //}	
                    //if the images are loaded, they will get visible in the imgLoad function
                    Event.attach(img, "load", this.imgLoaded, this, false);
                    Event.attach(img, "error", this.imgError, this, false);
                } else {
                }
		var temp=Math.round(Math.random()*255);
                if (!this.css3d) {
			var imgArray=this.layers[intZoom]["images"][id]["array"];
				for(var iii=0; iii<imgArray.length;iii++){	
				    //var sc = Math.pow(2, zoomDelta);
				    var ddX = (tile[0] - intX) + Math.floor(dxDelta);
				    var ddY = (tile[1] - intY) + Math.floor(dyDelta);

				    var tileW = Math.round(this.tileW * sc);
				    var tileH = Math.round(this.tileH * sc);

				    var left = Math.floor((-ddX) * tileW + i * tileW);
				    var top = Math.floor(-ddY * tileH + j * tileH);
				    var right = Math.floor((-ddX) * tileW + (i + 1) * tileW);
				    var bottom = Math.floor(-ddY * tileH + (j + 1) * tileH);
				    //var imgArray[i] = this.layers[intZoom]["images"][id]["img"];
				    imgArray[iii].style.left = left + "px";
				    imgArray[iii].style.top = top + "px";
				    imgArray[iii].style.height = (right - left) + "px";
				    imgArray[iii].style.width = (bottom - top) + "px";
					var c="rgb("+temp+","+(255-temp)+",33)";
					//console.log(c);
				    //imgArray[iii].style.border="1px solid "+c;
				}
                }

                //set all images that should be visible at the current view to visible (only in the layer);
                this.layers[intZoom]["images"][id]["visibility"] = true;

            }
        }

        //remove all images that are not loaded and are not visible in current view.
        //if the images is out of the current view, there is no reason to load it. 
        //Think about fast moving maps. Moving is faster than loading. 
        //If you started in London and are already in Peking, you don't care
        //about images that show vienna for example
        //this code is useless for webkit browsers (march 2010) because of bug:
        //https://bugs.webkit.org/show_bug.cgi?id=6656
        for (var vimg in this.layers[intZoom]["images"]) {
            if (this.layers[intZoom]["images"][vimg]["visibility"]) {
		if (this.layers[intZoom]["images"][vimg]["array"][0].getAttribute("loaded") == "yes") {
			var overlayImages=this.layers[intZoom]["images"][vimg]["array"];
			for(var o=0; o<overlayImages.length;o++){
				if(overlayImages[o].getAttribute("loaded") == "yes") {
				    overlayImages[o].style.visibility = "";
				}
			}
		}
            } else {
		var overlayImages=this.layers[intZoom]["images"][vimg]["array"];
		for(var o=0; o<overlayImages.length;o++){
			this.layers[intZoom]["images"][vimg]["array"][o].style.visibility = "hidden";
			//delete img if not loaded and not needed at the moment
			if (this.layers[intZoom]["images"][vimg]["array"][o].getAttribute("loaded") != "yes") {
				    layerDiv.removeChild(this.layers[intZoom]["images"][vimg]["array"][o]);
					//console.log("removed oerlay image");
			    //layerDiv.removeChild(this.layers[intZoom]["images"][vimg]["img"]);
				
			}
                }
	    delete this.layers[intZoom]["images"][vimg]["img"];
	    delete this.layers[intZoom]["images"][vimg];
            }
        }

        //move and zoom the layer
        //The 3D CSS is used to increase speed. 3D CSS is using hardware accelerated methods to zoom and move the layer.
        //every layer is moved independently - maybe not the best approach, but maybe the only working solution
        var zoomDelta = zoom - intZoom;
        var sc = Math.pow(2, zoomDelta);
        var left = -dxDelta * this.tileW;
        var top = -dyDelta * this.tileH;

        if (this.css3d) {
            //document.getElementById("debug").textContent=zoomDelta+": "+sc+": "+left+": "+top;
            var scale = " scale3d(" + sc + "," + sc + ",1) ";
/*	
			var zx=this.zoomCenterDeltaX;	
			var zy=this.zoomCenterDeltaY;	
			left=left-zx*sc;
			top=top-zx*sc;
			*/

            layerDiv.style['-webkit-transform-origin'] = (-1 * left) + "px " + (-1 * top) + "px";
            var transform = 'translate3d(' + left + 'px,' + top + 'px,0px)  ' + scale;
            layerDiv.style.webkitTransform = transform;
        } else {
            //layerDiv.style.left=left+"px";
            //layerDiv.style.top+"px";
        }

        //set the visibleZoom to visible
        layerDiv.style.visibility = "";

        //not needed images are removed now. Lets check if all needed images are loaded already
	var notLoaded=0;	
	var total=0;	
	for (var vimg in this.layers[this.loadingZoomLevel]["images"]) {
		total++;
		var img=this.layers[this.loadingZoomLevel]["images"][vimg]["array"][0];
		if(!(img.getAttribute("loaded")=="yes")){
			notLoaded++;
		}
	}
	if(notLoaded < 1){
			this.layers[this.loadingZoomLevel]["loadComplete"]=true;
	}
        if(this.loadingZoomLevel==intZoom){
		this.imgLoadInfo(total,notLoaded);
        }

    }
    // ====== END OF DRAW ======	




    //
    //  this function was for BING tiles. It's not in use but I don't want to dump it.
    //

    function mkbin(z, x, y) {
        var nn = parseInt(x.toString(2)) + parseInt(y.toString(2)) * 2;
        n = "";
        for (var i = 0; i < 30; i++) {
            var restX = parseInt(x / 2);
            var restY = parseInt(y / 2);
            var xx = (x / 2 - restX) * 2;
            var yy = (y / 2 - restY) * 2;
            x = restX;
            y = restY;
            s = Math.round(xx + yy * 2);
            n = s + n;
            if (x == 0 && y == 0) break;
        }
        return n;
    }


	//fade effect for int zoom change

	this.fadeOutTimeout=null;
	this.fadeOut=function(div,alpha){
		if(this.fadeOutTimeout){
			clearTimeout(this.fadeOutTimeout);
		}
		if(alpha >0){
			div.style.opacity=alpha;
			div.style.filter = "alpha( opacity="+(alpha*100)+" )";
			var that=this;
			var tempFunction=function(){
				that.fadeOut(div,alpha -0.2);
			}
			this.fadeOutTimeout=setTimeout(tempFunction, 40);

		}else{
			div.style.visibility="hidden";
		}
		
	}

    //
    //this function trys to remove images if they are not needed at the moment.
    //For webkit it's a bit useless because of bug
    //https://bugs.webkit.org/show_bug.cgi?id=6656
    //For Firefox it really brings speed
    // 

    this.hideLayer = function (zoomlevel) {
        if (this.intZoom != zoomlevel) {
            if (this.layers[zoomlevel]) {
                //this.layers[zoomlevel]["layerDiv"].style.visibility = "hidden";
                this.layers[zoomlevel]["layerDiv"].style.opacity=1;
		this.fadeOut(this.layers[zoomlevel]["layerDiv"],1);
            }
        }

        //delete img if not loaded and not needed at the moment
        //for(var layer in this.layers){
        //var zoomlevel=layer;
        //for(var vimg in this.layers[zoomlevel]["images"]){
	if(!this.layers[zoomlevel]){
		return;
	}

        for (var vimg in this.layers[zoomlevel]["images"]) {
            if (this.layers[zoomlevel]["images"][vimg]) {
                if (this.layers[zoomlevel]["images"][vimg]["img"]) {
                    if (this.layers[zoomlevel]["images"][vimg]["img"].getAttribute("loaded") != "yes") {
                        if (zoomlevel != this.intZoom) {
                            //this.layers[zoomlevel]["images"][vimg]["img"].setAttribute("src", "#");
				//try{
				    //this.layers[zoomlevel]["layerDiv"].removeChild(this.layers[zoomlevel]["images"][vimg]["img"]);
					var overlayImages=this.layers[zoomlevel]["images"][vimg]["array"];
					for(var o=0; o<overlayImages.length;o++){
						this.layers[zoomlevel]["layerDiv"].removeChild(this.layers[zoomlevel]["images"][vimg]["array"][o]);
						//console.log("also removed overlay image"+o);
					}

				//}catch(e){}
                            delete this.layers[zoomlevel]["images"][vimg]["img"];
                            delete this.layers[zoomlevel]["images"][vimg];
                        }
                    }

                }
            }
        }

	/*
	//not needed images are removed now. Lets check if all needed images are loaded already
                for (var vimg in this.layers[zoomlevel]["images"]) {
                        var img=this.layers[zoomlevel]["images"][vimg]["img"];
                        //console.log(img.getAttribute("loaded"));
                        if(!(img.getAttribute("loaded")=="yes")){
                                console.log("here: "+img.getAttribute("src"));
                        }
                }
	*/
	

    }

    //handling images of tile overlays
    this.ovImgLoaded=function(evt){
        if (evt.target) {
            var img = evt.target;
        } else {
            var img = evt.srcElement;
        }
        img.style.visibility = "";
    }

    //
    // method is called if an image has finished loading  (onload event)
    //
    this.imgLoaded = function (evt) {
        if (evt.target) {
            var img = evt.target;
        } else {
            var img = evt.srcElement;
        }
        var loadComplete = true;
        img.style.visibility = "";
        img.setAttribute("loaded", "yes");
        if (!img.parentNode) return;
	var notLoaded=0;
	var total=0;
        var zoomlevel = img.parentNode.getAttribute("zoomlevel");
        for (var i = 0; i < img.parentNode.getElementsByTagName("img").length; i++) {
		var theimg=img.parentNode.getElementsByTagName("img").item(i);
		if(theimg.getAttribute("overlay")){
			continue;
		}
		total++;
            if (theimg.getAttribute("loaded") != "yes") {
		notLoaded++;
                loadComplete = false;
            }
        }
	if(this.loadingZoomLevel==zoomlevel){
	this.imgLoadInfo(total,notLoaded);
	}

        this.layers[zoomlevel]["loadComplete"] = loadComplete;
        if (loadComplete) {
            if (this.loadingZoomLevel == zoomlevel) {
                //if(Math.abs(this.intZoom - zoomlevel) < Math.abs(this.intZoom - this.visibleZoom)){
                //this.layers[this.visibleZoom]["layerDiv"].style.visibility="hidden";
                this.hideLayer(this.visibleZoom);
                this.hideLayer(this.visibleZoom +1);  //no idea why
                this.visibleZoom = zoomlevel;
                //this.layers[this.visibleZoom]["layerDiv"].style.visibility = "";
		/*
		if(this.loadingZoomLevel!=this.intZoom){
			//alert("genau da");
			this.setCenter(this.getCenter(),this.getZoom());
		}
		*/
            }
        }
    }
    //
    // Image load error  (there maybe is an IE bug)
    //
    this.imgError = function (evt) {
        if (evt.target) {
            var img = evt.target;
        } else {
            var img = evt.srcElement;
        }
        if (!img.parentNode) return;
        //img.parentNode.removeChild(img);
	img.setAttribute("src","http://khtml.org/notfound.png");
        //evt.target.style.backgroundColor="lightgrey";
        this.imgLoaded(evt);
    }

    //next function is from wiki.openstreetmap.org
    var getTileNumber = function (lat, lon, zoom) {
        var xtile = ((lon + 180) / 360 * (1 << zoom));
        var ytile = ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1 << zoom));
        var returnArray = new Array(xtile, ytile);
        return returnArray;
    }


    //----------------------------------------------------------
    //map is positioned absolute and is an a clone of the original map div.
    //on window resize it must be positioned again
    //
    //if there are problems with CSS margin, padding, border,.. this is the place to fix it	

        this.calculateMapSize=function(){
                //this method is very slow in 2010 browsers
		var el = this.mapParent;

                if (el.currentStyle){
                        var style = el.currentStyle;
                }else if (window.getComputedStyle){
                        var style = document.defaultView.getComputedStyle(el,null);
                }
		//alert(style.float);
                var borderTop=parseInt(style.borderTopWidth);
                if(isNaN(borderTop))borderTop=0;
                var borderLeft=parseInt(style.borderLeftWidth);
                if(isNaN(borderLeft))borderLeft=0;
                var borderRight=parseInt(style.borderRightWidth);
                if(isNaN(borderRight))borderRight=0;
                var borderBottom=parseInt(style.borderBottomWidth);
                if(isNaN(borderBottom))borderBottom=0;

                var paddingTop=parseInt(style.paddingTop);
                var paddingBottom=parseInt(style.paddingBottom);
                var paddingLeft=parseInt(style.paddingLeft);
                var paddingRight=parseInt(style.paddingRight);

		var _dt= paddingTop;
		var _dl= paddingLeft;
		var _db= paddingBottom;
		var _dr= paddingRight;
                //var deltaTop=borderTop;
                //var deltaLeft=borderLeft;
                var _w=el.offsetWidth -borderLeft - borderRight -paddingLeft - paddingRight;
                var _h=el.offsetHeight -borderTop - borderBottom -paddingBottom -paddingTop;
                var _y=borderTop +paddingTop;
                var _x=borderLeft +paddingLeft;
		var doDelta=true;
                while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
			_x += el.offsetLeft - el.scrollLeft;
			_y += el.offsetTop - el.scrollTop;
			if (el.currentStyle){
				var style = el.currentStyle;
			}else if (window.getComputedStyle){
				var style = document.defaultView.getComputedStyle(el,null);
			}
			if(doDelta){
				if(style){
					//console.log(_dt,_dl);
					if(style.position=="absolute"){
						doDelta=false;
					}
					if(style.float=="left" || style.float=="right"){
						console.log(_dt,_dl);
	
						//_dl+= -el.offsetLeft ;
						//_dt+= -el.offsetTop  ; 
						//console.log(_dt,_dl);
					}
				}
				if(doDelta){
				_dl+= el.offsetLeft + el.scrollLeft ;
				_dt += el.offsetTop + el.scrollTop ;
				}
				//console.log(borderLeft,borderTop);
				_dl+=borderLeft/2;  //no idea why
				_dt+=borderTop/2;
				
			}

                        //log(_x+" : "+_y);
                        //el = el.parentNode;
                        el = el.offsetParent;
                }
                var mapsize={ top: _y, left: _x,width:_w,height:_h,deltaTop: _dt,deltaLeft:_dl,deltaBottom:_db,deltaRight:_dr };
                return mapsize;
        }


	this.redraw=function(){
	    this.setMapPosition() ;
	}
    this.setMapPosition = function () {
	this.mapsize=this.calculateMapSize();

	var el=this.mapParent;
	if (el.currentStyle){
		var style = el.currentStyle;
	}else if (window.getComputedStyle){
		var style = document.defaultView.getComputedStyle(el,null);
	}

        //               this.width=obj.offsetWidth;
        //              this.height=obj.offsetHeight;
	//top=relativetop;
	//left=relativeleft;
        this.mapTop = this.mapsize.top;// + this.mapsize.deltaTop;
        this.mapLeft = this.mapsize.left;// + this.mapsize.deltaLeft;
        this.width = this.mapsize.width;
        this.height = this.mapsize.height;
	//if (style.position == "absolute" ) {
            relativetop = this.mapsize.deltaTop;
            relativeleft = this.mapsize.deltaLeft;
	/*
        }else{
            relativetop = this.mapsize.top + this.mapsize.deltaTop;
            relativeleft = this.mapsize.left + this.mapsize.deltaLeft;
        }
	*/


        this.clone.style.top = relativetop + "px";
        this.clone.style.left = relativeleft + "px";
        this.clone.style.width = this.mapsize.width + "px";
        this.clone.style.height = this.mapsize.height + "px";

        this.clone.style.position = "absolute";
        this.clone.style.overflow = "hidden";

        this.map.style.left = this.mapsize.width / 2 + "px";
        this.map.style.top = this.mapsize.height / 2 + "px";
        //this.mapParent.appendChild(this.clone);
        var center = this.getCenter();
	if(!center){
		return;
	}
        var zoom = this.getZoom();
	//this.clearMap();
        if (zoom) {
            this.centerAndZoom(this.getCenter(), this.getZoom());
        }
    }

    //?????????
    this.clearMap=function(){
	if(!this.map)return;
	while(this.map.firstChild){
		this.map.removeChild(this.map.firstChild);
//		console.log("cleared");
	}
	while(this.layers.length >0){
		this.layers.pop();
	}
	this.redraw();
    }	

    //functions from wiki gps2xy 
    var lat2y = function (a) {
        return 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + a * (Math.PI / 180) / 2));
    }
    var y2lat = function (a) {
        return 180 / Math.PI * (2 * Math.atan(Math.exp(a * Math.PI / 180)) - Math.PI / 2);
    }

    //the image load information in the upper right corner
    this.imgLoadInfo=function(total,missing){
		if(!this.loadInfoDiv){
			this.loadInfoDiv=document.createElement("div");
			this.loadInfoDiv.style.position="absolute";
			this.loadInfoDiv.style.top="0px";
			this.loadInfoDiv.style.right="0px";
			this.loadInfoDiv.style.backgroundColor="white";
			this.loadInfoDiv.style.border="1px solid gray";
			this.loadInfoDiv.style.fontSize="10px";
			this.map.parentNode.appendChild(this.loadInfoDiv);
		}
		if(missing==0){
			this.loadInfoDiv.style.display="none";			
		}else{
			this.loadInfoDiv.style.display="";			
			while(this.loadInfoDiv.firstChild){
				this.loadInfoDiv.removeChild(this.loadInfoDiv.firstChild);
			}
			var tn=document.createTextNode(missing+" images to load");
			this.loadInfoDiv.appendChild(tn);
		}
    }


    //
    //
    //  INIT kmap
    //
    //

    this.internetExplorer = false;
    if (navigator.userAgent.indexOf("MSIE") != -1) {
        this.internetExplorer = true;
        //alert("Sorry, Internet Explorer does not support this map, please use a good Browser like chrome, safari, opera.");
    }
    if (navigator.userAgent.indexOf("Android") != -1) {
        //this.internetExplorer=true;
        //wordaround for Android - Android is not a good browser, remembers me to IE 5.5
          var that=this;
          var tempFunction=function () {that.blocked=false};
          setInterval(tempFunction,300);

    }
    this.position=new Object();

    //mapnic tiles from OSM
    this.tiles({
        maxzoom:18,
        minzoom:1,
        src:function(x,y,z){

		var hashval = (x + y) % 3;
		switch (hashval) {
		case 0:
		    var server = "a";
		    break;
		case 1:
		    var server = "b";
		    break;
		case 2:
		    var server = "c";
		    break;
		default:
		    var server = "f";
		}

		var src = "http://" + server + ".tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png";
		//              var src="http://khm1.google.com/kh/v=58&x="+x+"&s=&y="+y+"&z="+z+"&s=Gal";
		return src;

        },
        copyright:"osm"
    })

    this.wheelSpeedConfig = new Array();
    this.wheelSpeedConfig["acceleration"] = 2;
    this.wheelSpeedConfig["maxSpeed"] = 2;
    //	alert(navigator.userAgent);
    this.wheelSpeedConfig["animate"] = false;
    if (navigator.userAgent.indexOf("AppleWebKit") != -1) {
        this.wheelSpeedConfig["animate"] = true;
    }
    if (navigator.userAgent.indexOf("Opera") != -1) {
        this.wheelSpeedConfig["animate"] = false;
    }
    this.wheelSpeedConfig["animate"] = false;
    this.wheelSpeedConfig["digizoom"] = true;
    this.wheelSpeedConfig["zoomAnimationSlowdown"] = 0.02;
    this.wheelSpeedConfig["animationFPS"] = 50;
    this.wheelSpeedConfig["moveAnimateDesktop"] = true;
    this.wheelSpeedConfig["moveAnimationSlowdown"] = 0.9;
    this.wheelSpeedConfig["rectShiftAnimate"] = false;
    this.wheelSpeedConfig["rectShiftAnimationTime"] = 500;
    this.wheelSpeedConfig["animateMinSpeed"]=0.001;

    //variables for performance check
    this.wheelEventCounter = 0;
    this.framesCounter = 0;

    this.mapParent = map;
    //	mapInit=map;
    this.clone = map.cloneNode(true); //clone is the same as the map div, but absolute positioned
    this.clone = document.createElement("div");
    this.clone.removeAttribute("id");
//    this.clone.style.overflow = "hidden";
    if (map.firstChild) {
        map.insertBefore(this.clone, map.firstChild);
    } else {
        map.appendChild(this.clone);
    }

    //this.setMapPosition();
    this.map = document.createElement("div"); //this is the div that holds the layers, but no marker and svg overlayes
    this.map.style.position = "absolute";
    this.clone.appendChild(this.map);
    //this.getSize();

    this.setMapPosition();


    //div for markers
    this.overlayDiv = document.createElement("div");
    //this.overlayDiv.style.width = "100%";
    //this.overlayDiv.style.height = "100%";
    this.overlayDiv.style.position = "absolute";
    //this.overlayDiv.style.overflow = "hidden";
    //this.overlayDiv.style.border = "1px solid black";
    this.clone.appendChild(this.overlayDiv);


    //distance tool
    this.distanceMeasuring = "no";
    this.moveMarker = null;
    this.measureLine = null;
    this.moveAnimationMobile = true;
    this.moveAnimationDesktop = false;
    this.moveAnimationBlocked = false;

    this.lastMouseX = this.width / 2;
    this.lastMouseY = this.height / 2;

    this.layers = new Array();
    this.overlays = new Array();
    this.visibleZoom = null;
    this.oldVisibleZoom = null;
    this.intZoom = null;

    this.moveX = 0;
    this.moveY = 0;

    this.lastMoveX = 0;
    this.lastMoveY = 0;
    this.lastMoveTime = 0;

    this.startMoveX = 0;
    this.startMoveY = 0;
    this.sc = 1;
    this.blocked = false;

    this.tileW = 256;
    this.tileH = 256;
    this.position.zoom = 1;
    this.movestarted = false;

    //touchscreen
    this.mousedownTime = null;
    this.doubleclickTime = 400;
    //mouse
    this.mousedownTime2 = null;
    this.doubleclickTime2 = 500;

    this.zoomOutTime = 1000;
    this.zoomOutSpeed = 0.01;
    this.zoomOutInterval = null;
    this.zoomOutStarted = false;

    this.zoomSpeedTimer = null;
    this.zoomAcceleration = 1;

    this.css3d = false;
    if (navigator.userAgent.indexOf("iPhone OS") != -1) {
        this.css3d = true;
    }
    if (navigator.userAgent.indexOf("iPad") != -1) {
        this.css3d = false;
    }
    if (navigator.userAgent.indexOf("Safari") != -1) {
	    if (navigator.userAgent.indexOf("Mac") != -1) {
			this.css3d = false;   //errors in chrome 5 - but speed is ok without css3d
	    }else{
			this.css3d = true;   //linux for example is ok
	    }
    }
    if (navigator.userAgent.indexOf("Android") != -1) {
        this.css3d = false;
    }
        

    if (this.internetExplorer) {
        var w = map;
    } else {
        var w = window;
        // how to do that in ie?
        Event.attach(window, "resize", this.setMapPosition, this, false);
    }
    if (navigator.userAgent.indexOf("Konqueror") != -1) {
        var w = map;
    }
    Event.attach(map, "touchstart", this.start, this, false);
    Event.attach(map, "touchmove", this.move, this, false);
    Event.attach(map, "touchend", this.end, this, false);
    Event.attach(w, "mousemove", this.mousemove, this, false);
    Event.attach(map, "mousedown", this.mousedown, this, false);
    Event.attach(w, "mouseup", this.mouseup, this, false);
    Event.attach(w, "orientationchange", this.reSize, this, false);
    Event.attach(map, "DOMMouseScroll", this.mousewheel, this, false);
    Event.attach(map, "dblclick", this.doubleclick, this, false);
//    Event.attach(map, "DOMAttrModified", alert(8), this, false);
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
    var fn = function (e) {
        a.unshift(e || window.event);
        return f.apply((fc ? fc : o), a);
    }
    if (o.addEventListener) {
        if (navigator.appName.indexOf("Netscape") == -1) {
            if (t == "DOMMouseScroll") {
                t = "mousewheel";
            }
        }
        if (navigator.userAgent.indexOf("Safari") != -1) {
            if (t == "DOMMouseScroll") {
                o.onmousewheel = fn;
            } else {
                o.addEventListener(t, fn, c);
            }
        } else {
            o.addEventListener(t, fn, c);
        }
    } else {
        if (t == "DOMMouseScroll") {
            o.attachEvent("onmousewheel", fn);
        } else {
            o.attachEvent("on" + t, fn);
        }
    }
};
