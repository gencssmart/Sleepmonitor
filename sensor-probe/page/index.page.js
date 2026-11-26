(function(){
 var currentApp=__$$hmAppManager$$__.currentApp;
 var currentModule=currentApp.current;
 var cleanup=function(){};
 currentModule.module=DeviceRuntimeCore.Page({
 onInit:function(){},
 build:function(){
 var lines=[],pos=0,logger=null,live=null,active=null,count=0,mode=false;
 function stop(){if(live!==null){try{timer.stopTimer(live);}catch(e){}live=null;}active=null;mode=false;}
 cleanup=stop;
 function log(s){try{if(logger)logger.log(s);else console.log(s);}catch(e){}}
 function add(s){s=String(s);log(s);while(s.length>19){lines.push(s.slice(0,19));s=s.slice(19);}lines.push(s);}
 function list(name,obj,values){
 add("["+name+"]");
 if(!obj){add("Not exposed");return;}
 try{
 var keys=Object.getOwnPropertyNames(obj);
 for(var i=0;i<keys.length;i++){
 var k=keys[i],d=Object.getOwnPropertyDescriptor(obj,k);
 if(!d){add(k+" ?");continue;}
 if(!("value" in d)){add(k+" [accessor]");if(values){try{var v=obj[k];if(typeof v==="number")add(k+" = "+v);}catch(e){add("read error");}}continue;}
 var v=d.value,t=typeof v;
 add(k+(values&&(t==="number"||t==="string"||t==="boolean")?" = "+String(v):" : "+t));
 }
 add("Total: "+keys.length);
 }catch(e){add("Error: "+String(e));}
 }
 function label(y,h,s,size,color){return hmUI.createWidget(hmUI.widget.TEXT,{x:8,y:y,w:176,h:h,text:s,text_size:size,color:color,align_h:hmUI.align.CENTER_H,text_style:hmUI.text_style.WRAP});}
 label(35,32,"Sensor Probe 0.5",18,0xffffff);
 var header=label(70,30,"Ready",16,0x55ff88);
 var widgets=[];for(var i=0;i<8;i++)widgets.push(label(108+i*24,24,"",14,0xffffff));
 function render(){var total=Math.max(1,Math.ceil(lines.length/8));header.setProperty(hmUI.prop.TEXT,(pos+1)+"/"+total);for(var i=0;i<8;i++)widgets[i].setProperty(hmUI.prop.TEXT,lines[pos*8+i]||"");}
 function scan(){stop();lines=[];pos=0;try{logger=DeviceRuntimeCore.HmLogger.getLogger("SensorProbe");}catch(e){}
 var s=typeof hmSensor==="undefined"?null:hmSensor;
 if(s){try{list("Sensor IDs",s.id,true);list("Sensor events",s.event,true);}catch(e){add(String(e));}}
 list("hmSensor",s,false);
 list("hmApp",typeof hmApp==="undefined"?null:hmApp,false);
 list("hmSetting",typeof hmSetting==="undefined"?null:hmSetting,false);
 list("hmBle",typeof hmBle==="undefined"?null:hmBle,false);
 list("Runtime",typeof DeviceRuntimeCore==="undefined"?null:DeviceRuntimeCore,false);
 list("hmFS",typeof hmFS==="undefined"?null:hmFS,false);
 function inspect(name,obj,depth){if(!obj||depth<0)return;list(name,obj,false);if(depth===0)return;try{var ks=Object.getOwnPropertyNames(obj);for(var j=0;j<Math.min(ks.length,40);j++){var d=Object.getOwnPropertyDescriptor(obj,ks[j]);if(d&&d.value&&typeof d.value==="object"&&d.value!==obj)inspect(name+"."+ks[j],d.value,depth-1);}}catch(e){add(String(e));}}
 inspect("Core",DeviceRuntimeCore,1);
 var ids={};if(s){try{var names=Object.getOwnPropertyNames(s.id);for(var j=0;j<names.length;j++){var n=s.id[names[j]];if(typeof n==="number")ids[n]=names[j];}add("[Unnamed IDs 0-40]");for(var j=0;j<=40;j++)if(!ids[j])add(j+" untested");}catch(e){add(String(e));}
 var candidates=["ACTIVITY","SPORT","SLEEP","STEP","ACCELEROMETER","ACCEL","GYROSCOPE","GYRO","MOTION","ORIENTATION"];
 for(var j=0;j<candidates.length;j++){var k=candidates[j];try{var id=s.id[k];if(typeof id!=="number")continue;var o=s.createSensor(id);list(k,o,false);if(o)list(k+" proto",Object.getPrototypeOf(o),false);if(o&&typeof o.getX==="function"&&typeof o.getY==="function"&&typeof o.getZ==="function"){if(!active)active=o;add(k+" XYZ candidate");}}catch(e){add(k+" "+String(e));}}}
 add(active?"XYZ candidate found":"No XYZ getter trio");
 add("End of inventory");render();}
 function button(x,y,w,t,f){hmUI.createWidget(hmUI.widget.BUTTON,{x:x,y:y,w:w,h:38,text:t,text_size:17,normal_color:0x225599,press_color:0x448855,click_func:f});}
 button(12,305,80,"PREV",function(){if(mode)return;if(pos>0)pos--;render();});
 button(100,305,80,"NEXT",function(){if(mode)return;if((pos+1)*8<lines.length)pos++;render();});
 button(12,349,80,"SCAN",scan);
 button(100,349,80,"LIVE",function(){
 if(mode){if(live!==null){try{timer.stopTimer(live);}catch(e){}live=null;}mode=false;render();return;}
 if(!active){lines.push("No XYZ candidate");pos=Math.floor((lines.length-1)/8);render();return;}
 mode=true;count=0;
 function sample(){if(!mode||!active)return;try{var x=active.getX(),y=active.getY(),z=active.getZ();var ok=typeof x==="number"&&typeof y==="number"&&typeof z==="number"&&isFinite(x)&&isFinite(y)&&isFinite(z);count++;var a=["XYZ experimental","X: "+x,"Y: "+y,"Z: "+z,"Samples: "+count,ok?"Numeric only":"Invalid values","LIVE = stop"];header.setProperty(hmUI.prop.TEXT,"LIVE");for(var i=0;i<8;i++)widgets[i].setProperty(hmUI.prop.TEXT,a[i]||"");if(count%5===1)log(a.join(" "));}catch(e){stop();add("XYZ error "+String(e));pos=Math.floor((lines.length-1)/8);render();}}
 try{live=timer.createTimer(100,500,sample);}catch(e){stop();add("Timer error "+String(e));render();}
 });
 scan();
 },onDestroy:function(){cleanup();}
 });
})();