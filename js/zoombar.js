//zoombar
//licence LGPL
//Author: Bernhard Zwischenbrugger 2010

//this class expect 2 elements with specific classes in the map div
//zoombar and scrollhandle
/*
<div id="map">
<div class="zoombar" style="position:absolute;width:30px;height:221px;overflow:hidden">
<div class="scrollhandle" style="position:absolute;left:0px;top:0px;width:30px;height:300px;background-color:yellow"> </div>
<img class="scrollbar " src="scrollbar.png" style="position:absolute;left:0px;top:00px;" />
</div>
*/


khtml.maplib.ZoomUI=function(){

	//called by maplib once
        this.init=function(themap){
                this.themap=themap;
                var els=themap.mapParent.getElementsByTagName("*");
                for(var i=0;i < els.length; i++){
                        var el=els.item(i);
                        if(el.className=="scrollhandle"){
                                this.scrollhandle=el;
                        }
                        if(el.className=="zoombar"){
                                this.zoombar=el;
                        }
                }
                Event.attach(this.zoombar, "mousedown", this.down, this, false);
                Event.attach(this.zoombar, "mousemove", this.move, this, false);
                Event.attach(this.zoombar, "mouseup", this.up, this, false);
                
        }
	//called by maplib on every map change
        this.render=function(){
                var top=(22 -this.themap.zoom() )*10 ;
                var height=220 -top;
                this.scrollhandle.style.marginTop=top+"px";
        }

        this.down=function(evt){
                evt.preventDefault();
                this.moving=true;
                var y=this.themap.pageY(evt);
                var z=(22-y/10);
                this.themap.zoom(z);
                evt.cancelBubble = true;
                if (evt.stopPropagation) evt.stopPropagation();
        }
        this.move=function(evt){
                evt.preventDefault();
                if(this.moving){
                        var y=this.themap.pageY(evt);
                        var z=(22-y/10);
                        this.themap.zoom(z);
                        evt.cancelBubble = true;
                        if (evt.stopPropagation) evt.stopPropagation();
                }
        
        }
        this.up=function(evt){
                evt.preventDefault();
                this.moving=false;
                evt.cancelBubble = true;
                if (evt.stopPropagation) evt.stopPropagation();
        }
}
