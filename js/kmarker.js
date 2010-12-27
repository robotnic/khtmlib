//
// Marker Object - work in progress
// There should be a possibility to add orbitrary html as marker
//

khtml.maplib.Marker=function(point, el,options) {

	var div = document.createElement("div");
	div.appendChild(el);
	div.style.position = "absolute";

	if(options){
		if(options.dy){
		    div.style.top = options.dy;
		}else{	
		    div.style.top = "0px";
		}
		if(options.dx){
		    div.style.left = options.dx;
		}else{	
		    div.style.left = "0px";
		}
	}else{
	    div.style.top = "0px";
	    div.style.left = "0px";
	}
	var div2=document.createElement("div");
	div2.style.position = "absolute";
	div2.appendChild(div);
	this.marker = div2;
    this.point = point;
    this.options = options;
	this.el=el

    this.init = function (mapObj) {
        this.mapObj=mapObj;
        mapObj.overlayDiv.appendChild(this.marker);
        //this.render();
    }
    this.render = function () {
        if(!this.marker)return;
        if(!this.point)return;
        if(isNaN(this.point.lat()))return;
        if(isNaN(this.point.lng()))return;
        var xy = this.mapObj.latlngToXY(this.point);
        if (xy["x"] < 0 || xy["y"] < 0) { // <---- flag  ; workaround for overflow:hidden bug
            this.marker.style.display = "none";
        } else {
            this.marker.style.display = "";
            this.marker.style.left = xy["x"] + "px";
            this.marker.style.top = (xy["y"] ) + "px";
        }
        if(!this.marker.parentNode){
                this.mapObj.overlayDiv.appendChild(this.marker);
        }
    }
    this.position=function(pos){
	if(pos){
		this.point=pos;
		this.render();
	}
        return this.point;
    }

    this.clear=function(){
        if(this.marker){
                if(this.marker.parentNode){
                        try{
                        this.mapObj.overlayDiv.removeChild(this.marker);
                        }catch(e){}
                }
        }
    }
/*
    this.moveTo = function (point) {
        this.point = point;
        this.render();
    }
*/


/* Moveable extension */

    this.makeMoveable=function(){
        Event.attach(this.marker,"mousedown",this.down,this,false);
        Event.attach(window,"mousemove",this.move,this,true);
        Event.attach(window,"mouseup",this.up,this,true);
    }
    this.moving=false;
    this.dx=0;
    this.dy=0;
    this.down=function(evt){
	this.moving=true;
        this.dx=this.marker.offsetLeft - this.mapObj.pageX(evt)
        this.dy=this.marker.offsetTop - this.mapObj.pageY(evt)
    }
    this.move=function(evt){
        if(this.moving){
                var x=this.mapObj.pageX(evt) +this.dx;
                var y=this.mapObj.pageY(evt) +this.dy;
                //this.marker.style.left=x+"px";
                //this.marker.style.top=y+"px";
                this.point=this.mapObj.XYTolatlng(x,y);
		this.render();
                evt.stopPropagation();
        }
    }
    this.up=function(){
        this.moving=false;
    }
}

