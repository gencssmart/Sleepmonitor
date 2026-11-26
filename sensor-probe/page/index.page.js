(function () {
 var currentApp = __$$hmAppManager$$__.currentApp;
 var currentModule = currentApp.current;
 var stop = function(){};
 currentModule.module = DeviceRuntimeCore.Page({
  onInit: function () {},
  build: function () {
   var task=null,sensor=null,read=null,count=0,active=false;
   function label(y,h,s,size,color){return hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:y,w:176,h:h,text:s,text_size:size,color:color,align_h:hmUI.align.CENTER_H,text_style:hmUI.text_style.WRAP});}
   label(38,30,"Sensor Probe 0.3",18,0xffffff);
   var status=label(72,58,"Ready",15,0x55ff88);
   var xyz=label(135,104,"X: --\nY: --\nZ: --",23,0xffffff);
   var detail=label(240,58,"Tap START",14,0xaaaaaa);
   function set(w,s){w.setProperty(hmUI.prop.TEXT,s);}
   function log(s){try{console.log("SensorProbe: "+s);}catch(e){}}
   function halt(){active=false;if(task!==null){try{timer.stopTimer(task);}catch(e){log(String(e));}task=null;}sensor=null;read=null;}
   stop=halt;
   function fail(s){halt();set(status,"Unavailable");set(xyz,"X: --\nY: --\nZ: --");set(detail,String(s).slice(0,100));log(s);}
   function sample(){
    if(!active)return;
    try{
     var v=read.call(sensor);
     if(!v || typeof v.x!=="number" || typeof v.y!=="number" || typeof v.z!=="number" || !isFinite(v.x)||!isFinite(v.y)||!isFinite(v.z)){fail("No numeric XYZ from reader");return;}
     count++;set(xyz,"X: "+v.x.toFixed(2)+"\nY: "+v.y.toFixed(2)+"\nZ: "+v.z.toFixed(2));set(detail,"Samples: "+count+"\nUnits unknown");
    }catch(e){fail("Read: "+String(e));}
   }
   function start(){
    halt();count=0;set(xyz,"X: --\nY: --\nZ: --");set(status,"Scanning");
    try{
     if(typeof hmSensor==="undefined" || !hmSensor.id){fail("hmSensor.id missing");return;}
     var ids=hmSensor.id,keys=Object.getOwnPropertyNames(ids);
     log("IDs: "+keys.map(function(k){return k+"="+String(ids[k]);}).join(", "));
     var names=keys.concat(["ACCELEROMETER","ACCEL","ACC","GRAVITY","G_SENSOR","GSENSOR"]);
     var found=names.filter(function(n,i){return names.indexOf(n)===i && /acc|grav|g_sensor|gsensor/i.test(n) && typeof ids[n]==="number";});
     if(!found.length){fail("No XYZ ID; "+keys.length+" IDs. "+keys.join(" ").slice(0,65));return;}
     var errors=[];
     for(var i=0;i<found.length;i++){
      try{
       var s=hmSensor.createSensor(ids[found[i]]);
       if(!s){errors.push(found[i]+": null");continue;}
       log(found[i]+" methods: "+Object.getOwnPropertyNames(s).join(","));
       var fn=typeof s.getCurrent==="function"?s.getCurrent:typeof s.getXYZ==="function"?s.getXYZ:null;
       if(!fn){errors.push(found[i]+": no reader");continue;}
       sensor=s;read=fn;set(status,found[i]+" (test)");break;
      }catch(e){errors.push(found[i]+": "+String(e));}
     }
     if(!read){fail(errors.join("; "));return;}
     if(typeof timer==="undefined" || typeof timer.createTimer!=="function"){fail("Timer API missing");return;}
     active=true;sample();if(active)task=timer.createTimer(500,500,sample);
    }catch(e){fail("Start: "+String(e));}
   }
   hmUI.createWidget(hmUI.widget.BUTTON,{x:20,y:305,w:152,h:38,text:"START",text_size:19,normal_color:0x225533,press_color:0x448855,click_func:start});
   hmUI.createWidget(hmUI.widget.BUTTON,{x:20,y:349,w:152,h:38,text:"STOP",text_size:19,normal_color:0x773333,press_color:0xaa5555,click_func:function(){halt();set(status,"Stopped");set(detail,"Samples: "+count);}});
  },
  onDestroy: function () {stop();}
 });
})();
