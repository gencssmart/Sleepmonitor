(function(){
 var currentApp=__$$hmAppManager$$__.currentApp;
 var currentModule=currentApp.current;
 currentModule.module=DeviceRuntimeCore.Page({
 onInit:function(){},
 build:function(){
 var lines=[],pos=0,logger=null;
 function log(s){try{if(logger)logger.log(s);else console.log(s);}catch(e){}}
 function add(s){s=String(s);log(s);while(s.length>24){lines.push(s.slice(0,24));s=s.slice(24);}lines.push(s);}
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
 label(35,32,"Sensor Probe 0.4",18,0xffffff);
 var header=label(70,30,"Ready",16,0x55ff88);
 var widgets=[];for(var i=0;i<8;i++)widgets.push(label(108+i*24,24,"",14,0xffffff));
 function render(){var total=Math.max(1,Math.ceil(lines.length/8));header.setProperty(hmUI.prop.TEXT,(pos+1)+"/"+total);for(var i=0;i<8;i++)widgets[i].setProperty(hmUI.prop.TEXT,lines[pos*8+i]||"");}
 function scan(){lines=[];pos=0;try{logger=DeviceRuntimeCore.HmLogger.getLogger("SensorProbe");}catch(e){}
 var s=typeof hmSensor==="undefined"?null:hmSensor;
 if(s){try{list("Sensor IDs",s.id,true);list("Sensor events",s.event,true);}catch(e){add(String(e));}}
 list("hmSensor",s,false);
 list("hmApp",typeof hmApp==="undefined"?null:hmApp,false);
 list("hmSetting",typeof hmSetting==="undefined"?null:hmSetting,false);
 list("hmBle",typeof hmBle==="undefined"?null:hmBle,false);
 list("Runtime",typeof DeviceRuntimeCore==="undefined"?null:DeviceRuntimeCore,false);
 list("globalThis",typeof globalThis==="undefined"?null:globalThis,false);
 add("End of inventory");render();}
 function button(x,y,w,t,f){hmUI.createWidget(hmUI.widget.BUTTON,{x:x,y:y,w:w,h:38,text:t,text_size:17,normal_color:0x225599,press_color:0x448855,click_func:f});}
 button(12,305,80,"PREV",function(){if(pos>0)pos--;render();});
 button(100,305,80,"NEXT",function(){if((pos+1)*8<lines.length)pos++;render();});
 button(20,349,152,"SCAN",scan);
 scan();
 },onDestroy:function(){}
 });
})();